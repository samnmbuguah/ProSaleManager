import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const hasDiscreteConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

const hasUrlConfig = Boolean(process.env.CLOUDINARY_URL);

// Configure the SDK when credentials are present. Importing this module must
// never throw — Cloudinary is optional and the app falls back to local disk
// storage when it is not configured.
if (hasDiscreteConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else if (hasUrlConfig) {
  // The SDK reads CLOUDINARY_URL automatically; just force https delivery.
  cloudinary.config({ secure: true });
}

/** True when either CLOUDINARY_URL or the discrete credentials are set. */
export function isCloudinaryConfigured(): boolean {
  return hasDiscreteConfig || hasUrlConfig;
}

export default cloudinary;
