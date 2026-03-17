const STORAGE_KEY = "tripdoc_recent_searches";
const MAX_ITEMS = 6;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item) => typeof item === "string");
  } catch {
    return [];
  }
}

export function saveRecentSearch(term: string) {
  if (typeof window === "undefined") return;

  const value = term.trim();
  if (!value) return;

  const current = getRecentSearches();

  const updated = [
    value,
    ...current.filter((item) => item.toLowerCase() !== value.toLowerCase()),
  ].slice(0, MAX_ITEMS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}