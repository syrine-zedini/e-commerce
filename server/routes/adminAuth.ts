import type { Express } from "express";
import express from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { admins } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";

export function registerAdminAuthRoutes(app: Express) {
  app.post("/api/auth/admin-login", express.json(), asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "email et password sont requis" });
    }

    const [row] = await getDb()
      .select()
      .from(admins)
      .where(eq(admins.email, String(email).trim().toLowerCase()));

    if (!row) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    res.json({ id: String(row.id), email: row.email, name: row.name, role: row.role });
  }));
}
