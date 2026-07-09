import type { Express } from "express";
import express from "express";
import { asc, desc, eq, ne } from "drizzle-orm";
import { getDb } from "../db";
import { conseils } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";
import { pickFields } from "../lib/queryHelpers";

const conseilSelect = {
  id: conseils.id,
  title: conseils.title,
  content: conseils.content,
  image: conseils.image,
  created_at: conseils.createdAt,
};

export function registerConseilRoutes(app: Express) {
  app.get("/api/conseils", asyncHandler(async (req, res) => {
    const q = req.query;
    const selectShape = pickFields(conseilSelect, q.fields as string | undefined);
    let query = getDb().select(selectShape).from(conseils).$dynamic();
    if (q.excludeId) query = query.where(ne(conseils.id, Number(q.excludeId)));
    query = q.sort === "id"
      ? query.orderBy(q.order === "desc" ? desc(conseils.id) : asc(conseils.id))
      : query.orderBy(desc(conseils.createdAt));
    if (q.limit) query = query.limit(Number(q.limit));
    res.json(await query);
  }));

  app.get("/api/conseils/:id", asyncHandler(async (req, res) => {
    const [row] = await getDb().select(conseilSelect).from(conseils).where(eq(conseils.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Introuvable" });
    res.json(row);
  }));

  app.post("/api/conseils", express.json(), asyncHandler(async (req, res) => {
    const { title, content, image } = req.body;
    const [row] = await getDb().insert(conseils).values({ title, content, image }).returning(conseilSelect);
    res.json(row);
  }));

  app.put("/api/conseils/:id", express.json(), asyncHandler(async (req, res) => {
    const { title, content, image } = req.body;
    const set: Record<string, any> = {};
    if (title !== undefined) set.title = title;
    if (content !== undefined) set.content = content;
    if (image !== undefined) set.image = image;
    const [row] = await getDb().update(conseils).set(set).where(eq(conseils.id, Number(req.params.id))).returning(conseilSelect);
    res.json(row);
  }));

  app.delete("/api/conseils/:id", asyncHandler(async (req, res) => {
    await getDb().delete(conseils).where(eq(conseils.id, Number(req.params.id)));
    res.json({ success: true });
  }));
}
