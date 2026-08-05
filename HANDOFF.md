# 🚢 Hamid Cargo Logistics - Document de Passation (Handoff)

Ce document résume l'état actuel de la plateforme de gestion de colis entre la Chine et le Togo.

## 🚀 État Actuel
L'application est déployée sur **Vercel**. Domaine : **hamidcargo.com**.

⚠️ **Backend migré vers Supabase self-hosted (Hetzner)** le 3 août 2026, suite au blocage total de l'ancien projet Supabase Cloud (quota Storage dépassé, 1.1GB, API entièrement coupée — DB + Storage). Voir section [🏗️ Infrastructure Self-Hosted](#-infrastructure-self-hosted-hetzner) pour le détail complet.

- **Base de données (packages, customers, client_accounts, admins, settings)** : migrée, en ligne, à jour.
- **Storage (photos des colis)** : **migré**. Les ~9436 fichiers de l'ancien projet Supabase Cloud (`ghwhyuneberhotwzinwq`) ont été copiés vers le bucket `packages` du Storage self-hosted, et les colonnes `photo_url`/`photo_urls` de la table `packages` ont été réécrites vers le nouveau host (`supabase.hamidcargo.com`). Scripts utilisés : `scripts/migrate-storage-to-selfhosted.mjs` (copie fichiers) et `scripts/fix-photo-urls-after-migration.mjs` (correction URLs DB), tous deux idempotents (relançables sans dupliquer).

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
- **Client inconnu** : case à cocher → colis enregistré sans client (`customer_name = null`)
- Champ tracking pré-rempli si `?tracking=` dans l'URL
- Upsert automatique dans la table `customers`
- `created_by` enregistré automatiquement (nom de l'admin connecté)

### 3. Page de Suivi Public (`/track`)
- Recherche par numéro de tracking
- Timeline de progression (Chine → Transit → Lomé → Livré)
- Affichage : photos, nom client, téléphone, poids, service, prix total
- **Réclamation** : formulaire pour client inconnu → met à jour la DB et notifie les admins via cloche 🔔
- **Bandeau connexion** : si colis a un propriétaire et visiteur non connecté → "Ce colis vous appartient ? Se connecter" avec redirect retour après connexion

### 4. Gestion des Colis Chine (`/chine`)
- **Pagination serveur** : 20 colis par page, URL `?page=N` (retour navigateur = bonne page)
- **Recherche debounced** : 400ms avant requête DB
- **Filtre type d'envoi** : dropdown `[▼ Tous | Ordinaire | Express | Batterie]`
- **Vue Actifs / Archivés** : toggle chips — colis `ARRIVE_LOME`/`LIVRE` disparaissent de "Actifs" automatiquement
- Sélection multiple + changement de statut en masse + suppression en masse
- Import Excel (`/import`)
- Bouton **Transit** → passe en `EN_TRANSIT` + envoie notification WhatsApp + enregistre `transit_by`
- **Cache localStorage** : affichage instantané sur revisites (stale-while-revalidate)
- **Skeleton screens** : cartes animées sur première visite
- **Notifications** (cloche 🔔) : uniquement quand client réclame un colis "inconnu" (enregistré sans nom). Clic sur notif = retire du compteur + navigue vers le colis

### 5. Gestion des Colis Lomé (`/lome`)
- Vue filtrée : En Transit / Arrivé Lomé / Livré
- **Pagination serveur** : 20 colis par page (fix du 3 août 2026 — l'ancienne requête chargeait les 3 statuts en une fois sans `.range()`, plafonnée à 1000 lignes par Supabase et triée par `created_at` de création ; au-delà de 1000 colis cumulés, les colis **En Transit** (souvent anciens en date de création mais récemment transitionnés) disparaissaient complètement de la liste. Requête maintenant filtrée par statut actif + paginée, comme `/chine`)
- Compteurs des tuiles (En Transit / À Lomé / Livré) via requêtes `count` indépendantes de la pagination
- Bouton **Réceptionner** → passe en `ARRIVE_LOME` + envoie notification WhatsApp + enregistre `received_by` + archive le colis (disparaît de `/chine` vue Actifs)
- Bouton **Livrer** → passe en `LIVRE` + enregistre `delivered_by`

### 6. Clients (`/clients`)
- Liste de tous les clients avec compteur de colis
- **Badge bleu "👤 Compte"** : clients qui ont créé un compte sur le site vitrine (`client_accounts`)
- **Modifier** : icône ✏️ → formulaire inline (nom + téléphone). Renommage cascade sur tous les colis liés
- **Supprimer** : icône 🗑️ → confirmation → supprime (colis liés conservés)
- Expand accordéon : affiche les colis liés au client

### 7. Notifications Temps Réel (Cloche 🔔)
- Page `/chine` uniquement
- **Déclenchement** : quand client réclame son colis "inconnu" via `/track` (status `RECU_CHINE` + `customer_name` était null + colis sur la page courante)
- **Persistance** : notifications sauvegardées dans `localStorage`
- **Clic sur notif** : retire la notification du compteur + navigue vers `/edit/[id]`
- Effacement manuel via "Tout effacer"

> ⚠️ **Prérequis Realtime** : activer `packages` dans Supabase → Database → Replication → `supabase_realtime`. Si RLS activé, ajouter policy SELECT publique. À **revérifier** sur l'instance self-hosted (Hetzner) — la policy RLS a été migrée avec le dump, mais la config de réplication Realtime doit être confirmée manuellement.

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
- Affiché sur `/track`, `/edit`, `/client/dashboard` et dans les notifications WhatsApp

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

### 12. Espace Client (`/client/*`)
Système d'authentification séparé (JWT cookie `hc_client`, table `client_accounts`).

| Route | Description |
| :--- | :--- |
| `/client/login` | Connexion par téléphone + mot de passe. Supporte `?redirect=` |
| `/client/register` | Création de compte (nom, téléphone, mot de passe min 6 chars) |
| `/client/dashboard` | Liste des colis du client, filtres (Tous/En cours/Livrés), recherche tracking, tri date, 4 actions rapides |
| `/client/profile` | Modifier nom / téléphone / mot de passe. JWT rafraîchi après modif |

**Normalisation téléphone** : `90123456` → `+22890123456` automatiquement à l'inscription, connexion et recherche de colis.

**Liaison colis** : les colis apparaissent si `packages.customer_phone` correspond au numéro du compte (toutes variantes).

**Home page intelligente** : détecte session active → bouton "Mes colis" au lieu de "Connexion".

### 13. Sauvegarde Base de Données (`/admin` → tab Backup)
- Accessible **superadmin uniquement**
- Télécharge `hamidcargo_backup_YYYY-MM-DD.json` contenant : colis + clients + comptes client
- Mots de passe jamais en clair (hash bcrypt uniquement)

### 14. Traçabilité des Actions
Chaque action enregistre l'auteur (nom de l'admin connecté) :

| Colonne | Quand |
| :--- | :--- |
| `created_by` | Ajout du colis (`/add`) |
| `transit_by` | Bouton Transit (`/chine`) |
| `received_by` | Bouton Réceptionner (`/lome`) |
| `delivered_by` | Bouton Livrer (`/lome`) |

Timeline affichée dans `/edit/[id]` → section **Historique**. Anciens colis affichent "—".

### 15. Archivage Automatique
- Colis passant en `ARRIVE_LOME` → `archived_at` horodaté → disparaît de la vue "Actifs" de `/chine`
- Toggle "Archivés (Lomé)" pour consulter l'historique
- Rétrocompatibilité : anciens colis `ARRIVE_LOME`/`LIVRE` sans `archived_at` filtrés par statut

### 16. Statistiques (`/stats`)
- Total colis exact (requêtes `count` côté DB — pas de limite 1000 lignes)
- Répartition par statut et type d'envoi
- Revenus estimés (colis Livrés uniquement)
- Graphique hebdomadaire (8 dernières semaines)
- Top 5 clients

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
| `archived_at` | timestamptz | Horodatage archivage (set à `ARRIVE_LOME`) |
| `created_by` | text | Admin ayant enregistré |
| `transit_by` | text | Admin ayant mis en transit |
| `received_by` | text | Admin ayant réceptionné à Lomé |
| `delivered_by` | text | Admin ayant livré |

> ⚠️ **Migration requise** si pas encore exécutée :
> ```sql
> ALTER TABLE packages
>   ADD COLUMN IF NOT EXISTS archived_at timestamptz,
>   ADD COLUMN IF NOT EXISTS created_by text,
>   ADD COLUMN IF NOT EXISTS transit_by text,
>   ADD COLUMN IF NOT EXISTS received_by text,
>   ADD COLUMN IF NOT EXISTS delivered_by text;
> ```

### Index recommandés (performance)
```sql
CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_archived_at ON packages(archived_at);
CREATE INDEX IF NOT EXISTS idx_packages_shipping_type ON packages(shipping_type);
CREATE INDEX IF NOT EXISTS idx_packages_tracking ON packages(tracking_number text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_packages_customer_name ON packages(customer_name text_pattern_ops);
```

### Table `customers`
| Colonne | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Identifiant unique |
| `name` | text (unique) | Nom du client |
| `phone` | text | Téléphone |
| `created_at` | timestamptz | Date de création |

### Table `client_accounts`
| Colonne | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Identifiant unique |
| `name` | text | Nom du client |
| `phone` | text (unique) | Téléphone normalisé (+228XXXXXXXX) |
| `password_hash` | text | Hash bcrypt (rounds: 12) |
| `created_at` | timestamptz | Date de création |

---

## 💻 Stack Technique
- **Framework** : Next.js (App Router), React 19, TypeScript strict
- **Base de données** : Supabase self-hosted (PostgreSQL 17) sur Hetzner — voir infra ci-dessous
- **Realtime** : Supabase `postgres_changes` (WebSocket) — `/chine` et `/lome`
- **Stockage** : Supabase Storage self-hosted (Bucket: `packages`) — migré depuis l'ancien Supabase Cloud
- **WhatsApp** : Meta Cloud API (Graph API v20.0)
- **Auth admin** : JWT (`jose`) + cookie `hc_session` — middleware `src/proxy.ts`
- **Auth client** : JWT (`jose`) + cookie `hc_client` — `src/lib/clientAuth.ts`
- **Scanner** : `BarcodeDetector` (natif) + `@zxing/library` (fallback)
- **Import** : `xlsx` (SheetJS)
- **Icônes** : `lucide-react`

---

## 🔑 Variables d'Environnement (Vercel)

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://supabase.hamidcargo.com` (self-hosted Hetzner depuis le 3 août 2026, était `https://ghwhyuneberhotwzinwq.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (JWT legacy HS256, générée par `utils/generate-keys.sh`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (toutes mutations serveur) |
| `JWT_SECRET` | Secret JWT partagé admin + client |
| `WHATSAPP_TOKEN` | Token System User Meta (permanent) |
| `WHATSAPP_PHONE_ID` | `1137252232803061` |
| `WHATSAPP_VERIFY_TOKEN` | Token vérification webhook |
| `WHATSAPP_TEMPLATE_COLIS_RECU` | Défaut : `colis_recu_chine` |
| `WHATSAPP_TEMPLATE_EN_TRANSIT` | Défaut : `colis_en_transit` |
| `WHATSAPP_TEMPLATE_ARRIVE_LOME` | Défaut : `colis_arrive_lome` |

> ⚠️ **Important** : toutes les mutations (INSERT/UPDATE/DELETE) passent par des routes API qui utilisent `supabaseServer` (clé service) pour contourner le RLS Supabase.

---

## 🗺️ Pages de l'Application

| Route | Description | Accès |
| :--- | :--- | :--- |
| `/` | Page d'accueil vitrine + contacts réels | Public |
| `/track` | Suivi de colis par numéro + bandeau connexion | Public |
| `/privacy` | Politique de confidentialité | Public |
| `/client/login` | Connexion espace client | Public |
| `/client/register` | Création compte client | Public |
| `/client/dashboard` | Mes colis + actions rapides + filtres | Client connecté |
| `/client/profile` | Modifier profil client | Client connecté |
| `/chine` | Dashboard admin Chine | Admin |
| `/lome` | Dashboard admin Lomé | Admin |
| `/add` | Ajouter un colis | Admin |
| `/scan` | Scanner un code-barres | Admin |
| `/edit/[id]` | Détails colis + historique traçabilité | Admin |
| `/clients` | Liste des clients + modifier/supprimer | Admin |
| `/import` | Import Excel en masse | Admin |
| `/stats` | Statistiques | Admin |
| `/profile` | Profil admin | Admin |
| `/admin` | Gestion utilisateurs + paramètres + backup | Superadmin |

---

## 🗺️ Routes API

| Route | Méthode | Description |
| :--- | :--- | :--- |
| `/api/packages` | POST | Ajouter colis + notif WhatsApp + `created_by` |
| `/api/packages` | DELETE | Supprimer colis (un ou plusieurs IDs) + cleanup storage |
| `/api/packages/status` | PUT | Changer statut + notif WhatsApp + traçabilité + archivage |
| `/api/whatsapp/webhook` | GET | Vérification webhook Meta |
| `/api/whatsapp/webhook` | POST | Réception message client → auto-reply |
| `/api/client/register` | POST | Créer compte client |
| `/api/client/login` | POST | Connexion client |
| `/api/client/logout` | POST | Déconnexion client |
| `/api/client/packages` | GET | Colis du client connecté |
| `/api/client/profile` | GET / PATCH | Lire / modifier profil client |
| `/api/admin/users` | GET / POST / PUT / DELETE | Gestion utilisateurs admin |
| `/api/admin/settings` | GET / POST | Paramètres app |
| `/api/admin/backup` | GET | Télécharger sauvegarde JSON (superadmin) |
| `/api/admin/client-phones` | GET | Téléphones comptes clients (badge "Compte") |
| `/api/auth/profile` | GET | Profil admin + refresh JWT si permissions DB changées |
| `/api/auth/login` | POST | Connexion admin |
| `/api/auth/logout` | POST | Déconnexion admin |

> ⚠️ Le webhook `/api/whatsapp/webhook` est exclu du middleware d'auth (`src/proxy.ts`).

---

## 🔐 Système de Permissions

- **superadmin** : accès total
- **admin** : accès selon `permissions[]` dans le JWT (`chine`, `lome`)
- **Refresh automatique** : si superadmin modifie permissions en DB → JWT mis à jour à la prochaine visite du dashboard (sans re-login)

---

## 📞 Contacts Hamid Cargo

### Lomé (Togo)
| Nom | Téléphone |
| :--- | :--- |
| Mouhamed | +228 90 19 65 29 / +228 96 82 99 05 |
| Seyni | +228 70 15 13 30 |

**Adresse** : Dekon, dans le von d'arrêt des Taxi d'Agoe Zongo, Rue Sédomé, Lomé

### Chine (Guangzhou)
| Nom | Téléphone |
| :--- | :--- |
| Hamid | +86 138 0924 9171 |
| Ibrahim | +86 159 1883 5701 |
| Kader | +86 195 7571 7440 |

**Adresse** : 广东省广州市越秀区环市西路202号 桐舍酒店 7楼 729室

---

## 🚦 Maintenance & Conseils

### Modifier les prix :
Changer dans `src/lib/whatsapp.ts` (RATE), `src/app/track/page.tsx` et `src/app/client/dashboard/page.tsx` (PRICE_MAP).

### Sauvegarder les données :
Aller sur `hamidcargo.com/admin` → tab **Backup** → "Télécharger la sauvegarde". Recommandé : 1 fois par semaine.

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

### Client ne voit pas ses colis :
- Vérifier que `packages.customer_phone` correspond au numéro enregistré
- La normalisation gère `90123456` → `+22890123456` automatiquement
- Si toujours vide : vérifier dans Supabase que `customer_phone` n'est pas null sur les colis concernés

### Scanner lent ou ne détecte pas :
- Nettoyer l'objectif du téléphone
- Éviter les reflets sur l'étiquette
- Utiliser Chrome sur Android (BarcodeDetector natif)

### Utilisateur ne peut pas accéder à /chine ou /lome après changement de permissions :
- JWT pas encore rafraîchi → l'utilisateur visite `/dashboard` → JWT mis à jour automatiquement → accès accordé

### Suppression ou changement de statut silencieux (aucune erreur, rien ne change) :
- Cause probable : RLS Supabase bloque la mutation avec la clé anon
- Toutes les mutations passent par les routes API qui utilisent `supabaseServer` (clé service)
- Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est bien configuré dans Vercel

---

## 🏗️ Infrastructure Self-Hosted (Hetzner)

### Serveur
- **Nom** : `Togolese` (CX23, 4GB RAM, 2 vCPU) — Hetzner Cloud, Falkenstein (`fsn1`)
- **IP** : `178.105.157.67`
- **Accès SSH** : clé dédiée `~/.ssh/hetzner_colis_transit` (générée pour ce projet)
- ⚠️ **Serveur partagé** avec d'autres projets non liés : `afrisika-backend/frontend`, `gestion-commandes-app`, `serena-agent`, `togolese_backend`/`togolese_mysql`. Ne pas toucher aux conteneurs/volumes de ces projets.
- **Docker data-root** déplacé vers le volume dédié (`/etc/docker/daemon.json` → `/mnt/HC_Volume_106533764/docker-data`) pour ne pas saturer le disque racine (était à 85%+ avant migration).

### Volume dédié colis-transit
- **Volume Hetzner** : `colis-transit-data`, 10GB, monté sur `/mnt/HC_Volume_106533764` (persistant via `/etc/fstab`)
- **Stack Supabase** : `/mnt/HC_Volume_106533764/colis-transit/supabase/` (docker-compose officiel `supabase/supabase`, dossier `docker/`)
- **Dump DB de référence** (au moment de la migration) : `/mnt/HC_Volume_106533764/colis-transit/db_dump.dump`

### Services (tous dans `docker compose ps`, healthy)
`supabase-db` (Postgres 17.6), `supabase-auth` (GoTrue — non utilisé par l'app, qui a sa propre auth JWT custom), `supabase-rest` (PostgREST), `supabase-storage`, `realtime-dev.supabase-realtime`, `supabase-kong` (API gateway, écoute en local sur `127.0.0.1:8010`), `supabase-studio`, `supabase-meta`, `supabase-pooler` (Supavisor, port 5432 exposé publiquement), `supabase-imgproxy`, `supabase-edge-functions`.

### Exposition publique
- **URL API** : `https://supabase.hamidcargo.com` (Kong, port 8010 en interne)
- **DNS** : géré sur **Cloudflare** (pas Vercel malgré le nom de domaine sur Vercel) — zone `hamidcargo.com`, nameservers `abdullah.ns.cloudflare.com` / `evelyn.ns.cloudflare.com`. Enregistrement A `supabase` → `178.105.157.67`, **DNS-only** (pas proxifié Cloudflare, nécessaire pour Let's Encrypt)
- **SSL** : Let's Encrypt via `certbot --nginx`, renouvellement auto configuré
- **Reverse proxy** : bloc nginx natif de l'hôte, `/etc/nginx/sites-available/supabase.hamidcargo.com` → proxy vers `127.0.0.1:8010`

### Secrets
Générés via les scripts officiels `utils/generate-keys.sh` et `utils/add-new-auth-keys.sh` du repo Supabase, stockés dans `.env` sur le serveur (`/mnt/HC_Volume_106533764/colis-transit/supabase/.env`). Nouvelles clés `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` poussées dans Vercel (Production + Preview). Ancien `.env.local` sauvegardé localement dans `.env.local.backup-old-supabase`.

### ✅ Storage — migré
Le blocage sur l'ancien projet Supabase Cloud (`ghwhyuneberhotwzinwq`, quota Storage dépassé) a été levé côté Supabase (spend cap désactivé), ce qui a permis l'export. Les 9436 fichiers (photos colis, ~2GB) ont été copiés vers le bucket `packages` du Storage self-hosted, avec les mêmes noms de fichiers. Les colonnes `photo_url`/`photo_urls` de tous les colis concernés (966) ont été réécrites vers les nouvelles URLs (`https://supabase.hamidcargo.com/storage/v1/object/public/packages/...`).

Scripts (réutilisables si besoin, idempotents) :
- `scripts/migrate-storage-to-selfhosted.mjs` — copie les fichiers manquants de l'ancien bucket vers le nouveau (skip ceux déjà présents)
- `scripts/fix-photo-urls-after-migration.mjs` — réécrit `photo_url`/`photo_urls` en DB vers le nouveau host (support `--dry-run`)

L'ancien projet Supabase Cloud n'est plus utilisé par l'app. À évaluer : le conserver (avec spend cap réactivé à un seuil raisonnable) ou le supprimer.

### Rollback si besoin
`.env.local.backup-old-supabase` contient les anciennes clés (Supabase Cloud). Les vars d'env Vercel Production d'avant migration peuvent être restaurées via `vercel env add` avec ces valeurs si le self-hosted a un problème majeur.

---

*Document mis à jour le 3 août 2026 pour Hamid Cargo.*
