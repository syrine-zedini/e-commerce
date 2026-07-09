// Fetch helpers for the local Express/Postgres REST API.

async function handle(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function apiGet(path: string) {
  return fetch(path).then(handle);
}

export function apiPost(path: string, body?: any) {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then(handle);
}

export function apiPut(path: string, body?: any) {
  return fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then(handle);
}

export function apiDelete(path: string, body?: any) {
  return fetch(path, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).then(handle);
}

// Loops /api/products (or any endpoint accepting limit/offset) page by
// page until a short page comes back.
export async function fetchAllProducts(basePath: string): Promise<any[]> {
  const PAGE = 1000;
  let all: any[] = [];
  let offset = 0;
  const sep = basePath.includes("?") ? "&" : "?";
  for (;;) {
    const page = await apiGet(`${basePath}${sep}limit=${PAGE}&offset=${offset}`);
    all = all.concat(page);
    if (page.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

// Storage — local file uploads served from /uploads
export function storageUrl(folder: string, filename: string) {
  return `/uploads/${folder}/${filename}`.replace(/\/{2,}/g, "/");
}

export function listStorage(folder: string): Promise<{ name: string; url: string }[]> {
  return apiGet(`/api/storage/${folder}`);
}

export function deleteStorage(folder: string, filename: string) {
  return apiDelete(`/api/storage/${folder}/${filename}`);
}

export function uploadStorage(folder: string, file: File): Promise<{ name: string; url: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1] || "";
      apiPost(`/api/storage/${folder}`, { name: file.name, data: base64, type: file.type })
        .then(resolve)
        .catch(reject);
    };
    reader.readAsDataURL(file);
  });
}
