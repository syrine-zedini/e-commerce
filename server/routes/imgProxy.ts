import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import https from "https";
import { URL as NodeURL } from "url";

// Image Proxy (Google Drive)
const IMG_DISK_CACHE = path.join(process.cwd(), ".img-cache");
fs.mkdirSync(IMG_DISK_CACHE, { recursive: true });

// Deduplicate concurrent fetches for the same URL
const inFlight = new Map<string, Promise<{ buf: Buffer; ct: string }>>();

function imgCacheKey(url: string) {
  return crypto.createHash("md5").update(url).digest("hex");
}

// Google Drive returns this exact generic "no preview available" icon with a
// 200 OK (not an error status) when it can't generate a thumbnail for a file
// (deleted, not publicly shared, not an image, etc). Without this check we'd
// cache and serve it as if it were the real product photo — technically
// "has an image_path", but visually indistinguishable from having none.
const GDRIVE_NO_THUMBNAIL_MD5 = "0f501ae38056200ff4d10bdbf4997f21";
function isGDrivePlaceholder(buf: Buffer) {
  return crypto.createHash("md5").update(buf).digest("hex") === GDRIVE_NO_THUMBNAIL_MD5;
}

export function registerImgProxyRoutes(app: Express) {
  app.get("/api/img-proxy", async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url || !url.startsWith("https://drive.google.com/")) {
      return res.status(400).send("Invalid URL");
    }

    const key = imgCacheKey(url);
    const imgPath = path.join(IMG_DISK_CACHE, key + ".img");
    const metaPath = path.join(IMG_DISK_CACHE, key + ".meta");

    // Serve from disk cache if available (permanent — survives restarts)
    try {
      const [buf, meta] = await Promise.all([
        fs.promises.readFile(imgPath),
        fs.promises.readFile(metaPath, "utf8"),
      ]);
      if (isGDrivePlaceholder(buf)) {
        // Previously cached before this check existed — purge so it's retried
        // (and correctly reported as missing) instead of served forever.
        await Promise.all([
          fs.promises.unlink(imgPath).catch(() => {}),
          fs.promises.unlink(metaPath).catch(() => {}),
        ]);
        return res.status(404).send("No real thumbnail available for this image");
      }
      const { ct } = JSON.parse(meta);
      res.setHeader("Content-Type", ct);
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("X-Cache", "HIT");
      return res.send(buf);
    } catch {}

    // Fetch Google Drive image forcing IPv4 (undici/fetch uses IPv6 which is blocked on some hosts)
    function fetchGDriveIPv4(urlStr: string, redirects = 5): Promise<{ buf: Buffer; ct: string }> {
      return new Promise((resolve, reject) => {
        if (redirects <= 0) return reject(new Error("Too many redirects"));
        const u = new NodeURL(urlStr);
        const opts = {
          hostname: u.hostname,
          path: u.pathname + u.search,
          method: "GET",
          family: 4,
          timeout: 15000,
          headers: { "User-Agent": "Mozilla/5.0 Chrome/120", Accept: "image/*,*/*" },
        };
        const req = https.request(opts, (r) => {
          if (r.statusCode && [301, 302, 303, 307, 308].includes(r.statusCode) && r.headers.location) {
            r.resume();
            return resolve(fetchGDriveIPv4(r.headers.location as string, redirects - 1));
          }
          const ct = r.headers["content-type"] || "";
          const chunks: Buffer[] = [];
          r.on("data", (c: Buffer) => chunks.push(c));
          r.on("end", () => {
            const buf = Buffer.concat(chunks);
            if (!ct.startsWith("image/")) return reject(new Error(`Not an image: ${r.statusCode} ${ct}`));
            resolve({ buf, ct });
          });
        });
        req.on("error", reject);
        req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
        req.end();
      });
    }

    // Deduplicate: if same URL already being fetched, wait for it
    if (!inFlight.has(url)) {
      const fetchPromise = (async () => {
        const { buf, ct } = await fetchGDriveIPv4(url);
        if (isGDrivePlaceholder(buf)) {
          // Don't cache Google's fake "no preview" icon as if it were real.
          throw new Error("No real thumbnail available for this image");
        }
        // Save to disk cache asynchronously
        Promise.all([
          fs.promises.writeFile(imgPath, buf),
          fs.promises.writeFile(metaPath, JSON.stringify({ ct })),
        ]).catch(() => {});
        return { buf, ct };
      })();
      inFlight.set(url, fetchPromise);
      fetchPromise.finally(() => inFlight.delete(url));
    }

    try {
      const { buf, ct } = await inFlight.get(url)!;
      res.setHeader("Content-Type", ct);
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("X-Cache", "MISS");
      return res.send(buf);
    } catch (e: any) {
      const status = e.message?.includes("No real thumbnail") ? 404 : 502;
      res.status(status).send(e.message);
    }
  });
}
