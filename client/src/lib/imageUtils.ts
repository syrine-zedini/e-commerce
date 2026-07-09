const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f8fafc'/%3E%3Crect x='75' y='65' width='50' height='45' rx='3' fill='none' stroke='%23cbd5e1' stroke-width='3'/%3E%3Cpath d='M75 65l25-20 25 20' fill='none' stroke='%23cbd5e1' stroke-width='3'/%3E%3Cline x1='100' y1='65' x2='100' y2='110' stroke='%23e2e8f0' stroke-width='2'/%3E%3C/svg%3E";

export function convertImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const m = url.match(/drive\.google\.com\/(?:uc\?(?:.*?&)?id=|file\/d\/)([a-zA-Z0-9_-]+)/);
  if (m) return `/api/img-proxy?url=${encodeURIComponent(`https://drive.google.com/thumbnail?id=${m[1]}&sz=w400`)}`;
  return url;
}

export function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = PLACEHOLDER;
}
