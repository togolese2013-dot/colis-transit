# 🚢 Hamid Cargo Logistics - Document de Passation (Handoff)

Ce document résume l'état actuel de la plateforme de gestion de colis entre la Chine et le Togo.

## 🚀 État Actuel
L'application est stable et déployée sur **Vercel**. Elle est connectée à une base de données **Supabase** pour le stockage des colis, des photos et des clients.

---

## 🛠️ Fonctionnalités Clés

### 1. Scanner Live (`/scan`)
Page dédiée au scan de code-barres en temps réel via la caméra.
- **Moteur principal** : API native `BarcodeDetector` (Chrome/Android, accélérée matériellement)
- **Fallback** : ZXing avec canvas cropé (480×288) sur la zone du viseur pour réduire les pixels à décoder (~16× moins)
- **Formats** : CODE_128, CODE_39, QR_CODE, ITF uniquement (vitesse optimisée)
- **Caméra haute résolution** : 1920×1080 → fallback 1280×720
- Après détection : bip sonore + vibration + redirection vers `/add?tracking=XXX`

### 2. Ajout de Colis (`/add`)
- Bouton **Scanner Tracking** (orange) → redirige vers `/scan`
- **Multi-photos** : plusieurs photos par colis, galerie d'aperçu avec suppression
- **Auto-complétion client** : dropdown de suggestions lors de la saisie du nom (2+ caractères)
- **Client inconnu** : case à cocher qui masque les champs nom/téléphone — le colis est enregistré sans client
- Champ tracking pré-rempli si `?tracking=` dans l'URL
- Upsert automatique dans la table `customers` à chaque enregistrement

### 3. Page de Suivi Public (`/track`)
- Recherche par numéro de tracking
- Timeline de progression (Chine → Transit → Lomé → Livré)
- Affichage : photos, nom client, téléphone, poids, service, prix total
- **Réclamation** : si le colis n'a pas de client, un formulaire permet au client d'entrer son nom/téléphone pour réclamer le colis → met à jour la DB et notifie les admins

### 4. Gestion des Colis Chine (`/chine`)
- Liste complète avec recherche et filtres avancés (date, type d'envoi, poids)
- Sélection multiple + changement de statut en masse
- Import Excel (`/import`) : glisser-déposer `.xlsx/.xls/.csv`, aperçu avant import
- Bouton **Transit** par colis pour passer directement en `EN_TRANSIT`

### 5. Gestion des Colis Lomé (`/lome`)
- Vue filtrée : En Transit / Arrivé Lomé / Livré
- Boutons **Réceptionner** et **Livrer** par colis

### 6. Clients (`/clients`)
- Liste de tous les clients avec compteur de colis
- Expand accordéon : affiche les colis liés au client
- Créés automatiquement à l'ajout de colis

### 7. Notifications Temps Réel (Cloche 🔔)
- Pages `/chine` et `/lome` : cloche avec badge rouge (compteur)
- **Déclenchement** : quand un client réclame son colis sur `/track`, un événement `postgres_changes` (UPDATE sur `packages`) est détecté
- Le message affiché : `08 mai 14:32 · 📦 Mohamed Ali a réclamé son colis JT0123456789`
- Clic sur la notification → ouvre `/edit/[id]` du colis
- **Persistance** : notifications sauvegardées dans `localStorage` (survivent aux rechargements)
- Effacement manuel via "Tout effacer"

> ⚠️ **Prérequis Realtime** : la table `packages` doit être activée dans Supabase Dashboard → Database → Replication → publication `supabase_realtime`. Si RLS est activé, ajouter une policy SELECT publique.

### 8. Import Excel (`/import`)
- Colonnes reconnues automatiquement (noms flexibles : Tracking, Nom, Téléphone…)
- Déduplication interne au fichier
- Aperçu avec lignes valides (vert) / ignorées (rouge) avant import
- `tracking_number` est la seule colonne obligatoire

### 9. Calcul Automatique des Tarifs
- **Ordinaire** : 10 000 FCFA / kg
- **Express** : 13 000 FCFA / kg
- Affiché sur `/track` et `/edit`

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
| `shipping_type` | text | `ORDINAIRE` ou `EXPRESS` |
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
- **Scanner** : `BarcodeDetector` (natif) + `@zxing/library` (fallback)
- **Import** : `xlsx` (SheetJS)
- **Icônes** : `lucide-react`

---

## 🗺️ Pages de l'Application

| Route | Description | Accès |
| :--- | :--- | :--- |
| `/` | Page d'accueil (liens Chine / Togo) | Public |
| `/track` | Suivi de colis par numéro | Public |
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

## 🚦 Maintenance & Conseils

### Modifier les prix :
Changer les valeurs `10000` et `13000` dans `src/app/track/page.tsx` (calculatePrice) et `src/app/edit/[id]/page.tsx`.

### Notifications Realtime ne fonctionnent pas :
1. Supabase Dashboard → **Database** → **Replication** → activer `packages` dans `supabase_realtime`
2. Si RLS activé, exécuter dans SQL Editor :
```sql
CREATE POLICY "Realtime public read" ON packages FOR SELECT USING (true);
```

### Scanner lent ou ne détecte pas :
- Nettoyer l'objectif du téléphone
- Éviter les reflets sur l'étiquette
- Utiliser Chrome sur Android (BarcodeDetector natif = bien plus rapide)

---

*Document mis à jour le 08 Mai 2026 pour Hamid Cargo.*
