/** Decode route input once; malformed escapes remain literal text. */
export function decodeBrowseValue(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

export function browseSlug(value: string): string {
  return encodeURIComponent(value.toLowerCase().trim().replace(/\s+/g, "-"));
}

export function browseRouteSlug(value: string): string {
  return browseSlug(decodeBrowseValue(value));
}

/** Hyphens may represent spaces or literal hyphens in stored labels.
 * Fetch candidates with ILIKE, then compare normalized slugs exactly.
 */
export function browsePattern(value: string): string {
  return decodeBrowseValue(value).trim().replace(/[\\%_]/g, "\\$&").replace(/[-\s]+/g, "%");
}

/** Return a single preferred browse URL, or null outside these routes. */
export function canonicalBrowsePath(pathname: string): string | null {
  const match = pathname.match(/^\/(category|country|types|countries)\/([^/]+)\/?$/);
  if (!match) return null;
  const prefix = match[1] === "category" ? "types" : match[1] === "country" ? "countries" : match[1];
  return `/${prefix}/${browseRouteSlug(match[2])}`;
}
