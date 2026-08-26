import fs from "fs";
import path from "path";

// Local disk storage for uploaded images, organized by folder:
// dismarques/, image/{category}/, conseils/, categories/, produits/.
// Served statically at /uploads/*.
const UPLOADS_ROOT = process.env.NODE_ENV === "production"
  ? "/tmp/uploads"
  : path.resolve(process.cwd(), "server", "uploads");

function resolveFolder(folder: string) {
  const safe = path.normalize(folder).replace(/^(\.\.[/\\])+/, "");
  const dir = path.join(UPLOADS_ROOT, safe);
  if (!dir.startsWith(UPLOADS_ROOT)) throw new Error("Invalid folder");
  return dir;
}

export function listFiles(folder: string) {
  const dir = resolveFolder(folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({ name: entry.name, url: publicPath(folder, entry.name) }));
}

export function saveFile(folder: string, filename: string, data: Buffer) {
  const dir = resolveFolder(folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), data);
  return publicPath(folder, filename);
}

export function deleteFile(folder: string, filename: string) {
  const filePath = path.join(resolveFolder(folder), filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function publicPath(folder: string, filename: string) {
  return `/uploads/${folder}/${filename}`.replace(/\/{2,}/g, "/");
}

export { UPLOADS_ROOT };
