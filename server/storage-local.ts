import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// Uploaded images (product photos, category images, sliders, conseils, …).
//
// Two backends:
//  - Cloudinary  — used in production when CLOUDINARY_* env vars are set.
//    Persistent: images survive redeploys and container restarts. This is
//    required on hosts with an ephemeral filesystem (Render, Netlify, …).
//  - Local disk  — fallback for local development (server/uploads), served
//    statically at /uploads/*. Also used in production if Cloudinary is not
//    configured, but note that on ephemeral hosts those files are wiped on
//    every restart.
// Either set CLOUDINARY_URL (the single string Cloudinary hands you:
// cloudinary://<key>:<secret>@<cloud_name>) or the 3 separate vars below.
const CLOUDINARY_ENABLED = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET),
);

if (CLOUDINARY_ENABLED) {
  if (process.env.CLOUDINARY_URL) {
    // The SDK auto-parses CLOUDINARY_URL; just force https delivery.
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}

// All Cloudinary assets live under this prefix to keep the account tidy.
const CLOUD_PREFIX = "glow-store";

const UPLOADS_ROOT = process.env.NODE_ENV === "production"
  ? "/tmp/uploads"
  : path.resolve(process.cwd(), "server", "uploads");

// Images committed to the repo (legacy uploads made before Cloudinary). Always
// served read-only at /uploads/* so old product/category rows keep working.
const LEGACY_UPLOADS_DIR = path.resolve(process.cwd(), "server", "uploads");

function resolveFolder(folder: string) {
  const safe = path.normalize(folder).replace(/^(\.\.[/\\])+/, "");
  const dir = path.join(UPLOADS_ROOT, safe);
  if (!dir.startsWith(UPLOADS_ROOT)) throw new Error("Invalid folder");
  return dir;
}

// Cloudinary public_id: "<prefix>/<folder>/<filename without extension>".
function cloudPublicId(folder: string, filename: string) {
  const stem = filename.replace(/\.[^./\\]+$/, "");
  return [CLOUD_PREFIX, folder, stem]
    .filter(Boolean)
    .join("/")
    .replace(/\/{2,}/g, "/");
}

export async function listFiles(folder: string) {
  if (CLOUDINARY_ENABLED) {
    const prefix = [CLOUD_PREFIX, folder].filter(Boolean).join("/");
    const out: { name: string; url: string }[] = [];
    let next: string | undefined;
    do {
      const res: any = await cloudinary.api.resources({
        type: "upload",
        prefix,
        max_results: 500,
        next_cursor: next,
      });
      for (const r of res.resources ?? []) {
        out.push({ name: String(r.public_id).split("/").pop()!, url: r.secure_url });
      }
      next = res.next_cursor;
    } while (next);
    return out;
  }

  const dir = resolveFolder(folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({ name: entry.name, url: publicPath(folder, entry.name) }));
}

export async function saveFile(folder: string, filename: string, data: Buffer) {
  if (CLOUDINARY_ENABLED) {
    const publicId = cloudPublicId(folder, filename);
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { public_id: publicId, resource_type: "image", overwrite: true, invalidate: true },
          (err, res) => (err ? reject(err) : resolve(res)),
        )
        .end(data);
    });
    return result.secure_url as string;
  }

  const dir = resolveFolder(folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), data);
  return publicPath(folder, filename);
}

export async function deleteFile(folder: string, filename: string) {
  if (CLOUDINARY_ENABLED) {
    // `filename` may arrive as a bare name or as a full Cloudinary URL.
    const base = filename.includes("/") ? filename.split("/").pop()! : filename;
    await cloudinary.uploader
      .destroy(cloudPublicId(folder, base.split("?")[0]), { invalidate: true })
      .catch(() => {});
    return;
  }

  const filePath = path.join(resolveFolder(folder), filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function publicPath(folder: string, filename: string) {
  return `/uploads/${folder}/${filename}`.replace(/\/{2,}/g, "/");
}

export { UPLOADS_ROOT, LEGACY_UPLOADS_DIR, CLOUDINARY_ENABLED };
