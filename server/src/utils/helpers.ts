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
  where: any = {},
) {
  if (!user) return { ...where, store_id: -1 }; // never match if no user
  if (user.role === "super_admin") return where;
  return { ...where, store_id: user.store_id };
}
