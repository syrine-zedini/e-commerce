import type { Express } from "express";
import express from "express";
import { desc } from "drizzle-orm";
import { getDb } from "../db";
import { contacts } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";

const contactSelect = {
  id: contacts.id,
  nom: contacts.nom,
  email: contacts.email,
  telephone: contacts.telephone,
  sujet: contacts.sujet,
  message: contacts.message,
  created_at: contacts.createdAt,
};

export function registerContactRoutes(app: Express) {
  app.post("/api/contacts", express.json(), asyncHandler(async (req, res) => {
    const { nom, email, telephone, sujet, message } = req.body;
    const [row] = await getDb().insert(contacts).values({ nom, email, telephone, sujet, message }).returning(contactSelect);
    res.json(row);
  }));

  app.get("/api/contacts", asyncHandler(async (_req, res) => {
    const rows = await getDb().select(contactSelect).from(contacts).orderBy(desc(contacts.createdAt));
    res.json(rows);
  }));
}
