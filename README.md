# YJ PARA

Site e-commerce / parapharmacie tunisien. React + Express + PostgreSQL (via Drizzle ORM),
sans dépendance à un backend-as-a-service (Supabase a été entièrement retiré, voir
[Historique / migrations](#historique--migrations) plus bas).

Ce document est destiné au **prochain développeur qui reprend le projet** : architecture,
mise en route locale, conventions de code, points d'attention.

---

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite, Tailwind CSS, Radix UI, Wouter (routing),
  TanStack Query.
- **Backend** : Node.js + Express + TypeScript (exécuté avec `tsx`, pas de compilation en dev).
- **Base de données** : PostgreSQL, accédé via [Drizzle ORM](https://orm.drizzle.team/)
  (driver `pg`, pas de driver serverless).
- **Emails** : Nodemailer (SMTP), actuellement désactivé pour les commandes client (voir
  `server/email.ts`).

Il n'y a **pas** de serveur frontend séparé en dev : Vite tourne en *middleware mode* à
l'intérieur du process Express (voir `server/vite.ts`), donc tout — API et frontend —
est servi sur **un seul port : `3333`**.

---

## Démarrage rapide (local)

### 1. Prérequis
- Node.js 18+
- PostgreSQL installé localement (le projet a été développé avec PostgreSQL 16 natif
  Windows, port `5000`, base nommée `yjpara`)

### 2. Variables d'environnement
Deux fichiers, tous deux **gitignorés**, à créer à la racine à partir de `.env.example` :

- **`.env`** — secrets partagés par toute l'équipe (SMTP). Ne contient
  volontairement pas `DATABASE_URL` (spécifique à chaque poste).
- **`.env.local`** — overrides propres à ta machine, notamment `DATABASE_URL` pointant
  vers ton Postgres local :
  ```
  DATABASE_URL=postgres://postgres:<mot_de_passe>@localhost:5000/yjpara
  ```

Les deux fichiers sont chargés par `server/loadEnv.ts` (parseur `.env` maison, pas de
dépendance `dotenv`). Ce chargeur est utilisé à la fois par `server/index.ts` (au boot de
l'app) et par `drizzle.config.ts` (pour que `npm run db:push` en ligne de commande trouve
aussi `DATABASE_URL`).

### 3. Installer les dépendances et créer le schéma
```bash
npm install
npm run db:push   # applique shared/schema.ts sur ta base Postgres locale
```

### 4. Lancer le serveur de dev
```bash
npm run dev
```
Ouvrir http://localhost:3333 (site) et http://localhost:3333/admin (back-office).

### Scripts disponibles
| Script | Effet |
|---|---|
| `npm run dev` | Démarre Express + Vite (middleware mode) en mode développement |
| `npm run build` | Build frontend (Vite) + bundle backend (esbuild) dans `dist/` |
| `npm run start` | Lance le build de production (`node dist/index.js`) |
| `npm run check` | `tsc` — vérification de types sans émission |
| `npm run db:push` | Synchronise le schéma Drizzle (`shared/schema.ts`) avec la base |

---

## Architecture

```
client/src/
  pages/            Une page = une route. Beaucoup de paires desktop/mobile
                     (Home.tsx / Homemobile.tsx, Produits.tsx / ProduitsMobile.tsx, ...)
  components/        Composants partagés (Header, Footer, ProductImageCarousel, ...)
  components/admin/  Back-office (gestion produits, commandes, promotions, SEO, ...)
  components/auth/   Login/Register (auth "commandes" maison, voir plus bas)
  hooks/             Hooks de fetch partagés entre pages desktop/mobile
                     (useBrandLogos, useProductCategories, useActivePromotion, ...)
  lib/               Constantes et utilitaires partagés côté frontend uniquement
                     (pageData.ts = nav/footer, tunisiaData.ts = provinces/villes,
                     productUtils.ts, api.ts = client HTTP vers le backend)
  contexts/          AuthContext (session client), providers React

server/
  index.ts           Point d'entrée : setup Express, monte tous les modules de routes,
                      démarre Vite (dev) ou sert le build statique (prod), écoute sur 3333
  db.ts               getDb() — connexion Drizzle/pg paresseuse (lit DATABASE_URL)
  email.ts            Mailer (Nodemailer) + routes /send-order-email, /send-status-change-email
  httpServer.ts        Wrap minimal de l'app Express dans un http.Server
  loadEnv.ts          Parseur .env / .env.local partagé par index.ts et drizzle.config.ts
  storage-local.ts     Stockage fichiers sur disque local (remplace l'ancien Supabase Storage)
  lib/
    asyncHandler.ts    Wrapper try/catch générique pour les handlers de route
    queryHelpers.ts     pickFields() (sélection partielle de colonnes), inputToSet()
                        (mapping body snake_case -> colonnes Drizzle camelCase)
  routes/              Un fichier par domaine métier, chacun exporte registerXRoutes(app) :
    categories.ts, products.ts, promotions.ts, conseils.ts, galleryImages.ts,
    productReviews.ts, wishlist.ts, contacts.ts, seoPages.ts, commandes.ts (+ /api/auth/login),
    fileStorage.ts (upload/liste/suppression fichiers), stock.ts (décrément stock commande),
    imgProxy.ts (proxy + cache disque pour images Google Drive)

shared/
  schema.ts           Schéma Drizzle (source de vérité des tables Postgres)
  orderStatus.ts       Libellés/couleurs de statut de commande — utilisé par le backend
                       (email de changement de statut) ET le frontend (admin)
```

### Pourquoi `server/routes/` (dossier) et pas juste `server/index.ts` ?
`server/index.ts` faisait à l'origine plus de 1200 lignes (toutes les routes API dans un
seul fichier). Il a été découpé par domaine : chaque fichier de `server/routes/` importe
ses propres dépendances (table Drizzle, helpers) et expose une fonction
`registerXRoutes(app: Express)`. `server/index.ts` ne fait plus qu'appeler ces fonctions à
la suite — il n'y a plus de logique métier dedans, seulement l'assemblage de l'app.

### Convention API
Les réponses JSON utilisent des clés **snake_case** (`original_price`, `category_id`, ...)
pour matcher l'ancien format Supabase/Postgres, afin que le code frontend n'ait pas eu à
changer de convention pendant la migration. Les colonnes Drizzle, elles, sont en camelCase
(`originalPrice`) — chaque route fait explicitement le mapping via un objet `xSelect`
(ex. `productSelect` dans `server/routes/products.ts`) et `inputToSet()` pour les écritures.

### Pages desktop / mobile
Le site a des paires de pages distinctes desktop/mobile (pas de composant responsive
unique) : `Home.tsx`/`Homemobile.tsx`, `Produits.tsx`/`ProduitsMobile.tsx`, etc. Les
données statiques (liens de nav, sections de footer, features) et la logique de fetch
strictement identique entre les deux versions ont été extraites dans `client/src/lib/`
et `client/src/hooks/`. **Attention** : certains comportements divergent réellement entre
desktop et mobile (ex. `ConseilsSant.tsx` fait un fetch en 2 temps que sa version mobile
ne fait pas ; `DetailconseilsSant.tsx` charge des images que sa version mobile n'a pas) —
ce n'est pas un oubli, c'est volontaire, ne pas les fusionner sans vérifier le comportement
actuel.

### Authentification
Il y a deux systèmes d'auth séparés et sans rapport :
- **Client** (`/api/auth/login`) : compare email/mot de passe stockés en clair dans la
  table `commandes` (`mot_de_passe`). Pas un vrai système de comptes utilisateurs — hérité
  du fonctionnement Supabase d'origine.
- **Admin** (`AuthContext.tsx`, `LoginForm.tsx`) : comparaison côté navigateur contre
  `VITE_ADMIN_EMAIL`/`VITE_ADMIN_PASSWORD` (variables d'env exposées dans le bundle JS).
  **Ce n'est pas sécurisé** (voir `SECURITY-SETUP.md`, section "vraie authentification
  admin" — cette partie du document est toujours d'actualité même si ses sections
  Supabase/RLS ne le sont plus, voir plus bas).

---

## Base de données

- Schéma défini dans `shared/schema.ts` (Drizzle). `npm run db:push` applique ce schéma
  directement sur la base (pas de système de migrations SQL versionnées pour l'instant —
  `drizzle-kit push` compare le schéma au fichier et modifie la base en conséquence).
- `server/db.ts` expose `getDb()`, une connexion `pg` créée paresseusement au premier
  appel (pour laisser le temps à `.env.local` d'être chargé avant de lire `DATABASE_URL`).
- Tables principales : `categories`, `products`, `commandes`, `promotions` /
  `promotion_products`, `conseils`, `contacts`, `gallery_images`, `product_reviews`,
  `seo_pages`, `wishlist`.

---

## Historique / migrations

Ce projet utilisait à l'origine **Supabase** (Postgres hébergé + Auth + Storage) pour le
frontend ET le backend. Une migration complète a été faite pour :
1. Passer à un **PostgreSQL local** (indépendant de Supabase) relié au backend via Drizzle.
2. **Retirer Supabase entièrement** du code (frontend et backend) et le remplacer par une
   API REST Express classique + stockage fichiers sur disque local
   (`server/storage-local.ts`).

**Conséquence importante** : `SECURITY-SETUP.md` (à la racine du repo) a été écrit
**avant** cette migration et mentionne encore Supabase (RLS, `VITE_SUPABASE_URL`,
policies SQL, etc.) — ces passages-là sont obsolètes et ne s'appliquent plus à l'état
actuel du code. Les parties non liées à Supabase de `SECURITY-SETUP.md` (auth admin en
clair côté client, total de commande recalculé côté client) restent, elles, valables et
à corriger.

---

## Points d'attention pour la suite

- **Auth admin** : corrigé le 2026-07-09 — les comptes admin (`admins`, mot de passe
  haché avec bcrypt) sont maintenant vérifiés côté serveur (`POST /api/auth/admin-login`,
  `server/routes/adminAuth.ts`) au lieu d'être comparés en clair dans le bundle JS.
  **Reste à faire** : ce n'est qu'une vérification de mot de passe à la connexion — il
  n'y a toujours pas de vraie session (JWT/cookie signé) ni de middleware qui protège les
  routes admin (`/api/products`, `/api/promotions`, etc.) côté serveur. N'importe qui
  connaissant l'URL peut aujourd'hui appeler ces endpoints directement sans être connecté
  — seul le frontend décide d'afficher ou non l'interface admin. À corriger avant une
  vraie mise en production.
- **Total de commande non revérifié côté serveur** : `CheckoutPage.tsx` calcule le total
  et l'envoie tel quel à `POST /api/commandes` ; le serveur ne recalcule pas depuis les
  prix en base. Un endpoint qui relit les prix produits et recalcule le total serait plus
  sûr.
- **Emails commande client désactivés** : `sendOrderEmail()` dans `server/email.ts` ne
  fait qu'un `console.log` — le template HTML est conservé en commentaire, prêt à être
  réactivé (décommenter le bloc + retirer le `console.log`).
- **`@neondatabase/serverless`** reste dans `package.json` mais n'est plus utilisé nulle
  part dans le code (résidu de l'ancienne intégration Supabase/Neon) — safe à retirer.
