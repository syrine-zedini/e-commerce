// lib/cdn.ts
export const STATIC_ASSETS_BASE =
  "/figmaAssets";

export function cdn(path: string) {
  // path ex: "streamline-ultimate-shopping-basket-1-bold.svg"
  return `${STATIC_ASSETS_BASE}/${path}`;
}
