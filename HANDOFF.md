# 🚢 Hamid Cargo Logistics - Document de Passation (Handoff)

Ce document résume l'état actuel de la plateforme de gestion de colis entre la Chine et le Togo.

## 🚀 État Actuel
L'application est stable et déployée sur **Vercel**. Domaine : **hamidcargo.com**. Connectée à **Supabase** pour le stockage des colis, photos et clients.

---

## 🛠️ Fonctionnalités Clés

### 1. Scanner Live (`/scan`)
- **Moteur principal** : API native `BarcodeDetector` (Chrome/Android, accélérée matériellement)
- **Fallback** : ZXing avec canvas cropé (480×288)
- **Formats** : CODE_128, CODE_39, QR_CODE, ITF
- **Caméra** : 1920×1080 → fallback 1280×720
- Après détection : bip sonore + vibration + redirection vers `/add?tracking=XXX`

### 2. Ajout de Colis (`/add`)
- Bouton **Scanner Tracking** (orange) → redirige vers `/scan`
- **Multi-photos** : plusieurs photos par colis, galerie d'aperçu avec suppression
- **Auto-complétion client** : dropdown de suggestions (2+ caractères)
- **Client inconnu** : case à cocher → colis enregistré sans client
- Champ tracking pré-rempli si `?tracking=` dans l'URL
- Upsert automatique dans la table `customers`

### 3. Page de Suivi Public (`/track`)
- Recherche par numéro de tracking
- Timeline de progression (Chine → Transit → Lomé → Livré)
- Affichage : photos, nom client, téléphone, poids, service, prix total
- **Réclamation** : formulaire pour client inconnu → met à jour la DB et notifie les admins

### 4. Gestion des Colis Chine (`/chine`)
- Liste complète avec recherche et filtres avancés (date, type d'envoi, poids)
- Filtre type d'envoi : Tous / Ordinaire / Express / Colis Batterie 🔋
- Sélection multiple + changement de statut en masse
- Import Excel (`/import`) : glisser-déposer `.xlsx/.xls/.csv`, aperçu avant import
- Bouton **Transit** → passe en `EN_TRANSIT` + envoie notification WhatsApp

### 5. Gestion des Colis Lomé (`/lome`)
- Vue filtrée : En Transit / Arrivé Lomé / Livré
- Bouton **Réceptionner** → passe en `ARRIVE_LOME` + envoie notification WhatsApp
- Bouton **Livrer** → passe en `LIVRE`

### 6. Clients (`/clients`)
- Liste de tous les clients avec compteur de colis
- Expand accordéon : affiche les colis liés au client
- Créés automatiquement à l'ajout de colis

### 7. Notifications Temps Réel (Cloche 🔔)
- Pages `/chine` et `/lome` : cloche avec badge rouge (compteur)
- **Déclenchement** : quand un client réclame son colis sur `/track`
- **Persistance** : notifications sauvegardées dans `localStorage`
- Effacement manuel via "Tout effacer"

> ⚠️ **Prérequis Realtime** : activer `packages` dans Supabase → Database → Replication → `supabase_realtime`. Si RLS activé, ajouter policy SELECT publique.

### 8. Import Excel (`/import`)
- Colonnes reconnues automatiquement (Tracking, Nom, Téléphone…)
- Déduplication interne au fichier
- Aperçu avec lignes valides (vert) / ignorées (rouge)
- `tracking_number` est la seule colonne obligatoire
- Reconnaît `BATTERIE` ou `COLIS_BATTERIE` → mappe vers `COLIS_BATTERIE`

### 9. Calcul Automatique des Tarifs
- **Ordinaire** : 10 000 FCFA / kg
- **Express** : 13 000 FCFA / kg
- **Colis Batterie** 🔋 : 11 000 FCFA / kg
- Affiché sur `/track`, `/edit` et dans les notifications WhatsApp

### 10. Notifications WhatsApp (Meta Cloud API)
Fichier principal : `src/lib/whatsapp.ts`

| Événement | Template | Déclencheur |
| :--- | :--- | :--- |
| Colis reçu en Chine | `colis_recu_chine` | POST `/api/packages` |
| Colis en transit | `colis_en_transit` | Bouton Transit `/chine` |
| Colis arrivé à Lomé | `colis_arrive_lome` | Bouton Réceptionner `/lome` |
| Réponse client | Auto-reply texte libre | Webhook `/api/whatsapp/webhook` |

**Auto-reply** : quand un client répond à une notif → réponse automatique avec le numéro `+228 70 15 13 30`.

**Format téléphone** : numéros togolais 8 chiffres détectés automatiquement → préfixe `+228` ajouté.

### 11. Page Politique de Confidentialité (`/privacy`)
- Accessible publiquement sur `https://hamidcargo.com/privacy`
- Requise pour le Live Mode Meta

---

## 📊 Base de Données (Supabase)

### Table `packages`
| Colonne | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Identifiant unique |
| `tracking_number` | text (unique) | Numéro de suivi (ex: JT...) |
| `customer_name` | text | Nom du client (null = client inconnu) |
| `customer_phone` | text | Téléphone du client |
| `weight_kg` | numeric | Poids en kilogrammes |
| `shipping_type` | text | `ORDINAIRE`, `EXPRESS` ou `COLIS_BATTERIE` |
| `status` | text | `RECU_CHINE`, `EN_TRANSIT`, `ARRIVE_LOME`, `LIVRE` |
| `photo_url` | text | URL photo principale (rétrocompat) |
| `photo_urls` | text[] | Tableau URLs de toutes les photos |
| `notes` | text | Notes internes admin |
| `created_at` | timestamptz | Date d'enregistrement |

### Table `customers`
| Colonne | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Identifiant unique |
| `name` | text (unique) | Nom du client |
| `phone` | text | Téléphone |
| `created_at` | timestamptz | Date de création |

---

## 💻 Stack Technique
- **Framework** : Next.js (App Router), React 19, TypeScript strict
- **Base de données** : Supabase (PostgreSQL)
- **Realtime** : Supabase `postgres_changes` (WebSocket)
- **Stockage** : Supabase Storage (Bucket: `packages`)
- **WhatsApp** : Meta Cloud API (Graph API v20.0)
- **Scanner** : `BarcodeDetector` (natif) + `@zxing/library` (fallback)
- **Import** : `xlsx` (SheetJS)
- **Icônes** : `lucide-react`

---

## 🔑 Variables d'Environnement (Vercel)

| Variable | Description |
| :--- | :--- |
| `WHATSAPP_TOKEN` | Token System User Meta (permanent) |
| `WHATSAPP_PHONE_ID` | `1137252232803061` |
| `WHATSAPP_VERIFY_TOKEN` | Token vérification webhook |
| `WHATSAPP_TEMPLATE_COLIS_RECU` | Défaut : `colis_recu_chine` |
| `WHATSAPP_TEMPLATE_EN_TRANSIT` | Défaut : `colis_en_transit` |
| `WHATSAPP_TEMPLATE_ARRIVE_LOME` | Défaut : `colis_arrive_lome` |

---

## 🗺️ Pages de l'Application

| Route | Description | Accès |
| :--- | :--- | :--- |
| `/` | Page d'accueil (liens Chine / Togo) | Public |
| `/track` | Suivi de colis par numéro | Public |
| `/privacy` | Politique de confidentialité | Public |
| `/chine` | Dashboard admin Chine | Admin |
| `/lome` | Dashboard admin Lomé | Admin |
| `/add` | Ajouter un colis | Admin |
| `/scan` | Scanner un code-barres | Admin |
| `/edit/[id]` | Modifier un colis | Admin |
| `/clients` | Liste des clients | Admin |
| `/import` | Import Excel en masse | Admin |
| `/stats` | Statistiques | Admin |
| `/profile` | Profil utilisateur | Admin |

---

## 🗺️ Routes API

| Route | Méthode | Description |
| :--- | :--- | :--- |
| `/api/packages` | POST | Ajouter colis + notif WhatsApp |
| `/api/packages/status` | PUT | Changer statut + notif WhatsApp |
| `/api/whatsapp/webhook` | GET | Vérification webhook Meta |
| `/api/whatsapp/webhook` | POST | Réception message client → auto-reply |

> ⚠️ Le webhook `/api/whatsapp/webhook` est exclu du middleware d'auth (`src/proxy.ts`).

---

## 🚦 Maintenance & Conseils

### Modifier les prix :
Changer dans `src/lib/whatsapp.ts` (RATE), `src/app/track/page.tsx` et `src/app/client/dashboard/page.tsx` (PRICE_MAP).

### Notifications WhatsApp ne fonctionnent pas :
1. Vérifier que les templates sont **APPROVED** dans Meta → WhatsApp → Message Templates
2. Vérifier les variables env `WHATSAPP_TOKEN` et `WHATSAPP_PHONE_ID` dans Vercel
3. Le WABA `1742355206925502` doit être abonné à l'app Hamid Cargo :
```bash
curl -X POST "https://graph.facebook.com/v20.0/1742355206925502/subscribed_apps" \
  -H "Authorization: Bearer TON_USER_TOKEN"
```

### Webhook Meta ne se vérifie pas :
- Vérifier que `WHATSAPP_VERIFY_TOKEN` dans Vercel correspond au token entré dans Meta
- Tester : `https://hamidcargo.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=TON_TOKEN&hub.challenge=test`

### Notifications Realtime (cloche) ne fonctionnent pas :
1. Supabase Dashboard → **Database** → **Replication** → activer `packages` dans `supabase_realtime`
2. Si RLS activé :
```sql
CREATE POLICY "Realtime public read" ON packages FOR SELECT USING (true);
```

### Scanner lent ou ne détecte pas :
- Nettoyer l'objectif du téléphone
- Éviter les reflets sur l'étiquette
- Utiliser Chrome sur Android (BarcodeDetector natif)

---

*Document mis à jour le 06 Juin 2026 pour Hamid Cargo.*
