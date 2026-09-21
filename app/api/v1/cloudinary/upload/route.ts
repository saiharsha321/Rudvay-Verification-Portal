import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const dataUrl = formData.get("dataUrl") as string | null;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dkrgorori";
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "563857294915688";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "aEI9iGHIyLMGwxc1bbtExrTIqZ0";

    const uploadPayload = new FormData();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = "rudvay_certificate_templates";

    // Create SHA-1 signature for Cloudinary authentication
    const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    uploadPayload.append("api_key", apiKey);
    uploadPayload.append("timestamp", timestamp);
    uploadPayload.append("folder", folder);
    uploadPayload.append("signature", signature);

    if (file) {
      uploadPayload.append("file", file);
    } else if (dataUrl) {
      uploadPayload.append("file", dataUrl);
    } else {
      return NextResponse.json({ detail: "No file or dataUrl provided for Cloudinary upload" }, { status: 400 });
    }

    const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadPayload
    });

    const result = await cldRes.json();

    if (!cldRes.ok) {
      return NextResponse.json({ detail: result.error?.message || "Cloudinary upload failed" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url || result.url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Cloudinary upload internal error" }, { status: 500 });
  }
}
