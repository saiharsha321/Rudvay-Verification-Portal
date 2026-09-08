import { auth } from "../firebase/client";
import { INITIAL_TEMPLATES, TemplateRecord } from "../templates/default-templates";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

// Client-side localStorage fallback helper for templates
const LOCAL_STORAGE_KEY = "rudvay_templates_storage";

function getLocalTemplates(): TemplateRecord[] {
  if (typeof window === "undefined") return INITIAL_TEMPLATES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_TEMPLATES));
      return INITIAL_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TEMPLATES;
  } catch {
    return INITIAL_TEMPLATES;
  }
}

function saveLocalTemplate(tpl: {
  templateId?: string;
  name: string;
  pageSize?: "A4" | "LETTER";
  orientation?: "LANDSCAPE" | "PORTRAIT";
  designJson: any;
}): TemplateRecord {
  const current = getLocalTemplates();
  const existingIdx = tpl.templateId ? current.findIndex(t => t.templateId === tpl.templateId) : -1;

  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    const updated: TemplateRecord = {
      ...existing,
      name: tpl.name || existing.name,
      pageSize: tpl.pageSize || existing.pageSize,
      orientation: tpl.orientation || existing.orientation,
      currentVersion: (existing.currentVersion || 1) + 1,
      designJson: tpl.designJson || existing.designJson,
      updatedAt: new Date().toISOString()
    };
    current[existingIdx] = updated;
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    }
    return updated;
  } else {
    const newRecord: TemplateRecord = {
      templateId: tpl.templateId || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: tpl.name || "Certificate Template",
      pageSize: tpl.pageSize || "A4",
      orientation: tpl.orientation || "LANDSCAPE",
      currentVersion: 1,
      status: "PUBLISHED",
      designJson: tpl.designJson,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    current.push(newRecord);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    }
    return newRecord;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  if (
    contentType.includes("application/pdf") ||
    contentType.includes("image/") ||
    contentType.includes("application/octet-stream")
  ) {
    return (await res.blob()) as unknown as T;
  }

  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  // If text or other format
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requireAuth = true, headers = {}, ...rest } = options;
  const resolvedHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (!(rest.body instanceof FormData)) {
    resolvedHeaders["Content-Type"] = "application/json";
  }

  if (requireAuth && auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      resolvedHeaders["Authorization"] = `Bearer ${token}`;
    } catch (e) {
      console.warn("Failed to retrieve ID token", e);
    }
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Try the primary URL first
  const primaryUrl = API_BASE_URL.startsWith("http")
    ? `${API_BASE_URL}${cleanEndpoint}`
    : `/api/v1${cleanEndpoint}`;

  try {
    const res = await fetch(primaryUrl, {
      ...rest,
      headers: resolvedHeaders,
    });

    if (res.ok || res.status === 410) {
      return await handleResponse<T>(res);
    }

    // If 404/500 from an external host, try internal Next.js /api/v1
    if (API_BASE_URL.startsWith("http")) {
      const fallbackUrl = `/api/v1${cleanEndpoint}`;
      const fallbackRes = await fetch(fallbackUrl, {
        ...rest,
        headers: resolvedHeaders,
      });
      if (fallbackRes.ok || fallbackRes.status === 410) {
        return await handleResponse<T>(fallbackRes);
      }
    }

    let errorDetail = "An error occurred";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = await res.text() || res.statusText;
    }
    throw new Error(errorDetail);
  } catch (err: any) {
    // If primary network fetch failed (e.g. backend server on port 8000 not running)
    // Fall back to Next.js internal /api/v1 API routes
    if (API_BASE_URL.startsWith("http")) {
      try {
        const fallbackUrl = `/api/v1${cleanEndpoint}`;
        const fallbackRes = await fetch(fallbackUrl, {
          ...rest,
          headers: resolvedHeaders,
        });
        if (fallbackRes.ok || fallbackRes.status === 410) {
          return await handleResponse<T>(fallbackRes);
        }
      } catch (fallbackErr) {
        console.warn("Internal API fallback also encountered error:", fallbackErr);
      }
    }

    // Client-side fallback for templates
    if (cleanEndpoint === "/templates" && (!rest.method || rest.method === "GET")) {
      return getLocalTemplates() as unknown as T;
    }

    if (cleanEndpoint === "/templates" && rest.method === "POST" && rest.body) {
      try {
        const parsedBody = JSON.parse(rest.body as string);
        const saved = saveLocalTemplate(parsedBody);
        return saved as unknown as T;
      } catch (e) {
        console.error("Local save error:", e);
      }
    }

    if (cleanEndpoint.startsWith("/templates/") && rest.method === "GET") {
      const tplId = cleanEndpoint.replace("/templates/", "");
      const found = getLocalTemplates().find(t => t.templateId === tplId);
      if (found) return found as unknown as T;
    }

    if (cleanEndpoint.startsWith("/templates/") && rest.method === "PUT" && rest.body) {
      const tplId = cleanEndpoint.replace("/templates/", "");
      try {
        const parsedBody = JSON.parse(rest.body as string);
        const saved = saveLocalTemplate({ ...parsedBody, templateId: tplId });
        return saved as unknown as T;
      } catch (e) {
        console.error("Local update error:", e);
      }
    }

    throw err;
  }
}
