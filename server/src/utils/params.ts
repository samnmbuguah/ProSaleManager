/**
 * Express 5 types route params as `string | string[]` because patterns like
 * repeating or wildcard segments can produce arrays. All routes in this app
 * use single-valued params, so normalize to a plain string.
 */
export function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? "");
}
