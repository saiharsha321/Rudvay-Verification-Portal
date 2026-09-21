export async function uploadTemplateImageToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "rudvay_templates";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Cloudinary upload failed");
    }

    const data = await res.json();
    return data.secure_url || data.url;
  } catch (e: any) {
    console.warn("Cloudinary upload fallback to data URL:", e.message);
    // Fallback to local Data URL if Cloudinary preset is not configured yet
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
}
