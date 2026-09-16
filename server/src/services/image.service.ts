import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

export { isCloudinaryConfigured };

/**
 * Uploads an in-memory image (Multer memory storage) to Cloudinary and returns
 * the secure delivery URL. Throws if Cloudinary is not configured or the file
 * was not buffered in memory.
 */
export async function uploadImage(file: Express.Multer.File): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  if (!file.buffer) {
    throw new Error("Cloudinary uploads require memory storage (file.buffer is missing)");
  }

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products", resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(file.buffer);
  });
}

/** Best-effort deletion of a previously uploaded asset by public id. */
export async function deleteImage(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // Deleting a missing asset should never break a request.
  }
}
