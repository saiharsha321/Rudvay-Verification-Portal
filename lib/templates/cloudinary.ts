export async function uploadTemplateImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/v1/cloudinary/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Cloudinary upload failed");
    }

    const data = await res.json();
    return data.url;
  } catch (e: any) {
    console.warn("Cloudinary upload fallback to data URL:", e.message);
    // Fallback to local Data URL if network or upload fails
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
}
