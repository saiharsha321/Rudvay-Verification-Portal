from typing import Dict, Any, List, Optional
from google.cloud import firestore

from functions.templates.schema import TemplateDesignJSON, CreateTemplateRequest, UpdateTemplateRequest
from functions.shared.errors import TemplateNotFoundError, ForbiddenError
from functions.shared.logging import logger

def create_template(
    db: firestore.Client,
    owner_id: str,
    data: CreateTemplateRequest
) -> Dict[str, Any]:
    """
    Creates a new template and its initial immutable version 1.
    """
    templates_ref = db.collection("templates").document()
    template_id = templates_ref.id
    
    # Version ID format: {templateId}_v1
    version_id = f"{template_id}_v1"
    version_ref = db.collection("templateVersions").document(version_id)
    
    batch = db.batch()
    
    batch.set(templates_ref, {
        "templateId": template_id,
        "ownerId": owner_id,
        "name": data.name,
        "pageSize": data.pageSize.value,
        "orientation": data.orientation.value,
        "currentVersion": 1,
        "status": "PUBLISHED",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP
    })
    
    batch.set(version_ref, {
        "versionId": version_id,
        "templateId": template_id,
        "version": 1,
        "designJson": data.designJson.model_dump(),
        "createdBy": owner_id,
        "createdAt": firestore.SERVER_TIMESTAMP
    })
    
    batch.commit()
    logger.info(f"Template created: {template_id} version 1", user_id=owner_id)
    
    return {
        "templateId": template_id,
        "version": 1,
        "name": data.name,
        "designJson": data.designJson.model_dump()
    }

def update_template_version(
    db: firestore.Client,
    template_id: str,
    user_id: str,
    is_admin: bool,
    data: UpdateTemplateRequest
) -> Dict[str, Any]:
    """
    Updates a template and creates a new immutable version snapshot (e.g. version 2).
    Historical versions are never overwritten!
    """
    doc_ref = db.collection("templates").document(template_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise TemplateNotFoundError(f"Template {template_id} not found")
        
    t_data = doc.to_dict()
    if not is_admin and t_data.get("ownerId") != user_id:
        raise ForbiddenError("Cannot modify another coordinator's template")
        
    current_version = t_data.get("currentVersion", 1)
    new_version = current_version + 1 if data.publishNewVersion else current_version
    version_id = f"{template_id}_v{new_version}"
    
    batch = db.batch()
    
    update_payload = {
        "currentVersion": new_version,
        "updatedAt": firestore.SERVER_TIMESTAMP
    }
    if data.name:
        update_payload["name"] = data.name
        
    batch.update(doc_ref, update_payload)
    
    version_ref = db.collection("templateVersions").document(version_id)
    batch.set(version_ref, {
        "versionId": version_id,
        "templateId": template_id,
        "version": new_version,
        "designJson": data.designJson.model_dump(),
        "createdBy": user_id,
        "createdAt": firestore.SERVER_TIMESTAMP
    })
    
    batch.commit()
    logger.info(f"Template updated: {template_id} to version {new_version}", user_id=user_id)
    
    return {
        "templateId": template_id,
        "version": new_version,
        "designJson": data.designJson.model_dump()
    }

def get_template_version_design(
    db: firestore.Client,
    template_id: str,
    version: Optional[int] = None
) -> TemplateDesignJSON:
    """
    Retrieves the immutable Design JSON for a specific template version.
    """
    if version is None:
        # Fetch current version from template doc
        t_doc = db.collection("templates").document(template_id).get()
        if not t_doc.exists:
            raise TemplateNotFoundError(f"Template {template_id} not found")
        version = t_doc.to_dict().get("currentVersion", 1)
        
    version_id = f"{template_id}_v{version}"
    v_doc = db.collection("templateVersions").document(version_id).get()
    
    if not v_doc.exists:
        raise TemplateNotFoundError(f"Template version {version_id} not found")
        
    design_dict = v_doc.to_dict().get("designJson", {})
    return TemplateDesignJSON(**design_dict)
