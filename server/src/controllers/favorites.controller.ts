import { Request, Response } from "express";
import { Favorite, Product } from "../models/index.js";
import { catchAsync } from "../utils/catch-async.js";
import { ApiError } from "../utils/api-error.js";

// Get user's favorites
export const getUserFavorites = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    const favorites = await Favorite.findAll({
        where: { user_id: userId },
        include: [
            {
                model: Product,
                as: "product",
                include: [
                    {
                        model: require("../models/Category.js").default,
                        as: "Category",
                        attributes: ["id", "name"]
                    }
                ]
            }
        ],
        order: [["created_at", "DESC"]]
    });

    res.json({
        success: true,
        data: favorites.map((fav: any) => fav.product)
    });
});

// Add product to favorites
export const addToFavorites = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    if (!productId || isNaN(Number(productId))) {
        throw new ApiError(400, "Valid product ID is required");
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
        where: { user_id: userId, product_id: productId }
    });

    if (existingFavorite) {
        throw new ApiError(400, "Product is already in favorites");
    }

    // Add to favorites
    const favorite = await Favorite.create({
        user_id: userId,
        product_id: Number(productId)
    });

    res.status(201).json({
        success: true,
        message: "Product added to favorites",
        data: favorite
    });
});

// Remove product from favorites
export const removeFromFavorites = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    if (!productId || isNaN(Number(productId))) {
        throw new ApiError(400, "Valid product ID is required");
    }

    // Find and remove the favorite
    const favorite = await Favorite.findOne({
        where: { user_id: userId, product_id: productId }
    });

    if (!favorite) {
        throw new ApiError(404, "Product not found in favorites");
    }

    await favorite.destroy();

    res.json({
        success: true,
        message: "Product removed from favorites"
    });
});

// Check if product is in favorites
export const checkFavorite = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    if (!productId || isNaN(Number(productId))) {
        throw new ApiError(400, "Valid product ID is required");
    }

    const favorite = await Favorite.findOne({
        where: { user_id: userId, product_id: productId }
    });

    res.json({
        success: true,
        data: { isFavorite: !!favorite }
    });
});

// Toggle favorite status
export const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    if (!productId || isNaN(Number(productId))) {
        throw new ApiError(400, "Valid product ID is required");
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
        where: { user_id: userId, product_id: productId }
    });

    if (existingFavorite) {
        // Remove from favorites
        await existingFavorite.destroy();
        res.json({
            success: true,
            message: "Product removed from favorites",
            data: { isFavorite: false }
        });
    } else {
        // Add to favorites
        await Favorite.create({
            user_id: userId,
            product_id: Number(productId)
        });
        res.json({
            success: true,
            message: "Product added to favorites",
            data: { isFavorite: true }
        });
    }
});
