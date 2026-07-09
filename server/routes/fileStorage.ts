import type { Express } from "express";
import express from "express";
import path from "path";
import { listFiles, saveFile, deleteFile } from "../storage-local";
import { asyncHandler } from "../lib/asyncHandler";

// Generic file storage (local disk, see storage-local.ts)
export function registerFileStorageRoutes(app: Express) {
  app.get("/api/storage/*", asyncHandler(async (req, res) => {
    const folder = (req.params as any)[0] as string;
    // A caller occasionally passes an external URL (e.g. a Google Drive
    // link) instead of a local folder name — silently returning [] made
    // that bug invisible client-side. Fail loudly instead.
    if (folder.includes("://")) {
      return res.status(400).json({ error: "Invalid folder: looks like a URL, not a local storage folder name" });
    }
    res.json(listFiles(folder));
  }));

  app.post("/api/storage/*", express.json({ limit: "15mb" }), asyncHandler(async (req, res) => {
    const folder = (req.params as any)[0] as string;
    const { name, data: b64 } = req.body as { name: string; data: string; type?: string };
    if (!name || !b64) return res.status(400).json({ error: "name and data required" });
    const filename = `${Date.now()}-${name}`;
    const buf = Buffer.from(b64, "base64");
    const url = saveFile(folder, filename, buf);
    res.json({ name: filename, url });
  }));

  app.delete("/api/storage/*", asyncHandler(async (req, res) => {
    const fullPath = (req.params as any)[0] as string;
    const folder = path.dirname(fullPath).replace(/\\/g, "/");
    const filename = path.basename(fullPath);
    deleteFile(folder === "." ? "" : folder, filename);
    res.json({ success: true });
  }));
}
