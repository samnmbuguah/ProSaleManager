import multer from "multer";
import { Request } from "express";
import path from "path";
import fs from "fs";

const useCloudinary = !!process.env.CLOUDINARY_URL;

// Configure multer for memory or disk storage
const storage = useCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), "uploads", "products");
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_"));
      },
    });

// File filter to accept only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed."));
  }
  if (file.size && file.size > 5 * 1024 * 1024) {
    return cb(new Error("Image size must be less than 5MB."));
  }
  cb(null, true);
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// CSV file filter
const csvFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed."));
  }
};

// CSV upload middleware (memory storage)
export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

// Helper to get image URL (local or Cloudinary)
export function getImageUrl(file: Express.Multer.File | undefined): string | null {
  if (!file) return null;
  if (useCloudinary) {
    // Cloudinary URL will be set after upload
    return null;
  } else {
    // Local file path (relative to public)
    return `/uploads/products/${file.filename}`;
  }
}

export default upload;
