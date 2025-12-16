import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, Store } from "../models/index.js";
import { ApiError } from "../utils/api-error.js";
import { catchAsync } from "../utils/catch-async.js";

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password: plainPassword, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  // Determine store assignment: prefer resolved store context, else first store
  let storeId: number | null = null;
  try {
    if (req.store?.id) {
      storeId = req.store.id;
    } else {
      const defaultStore = await Store.findOne({ order: [["id", "ASC"]] });
      storeId = defaultStore ? defaultStore.id : null;
    }
  } catch {
    storeId = null;
  }

  // Create user (always role client from frontend). Let model hooks hash the password.
  const user = await User.create({
    name,
    email,
    password: plainPassword,
    role: "client",
    phone: phone || null,
    is_active: true,
    store_id: storeId,
  });

  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" } as jwt.SignOptions,
  );

  // Set cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  // Return user data (excluding password)
  const userData = user.toJSON();
  if (Object.prototype.hasOwnProperty.call(userData, "password")) {
    (userData as { password?: string }).password = undefined;
  }

  res.status(201).json({
    success: true,
    data: userData,
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password: loginPassword } = req.body;

  // Validate required fields
  if (!email || !loginPassword) {
    throw new ApiError(400, "Email and password are required");
  }

  // Find user
  const user = await User.findOne({ where: { email: email.trim() } });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Check if user is active
  if (!user.is_active) {
    throw new ApiError(401, "Account is inactive");
  }

  // Check password
  const isMatch = await user.comparePassword(loginPassword);

  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Update last login
  await user.update({ last_login: new Date() });

  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" } as jwt.SignOptions,
  );

  // Set cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  // Return user data (excluding password)
  const userData2 = user.toJSON();
  if (Object.prototype.hasOwnProperty.call(userData2, "password")) {
    (userData2 as { password?: string }).password = undefined;
  }


  res.json({
    success: true,
    data: userData2,
    token: token,
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ success: true });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.json({
      success: true,
      data: null,
      authenticated: false,
    });
    return;
  }
  const user = await User.findByPk(req.user.id);
  if (!user) {
    res.json({
      success: true,
      data: null,
      authenticated: false,
    });
    return;
  }
  const userData3 = user.toJSON();
  if (Object.prototype.hasOwnProperty.call(userData3, "password")) {
    (userData3 as { password?: string }).password = undefined;
  }
  res.json({
    success: true,
    data: userData3,
    authenticated: true,
  });
});
