from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from functions.shared.constants import TemplatePageSize, TemplateOrientation, ElementType

class BorderConfig(BaseModel):
    style: Literal["none", "single", "double", "dashed"] = "single"
    color: str = "#0B192C"
    width: float = 2.0
    inset: float = 20.0

class TemplateElement(BaseModel):
    id: str
    type: ElementType
    x: float = Field(..., description="X coordinate from left in points or px")
    y: float = Field(..., description="Y coordinate from top in points or px")
    width: float
    height: float
    content: str = ""
    fontFamily: str = "Helvetica"
    fontSize: float = 16.0
    fontWeight: Literal["normal", "bold", "italic"] = "normal"
    alignment: Literal["left", "center", "right"] = "left"
    rotation: float = 0.0
    opacity: float = 1.0
    textColor: str = "#0B192C"
    fillColor: Optional[str] = None
    strokeColor: Optional[str] = None
    strokeWidth: float = 1.0
    visibility: bool = True

class TemplateDesignJSON(BaseModel):
    width: float = 842.0  # Default A4 Landscape points (842 x 595)
    height: float = 595.0
    backgroundColor: str = "#FFFFFF"
    accentColor: str = "#D4AF37"  # Gold
    border: BorderConfig = Field(default_factory=BorderConfig)
    elements: List[TemplateElement] = []

class CreateTemplateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    pageSize: TemplatePageSize = TemplatePageSize.A4
    orientation: TemplateOrientation = TemplateOrientation.LANDSCAPE
    designJson: TemplateDesignJSON

class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    designJson: TemplateDesignJSON
    publishNewVersion: bool = True
