import {
  pgTable,
  bigint,
  text,
  numeric,
  boolean,
  integer,
  jsonb,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

// Mirrors MIGRATION_FINALE.sql + migration_tva.sql + migration_stock.sql.

export const categories = pgTable("categories", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  image: text("image"),
});

export const products = pgTable("products", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  code: text("code"),
  description: text("description"),
  descriptionDetaillee: text("description_detaillee"),
  contenance: text("contenance"),
  brand: text("brand"),
  originalPrice: numeric("original_price"),
  discountedPrice: numeric("discounted_price"),
  imagePath: text("image_path"),
  categoryId: bigint("category_id", { mode: "number" }).references(() => categories.id),
  new: boolean("new").default(false),
  popular: boolean("popular").default(false),
  promo: boolean("promo").default(false),
  stockStatus: text("stock_status").default("en stock"),
  form: text("form"), // stock quantity, stored as text
  discountPercentage: numeric("discount_percentage"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  tva: text("tva"),
});

export const commandes = pgTable("commandes", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  nom: text("nom"),
  prenom: text("prenom"),
  email: text("email"),
  phone: text("phone"),
  adresse: text("adresse"),
  province: text("province"),
  ville: text("ville"),
  codePostal: text("code_postal"),
  motDePasse: text("mot_de_passe"),
  paiementMode: text("paiement_mode").default("livraison"),
  fraisLivraison: numeric("frais_livraison").default("0"),
  total: numeric("total"),
  produits: jsonb("produits"),
  statut: text("statut").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name"),
  type: text("type"),
  value: numeric("value"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const promotionProducts = pgTable("promotion_products", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  promotionId: bigint("promotion_id", { mode: "number" }).references(() => promotions.id),
  productId: bigint("product_id", { mode: "number" }).references(() => products.id),
  discountedPrice: numeric("discounted_price"),
});

export const conseils = pgTable("conseils", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  title: text("title"),
  content: text("content"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  nom: text("nom"),
  email: text("email"),
  telephone: text("telephone"),
  sujet: text("sujet"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const galleryImages = pgTable("gallery_images", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  imageUrl: text("image_url"),
  order: integer("order"),
});

export const marques = pgTable("marques", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name"),
  image: text("image"),
  order: integer("order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const productReviews = pgTable("product_reviews", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  productId: bigint("product_id", { mode: "number" }).references(() => products.id),
  userId: text("user_id"),
  userName: text("user_name"),
  rating: integer("rating"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const admins = pgTable("admins", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // bcrypt hash, never plain text
  name: text("name"),
  role: text("role").notNull().default("admin"), // 'admin' | 'admin_commercial'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const seoPages = pgTable("seo_pages", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").unique(),
  title: text("title"),
  description: text("description"),
  isPublished: boolean("isPublished").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const wishlist = pgTable("wishlist", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  sessionId: text("session_id"),
  userId: text("user_id"),
  productId: bigint("product_id", { mode: "number" }).references(() => products.id),
});
