import type { Express } from "express";
import { createServer, type Server } from "http";

// All API routes are registered by server/index.ts (via server/routes/*.ts
// and server/email.ts); this just wraps the Express app in an http.Server
// for `.listen()`.
export async function createHttpServer(app: Express): Promise<Server> {
  return createServer(app);
}
