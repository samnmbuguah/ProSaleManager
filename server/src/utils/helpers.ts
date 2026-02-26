export function generateOrderNumber(): string {
  const prefix = "PO";
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${timestamp}${random}`;
}

/**
 * Returns a store-aware where clause for queries.
 * If user is super_admin, returns the original where.
 * Otherwise, adds store_id to the where clause.
 */
export function storeScope(
  user: { role: string; store_id?: number | null } | undefined,
  where: Record<string, unknown> = {},
) {
  if (!user) return { ...where, store_id: -1 }; // never match if no user

  // If user has a store_id context (even super_admin impersonating), use it
  if (user.store_id) {
    return { ...where, store_id: user.store_id };
  }

  // If super_admin and NO store_id context, return all (no filter)
  if (user.role === "super_admin") return where;

  // Fallback (should be covered by first if, but strictly for non-super_admin without store_id)
  return { ...where, store_id: user.store_id };
}
