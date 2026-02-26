import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined) {
    return "KSh 0.00";
  }

  try {
    // Convert string to number, removing any non-numeric characters except decimal point
    const numAmount =
      typeof amount === "string" ? parseFloat(amount.replace(/[^\d.-]/g, "")) : Number(amount);

    // Check if the conversion resulted in a valid number
    if (isNaN(numAmount)) {
      console.warn("Invalid amount for currency formatting:", amount);
      return "KSh 0.00";
    }

    return `KSh ${numAmount.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch (error) {
    console.error("Currency formatting error:", error);
    return "KSh 0.00";
  }
}

/**
 * Safely parse product images from API response.
 * Handles cases where images might be:
 * - An array (correct format)
 * - A JSON string (needs parsing)
 * - A corrupted/malformed string (fallback to empty array)
 * - null/undefined (fallback to empty array)
 */
export function parseProductImages(images: unknown): string[] {
  // If it's already an array of strings, return it
  if (Array.isArray(images)) {
    return images.filter((img): img is string => typeof img === "string" && img.trim() !== "");
  }

  // If it's null or undefined, return empty array
  if (images == null) {
    return [];
  }

  // If it's a string, try to parse it as JSON
  if (typeof images === "string") {
    // If the string is empty, return empty array
    if (images.trim() === "") {
      return [];
    }

    // Try to parse as JSON (might be a JSON string)
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        return parsed.filter((img): img is string => typeof img === "string" && img.trim() !== "");
      }
      // If parsed is a single string, return it as an array
      if (typeof parsed === "string" && parsed.trim() !== "") {
        return [parsed];
      }
    } catch {
      // If parsing fails, check if it looks like a single image path
      // (starts with / or http)
      if (images.startsWith("/") || images.startsWith("http")) {
        return [images];
      }
      // If it's a corrupted string, return empty array
      console.warn("Failed to parse product images:", images);
      return [];
    }
  }

  // For any other type, return empty array
  console.warn("Unexpected images type:", typeof images, images);
  return [];
}

export function getDatesFromPeriod(period: string): { startDate: Date; endDate: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case "this_week": {
      const day = today.getDay(); // 0 is Sunday
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      const monday = new Date(today);
      monday.setDate(diff);
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);
      return { startDate: monday, endDate: nextMonday };
    }
    case "last_week": {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diff);
      const lastMonday = new Date(monday);
      lastMonday.setDate(monday.getDate() - 7);
      return { startDate: lastMonday, endDate: monday };
    }
    case "this_month": {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return { startDate: firstDay, endDate: nextMonth };
    }
    case "last_month": {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: firstDay, endDate: lastMonthEnd };
    }
    case "this_year": {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const nextYear = new Date(today.getFullYear() + 1, 0, 1);
      return { startDate: firstDay, endDate: nextYear };
    }
    default:
      return null;
  }
}
