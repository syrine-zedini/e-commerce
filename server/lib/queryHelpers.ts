export function pickFields<T extends Record<string, any>>(full: T, fields?: string): Partial<T> {
  if (!fields) return full;
  const wanted = fields.split(",").map((f) => f.trim());
  const picked: Partial<T> = {};
  for (const key of wanted) {
    if (key in full) (picked as any)[key] = (full as any)[key];
  }
  return Object.keys(picked).length > 0 ? picked : full;
}

// Builds a Drizzle `.set()`/`.values()` object from a snake_case request body,
// keeping only the keys present in `map` and present in `body`. Shared by
// every write endpoint that accepts partial snake_case input.
export function inputToSet(body: any, map: Record<string, string>) {
  const set: Record<string, any> = {};
  for (const [snake, camel] of Object.entries(map)) {
    if (body[snake] !== undefined) set[camel] = body[snake];
  }
  return set;
}
