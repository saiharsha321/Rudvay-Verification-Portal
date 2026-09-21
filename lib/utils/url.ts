import { NextRequest } from "next/server";

export function getAppBaseUrl(req?: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    const vUrl = process.env.VERCEL_URL.replace(/\/$/, "");
    return vUrl.startsWith("http") ? vUrl : `https://${vUrl}`;
  }
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      return `${proto}://${host}`;
    }
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://rudvay-verification-portal.vercel.app";
}
