import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import process from "process";

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for production (needed for rate limiting behind reverse proxy)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "http://127.0.0.1:5000",
          "http://34.131.30.62:5000", // Allow external server
          "https://eltee.store",
          "https://www.eltee.store",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "http://localhost:5000",
          "http://127.0.0.1:5000",
          "http://34.131.30.62:5000", // Allow external server
          "https://images.unsplash.com",
          "https://res.cloudinary.com",
          "https://images.pexels.com",
        ],
        // ...other directives as needed
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://34.131.30.62:5000", // Allow external server
  "https://eltee.store",
  "https://www.eltee.store", // Allow both root and www subdomain
];

// Helper to allow *.local:5173 in dev
function isAllowedOrigin(origin: string) {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  // Allow any subdomain of eltee.store (http or https)
  if (/^https?:\/\/([a-z0-9-]+\.)*eltee\.store$/.test(origin)) return true;
  // Allow any subdomain of .local:5173 in dev
  if (/^http:\/\/[a-z0-9-]+\.local:5173$/.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers and `Retry-After`
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use("/api/", limiter);

// Routes
import routes from "./routes/index.js";
app.use("/api", routes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(process.cwd(), "public")));

// Serve uploads directory for local file storage (including subdirectories)
// Add CORS headers for static file serving
app.use("/uploads", (req, res, next) => {
  // Add CORS headers for static files
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
}, express.static(path.join(process.cwd(), "uploads"), {
  dotfiles: 'ignore',
  index: false
}));

// SPA fallback: serve index.html for any non-API route
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// Error handling middleware (should be last!)
import { errorHandler } from "./middleware/error.middleware.js";
app.use(errorHandler);

export default app;
