# 🚚 Intégration First Delivery - Guide de Configuration

## ✅ Changements Appliqués

### 1. **Nouveau Hook React** : `useFirstDelivery.ts`
- Gère la création de commandes
- Récupère les localités disponibles
- Effectue un polling en temps réel (toutes les 10 secondes)
- Émet des événements personnalisés pour les mises à jour de statut

### 2. **Nouveau Composant** : `FirstDeliveryIntegration.tsx`
- Interface utilisateur pour créer une commande First Delivery
- Sélection de la localité
- Affichage du code à barre et du lien d'impression
- **Suivi en temps réel du statut avec animations**

### 3. **Mise à Jour** : `OrderManagement.tsx`
- Intégration du composant `FirstDeliveryIntegration`
- Affichage dans le modal des détails de commande
- Permet de créer une commande First Delivery directement depuis l'admin

---

## 🚀 Comment Ça Fonctionne

### Flux Complet (Temps Réel)

```
1. Admin ouvre une commande
   ↓
2. Sélectionne une localité First Delivery
   ↓
3. Clique sur "Créer la Commande First Delivery"
   ↓
4. Backend crée la commande sur First Delivery
   ↓
5. Reçoit le barCode et le lien d'impression
   ↓
6. Frontend démarre un polling toutes les 10 secondes (tant que le modal reste ouvert)
   ↓
7. À chaque changement de statut:
   - Écrit le nouveau statut en base (`commandes.first_delivery_status`)
   - Met à jour l'affichage en temps réel
   - Affiche une notification toast
   - Émet un événement personnalisé
   ↓
8. Admin voit le statut changer EN DIRECT sur l'écran
```

> Rouvrir une commande qui a déjà un `first_delivery_barcode` relance
> immédiatement une lecture de statut (donc une écriture en base) sans avoir
> à recréer la commande — corrigé le 2026-07-09, avant cela le composant
> perdait le barcode existant à chaque réouverture du modal.
>
> Limite connue : sans admin en train de regarder la commande, personne ne
> poll — il n'y a pas de tâche de fond ni de webhook côté serveur. Le statut
> en base ne se met à jour qu'aux moments où quelqu'un ouvre/laisse ouverte
> cette commande dans l'admin.

---

## 📊 Statuts Affichés en Temps Réel

| Statut | Icône | Couleur |
|--------|-------|--------|
| En attente | ⏳ | Jaune |
| En transit | 🚚 | Bleu |
| Livré | ✅ | Vert |
| Annulé | ❌ | Rouge |
| Retourné | ↩️ | Orange |

---

## 🎯 Fonctionnalités

✅ **Création de Commande** - Créer directement depuis l'admin  
✅ **Suivi en Temps Réel** - Polling toutes les 10 secondes  
✅ **Notifications** - Toast pour chaque changement de statut  
✅ **Code à Barre** - Copier-coller facile  
✅ **Lien d'Impression** - Imprimer l'étiquette directement  
✅ **Animations** - Indicateur visuel du suivi en cours  

---

## 🔧 Variable d'Environnement Requise

```env
# Backend uniquement (server/.env), jamais exposée au navigateur
FIRST_DELIVERY_TOKEN=<votre-token-first-delivery>
```

> ⚠️ Corrigé le 2026-07-09 : ce token était lu par `server/routes/firstDelivery.ts`
> **au chargement du fichier**, avant que `.env` soit lu par `loadDotEnvFiles()` —
> donc toujours vide en pratique, provoquant un `401 Unauthorized` systématique
> qui ressemblait à un token invalide alors qu'il ne l'était pas. Corrigé en le
> lisant à chaque appel (`getFirstDeliveryToken()`), voir aussi `server/email.ts`
> qui avait le même bug pour `SMTP_PASS`.
>
> Les variables `FIRST_DELIVERY_POLLING_INTERVAL` et `FIRST_DELIVERY_WEBHOOK_SECRET`
> qui apparaissaient précédemment ici ne sont **utilisées nulle part dans le code** —
> il n'y a pas de webhook, seulement un polling déclenché côté navigateur (voir
> `client/src/hooks/useFirstDelivery.ts`, intervalle de 10s codé en dur).

---

## 📋 Colonnes base de données (table `commandes`, `shared/schema.ts`)

Déjà présentes dans le schéma Drizzle, rien à exécuter manuellement :

```ts
firstDeliveryBarcode: text("first_delivery_barcode"),
firstDeliveryStatus: text("first_delivery_status"),
```

> Il n'existe pas de colonne `first_delivery_link`, `gouvernerat` ni `updated_at`
> sur `commandes` (contrairement à une version précédente de ce document) — le
> lien d'impression n'est actuellement pas stocké en base (`link: null` renvoyé
> par `POST /api/first-delivery/create-order`).

---

## 🎬 Démarrage

```bash
# 1. Installation
npm install

# 2. Démarrer le serveur
npm run dev

# 3. Ouvrir l'application
# http://localhost:3333 (frontend ET backend — un seul process,
# Vite tourne en middleware mode à l'intérieur d'Express, voir server/vite.ts)

# 4. Aller à l'admin → Gestion des Commandes
# 5. Ouvrir une commande
# 6. Voir la section "Intégration First Delivery"
# 7. Sélectionner une localité et créer la commande
# 8. Voir le statut se mettre à jour EN TEMPS RÉEL ! 🚀
```

---

## 🎨 Améliorations Visuelles

- **Animations de Pulse** : Indicateur de suivi en cours
- **Couleurs Dynamiques** : Chaque statut a sa couleur
- **Icônes Emoji** : Facile à identifier
- **Notifications Toast** : Feedback immédiat
- **Responsive Design** : Fonctionne sur mobile

---

## ⚡ Performance

- **Polling Optimisé** : 10 secondes pour un bon équilibre
- **Event Listeners** : Mises à jour sans rechargement
- **Cleanup Automatique** : Pas de fuites mémoire
- **Error Handling** : Gestion gracieuse des erreurs

---

## 🔐 Sécurité

- ✅ Token d'authentification First Delivery, gardé côté serveur uniquement
  (`FIRST_DELIVERY_TOKEN`, jamais exposé au bundle frontend)
- ❌ Pas de webhook, donc rien à signer/valider de ce côté (voir plus haut)
- ❌ Pas de CORS spécifique sur ces routes — même origine que le frontend,
  pas nécessaire dans cette architecture (un seul process Express+Vite)

---

**Dernière vérification du flux complet (hors création/statut réels, pour ne
pas toucher à de vraies commandes ou à l'API First Delivery en production) :
2026-07-09. Voir aussi le "Point d'attention" First Delivery dans README.md.**
