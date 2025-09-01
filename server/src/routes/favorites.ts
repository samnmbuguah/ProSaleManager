import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
    getUserFavorites,
    addToFavorites,
    removeFromFavorites,
    checkFavorite,
    toggleFavorite
} from "../controllers/favorites.controller.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get user's favorites
router.get("/", getUserFavorites);

// Check if a product is in favorites
router.get("/check/:productId", checkFavorite);

// Add product to favorites
router.post("/:productId", addToFavorites);

// Remove product from favorites
router.delete("/:productId", removeFromFavorites);

// Toggle favorite status (add if not exists, remove if exists)
router.patch("/:productId/toggle", toggleFavorite);

export default router;
