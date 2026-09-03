import express, { Request, Response, NextFunction } from "express";
import { createHttpServer } from "./httpServer";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import { UPLOADS_ROOT, LEGACY_UPLOADS_DIR, CLOUDINARY_ENABLED } from "./storage-local";
import { loadDotEnvFiles } from "./loadEnv";

import { registerEmailRoutes } from "./email";
import { registerCategoryRoutes } from "./routes/categories";
import { registerProductRoutes } from "./routes/products";
import { registerPromotionRoutes } from "./routes/promotions";
import { registerConseilRoutes } from "./routes/conseils";
import { registerGalleryImageRoutes } from "./routes/galleryImages";
import { registerMarqueRoutes } from "./routes/marques";
import { registerProductReviewRoutes } from "./routes/productReviews";
import { registerWishlistRoutes } from "./routes/wishlist";
import { registerContactRoutes } from "./routes/contacts";
import { registerSeoPageRoutes } from "./routes/seoPages";
import { registerCommandeRoutes } from "./routes/commandes";
import { registerAdminAuthRoutes } from "./routes/adminAuth";
import { registerFileStorageRoutes } from "./routes/fileStorage";
import { registerStockRoutes } from "./routes/stock";
import { registerImgProxyRoutes } from "./routes/imgProxy";

loadDotEnvFiles();

// -----------------------------
// Express setup
// -----------------------------
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));
fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
app.use("/uploads", express.static(UPLOADS_ROOT));
// Also serve images committed to the repo (legacy uploads made before the
// switch to Cloudinary), so old product/category rows keep rendering.
if (LEGACY_UPLOADS_DIR !== UPLOADS_ROOT && fs.existsSync(LEGACY_UPLOADS_DIR)) {
  app.use("/uploads", express.static(LEGACY_UPLOADS_DIR));
}
log(`🖼️  Image storage: ${CLOUDINARY_ENABLED ? "Cloudinary" : "local disk (" + UPLOADS_ROOT + ")"}`);

// Basic request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") || path.startsWith("/send")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// -----------------------------
// Route modules — each file owns one data domain and registers its own
// endpoints directly on `app`. See server/routes/*.ts and server/email.ts.
// -----------------------------
registerEmailRoutes(app);
registerCategoryRoutes(app);
registerProductRoutes(app);
registerPromotionRoutes(app);
registerConseilRoutes(app);
registerGalleryImageRoutes(app);
registerMarqueRoutes(app);
registerProductReviewRoutes(app);
registerWishlistRoutes(app);
registerContactRoutes(app);
registerSeoPageRoutes(app);
registerCommandeRoutes(app);
registerAdminAuthRoutes(app);
registerFileStorageRoutes(app);
registerStockRoutes(app);
registerImgProxyRoutes(app);

// -----------------------------
// Server start
// -----------------------------
(async () => {
  const server = await createHttpServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 3333;
  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`🚀 Server running on port ${port}`);
    }
  );
})();
