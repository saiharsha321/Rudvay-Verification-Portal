import { NextRequest } from "next/server";

export function getAppBaseUrl(req?: NextRequest): string {
  // 1. Explicitly configured app URL via environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. Incoming request host header (e.g., certifications.rudvay.tech)
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host) {
      if (host.includes("localhost") || host.includes("127.0.0.1")) {
        return `http://${host}`;
      }
      // If host is a custom domain (not internal vercel preview URL hash)
      if (!host.endsWith(".vercel.app")) {
        return `${proto}://${host}`;
      }
    }
  }

  // 3. Browser origin (client-side context)
  if (typeof window !== "undefined" && window.location?.origin) {
    const origin = window.location.origin;
    if (!origin.includes(".vercel.app")) {
      return origin;
    }
  }

  // 4. Default official production domain
  return "https://certifications.rudvay.tech";
}

export function sanitizeVerificationUrl(url?: string, certId?: string, req?: NextRequest): string {
  const baseUrl = getAppBaseUrl(req);
  const extractId = certId || (url ? url.split("/verify/")[1] : "");

  if (!url || url.includes(".vercel.app")) {
    return extractId ? `${baseUrl}/verify/${extractId}` : baseUrl;
  }

  if (!baseUrl.includes("localhost") && url.includes("localhost")) {
    return extractId ? `${baseUrl}/verify/${extractId}` : baseUrl;
  }

  return url;
}

