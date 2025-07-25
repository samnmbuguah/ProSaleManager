import { User } from "../models/index.js";
import bcryptjs from "bcryptjs";

export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) => {
  try {
    const hashedPassword = await bcryptjs.hash(userData.password, 10);

    const user = await User.create({
      ...userData,
      password: hashedPassword,
      role: (userData.role as "admin" | "sales" | "manager") || "sales",
    });

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const findUserByEmail = async (email: string) => {
  try {
    const user = await User.findOne({ where: { email } });
    return user;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

export const validatePassword = async (password: string, hashedPassword: string) => {
  return await bcryptjs.compare(password, hashedPassword);
};
