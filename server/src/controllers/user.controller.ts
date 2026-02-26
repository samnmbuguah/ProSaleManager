import { Request, Response } from "express";
import { catchAsync } from "../utils/catch-async.js";
import { ApiError } from "../utils/api-error.js";
import User from "../models/User.js";
import UserPreference from "../models/UserPreference.js";
import Store from "../models/Store.js";
import { Op } from "sequelize";

// Get all users (with pagination and filtering)
export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, role, store_id, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const whereClause: Record<string, unknown> = {};

  if (role) whereClause.role = role;
  if (store_id) whereClause.store_id = store_id;
  if (search) {
    (whereClause as any)[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Store,
        as: "store",
        attributes: ["id", "name", "subdomain"]
      },
      {
        model: UserPreference,
        attributes: ["dark_mode", "notifications", "language", "theme"]
      }
    ],
    attributes: { exclude: ["password"] },
    limit: Number(limit),
    offset,
    order: [["created_at", "DESC"]]
  });

  res.json({
    success: true,
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      pages: Math.ceil(count / Number(limit))
    }
  });
});

// Get single user by ID
export const getUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    include: [
      {
        model: Store,
        as: "store",
        attributes: ["id", "name", "subdomain"]
      },
      {
        model: UserPreference,
        attributes: ["dark_mode", "notifications", "language", "theme", "timezone"]
      }
    ],
    attributes: { exclude: ["password"] }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    data: user
  });
});

// Create new user
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role, store_id, is_active = true } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, "Email already exists");
  }

  // Validate role
  const validRoles = ["super_admin", "admin", "manager", "sales", "client"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  // Check if store_id is provided for non-super_admin users
  if (role !== "super_admin" && !store_id) {
    throw new ApiError(400, "Store ID is required for non-super-admin users");
  }

  // Verify store exists if store_id is provided
  if (store_id) {
    const store = await Store.findByPk(store_id);
    if (!store) {
      throw new ApiError(400, "Store not found");
    }
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    store_id: role === "super_admin" ? null : store_id,
    is_active
  });

  // Create default user preferences
  await UserPreference.create({
    user_id: user.id,
    dark_mode: false,
    notifications: true,
    language: "english",
    theme: "default",
    timezone: "UTC"
  });

  // Return user without password
  const userData = user.toJSON() as unknown as Record<string, unknown>;
  delete userData.password;

  res.status(201).json({
    success: true,
    data: userData,
    message: "User created successfully"
  });
});

// Update user
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, store_id, is_active } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if email already exists (excluding current user)
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(400, "Email already exists");
    }
  }

  // Validate role if being changed
  if (role && !["super_admin", "admin", "manager", "sales"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  // Check store_id validation for non-super_admin users
  if (role && role !== "super_admin" && !store_id) {
    throw new ApiError(400, "Store ID is required for non-super-admin users");
  }

  // Verify store exists if store_id is provided
  if (store_id) {
    const store = await Store.findByPk(store_id);
    if (!store) {
      throw new ApiError(400, "Store not found");
    }
  }

  // Update user
  await user.update({
    name: name || user.name,
    email: email || user.email,
    role: role || user.role,
    store_id: role === "super_admin" ? null : (store_id || user.store_id),
    is_active: is_active !== undefined ? is_active : user.is_active
  });

  // Return updated user without password
  const userData = user.toJSON() as unknown as Record<string, unknown>;
  delete userData.password;

  res.json({
    success: true,
    data: userData,
    message: "User updated successfully"
  });
});

// Delete user
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Prevent deletion of super_admin users
  if (user.role === "super_admin") {
    throw new ApiError(400, "Cannot delete super admin users");
  }

  // Check if user has associated data (sales, expenses, etc.)
  // This would need to be implemented based on your business logic

  await user.destroy();

  res.json({
    success: true,
    message: "User deleted successfully"
  });
});

// Update user profile (for the authenticated user)
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  const { name, email } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if email already exists (excluding current user)
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(400, "Email already exists");
    }
  }

  // Update user
  await user.update({
    name: name || user.name,
    email: email || user.email
  });

  // Return updated user without password
  const userData = user.toJSON() as unknown as Record<string, unknown>;
  delete userData.password;

  res.json({
    success: true,
    data: userData,
    message: "Profile updated successfully"
  });
});

// Change password (for the authenticated user)
export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long");
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  // Update password
  await user.update({ password: newPassword });

  res.json({
    success: true,
    message: "Password changed successfully"
  });
});

// Get user preferences
export const getUserPreferences = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  // Ensure userId is an integer
  const userIdInt = parseInt(userId.toString(), 10);
  if (isNaN(userIdInt)) {
    throw new ApiError(400, "Invalid user ID");
  }

  console.log("Getting preferences for user_id:", userIdInt, "type:", typeof userIdInt);

  // Verify user exists before creating preferences
  const userExists = await User.findByPk(userIdInt);
  if (!userExists) {
    throw new ApiError(404, "User not found");
  }

  let preferences = await UserPreference.findOne({ where: { user_id: userIdInt } });

  // Create default preferences if none exist
  if (!preferences) {
    console.log("Creating default preferences for user_id:", userIdInt);
    preferences = await UserPreference.create({
      user_id: userIdInt,
      dark_mode: false,
      notifications: true,
      language: "english",
      theme: "default",
      timezone: "UTC"
    });
  }

  res.json({
    success: true,
    data: preferences
  });
});

// Update user preferences
export const updateUserPreferences = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }

  // Ensure userId is an integer
  const userIdInt = parseInt(userId.toString(), 10);
  if (isNaN(userIdInt)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const { dark_mode, notifications, language, theme, timezone } = req.body;

  let preferences = await UserPreference.findOne({ where: { user_id: userIdInt } });

  if (preferences) {
    await preferences.update({
      dark_mode: dark_mode !== undefined ? dark_mode : preferences.dark_mode,
      notifications: notifications !== undefined ? notifications : preferences.notifications,
      language: language || preferences.language,
      theme: theme || preferences.theme,
      timezone: timezone || preferences.timezone
    });
  } else {
    preferences = await UserPreference.create({
      user_id: userIdInt,
      dark_mode: dark_mode !== undefined ? dark_mode : false,
      notifications: notifications !== undefined ? notifications : true,
      language: language || "english",
      theme: theme || "default",
      timezone: timezone || "UTC"
    });
  }

  res.json({
    success: true,
    data: preferences,
    message: "Preferences updated successfully"
  });
});

// Get user roles (for dropdowns, etc.)
export const getUserRoles = catchAsync(async (req: Request, res: Response) => {
  const roles = [
    { value: "super_admin", label: "Super Admin", description: "Global administrator with access to all stores" },
    { value: "admin", label: "Admin", description: "Store administrator with full store access" },
    { value: "manager", label: "Manager", description: "Store manager with limited administrative access" },
    { value: "sales", label: "Sales", description: "Cashier/sales staff with basic POS access" }
  ];

  res.json({
    success: true,
    data: roles
  });
});
