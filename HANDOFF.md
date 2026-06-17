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
- `created_by` = username de l'admin connecté enregistré automatiquement

### 3. Page de Suivi Public (`/track`)
- Recherche par numéro de tracking
- Timeline de progression (Chine → Transit → Lomé → Livré)
- Affichage : photos, nom client, téléphone, poids, service, prix total
- **Réclamation** : formulaire pour client inconnu → met à jour la DB et notifie les admins
- **Bandeau connexion** : si colis a un propriétaire et visiteur non connecté → "Ce colis vous appartient ? Se connecter" avec redirect retour après connexion

### 4. Gestion des Colis Chine (`/chine`)
- **Pagination serveur** : 20 colis par page, requêtes DB paginées (plus de chargement de tout)
- **Recherche debounced** : 400ms après saisie avant requête DB
- **Filtre type d'envoi** : dropdown sélection (Tous / Ordinaire / Express / Batterie)
- **Vue Actifs / Archivés** : toggle — les colis `ARRIVE_LOME`/`LIVRE` sont archivés automatiquement
- Sélection multiple + changement de statut en masse
- Import Excel (`/import`)
- Bouton **Transit** → passe en `EN_TRANSIT` + envoie notification WhatsApp
- **Page persistée dans l'URL** : `/chine?page=5` → retour arrière revient à la bonne page
- **Cache localStorage** : données affichées instantanément sur revisites, refresh silencieux en arrière-plan
- **Skeleton screens** : cartes animées pendant le premier chargement

### 5. Gestion des Colis Lomé (`/lome`)
- Vue filtrée : En Transit / Arrivé Lomé / Livré
- Bouton **Réceptionner** → passe en `ARRIVE_LOME` + envoie notification WhatsApp + archive le colis
- Bouton **Livrer** → passe en `LIVRE`

### 6. Clients (`/clients`)
- Liste de tous les clients avec compteur de colis
- **Modifier** ✏️ : formulaire inline nom + téléphone (rename cascade sur `packages`)
- **Supprimer** 🗑️ : confirmation + suppression (colis liés non supprimés)
- Expand accordéon : affiche les colis liés au client
- Badge **👤 Compte** : affiché si le client a créé un compte sur `/client/register`
- Créés automatiquement à l'ajout de colis

### 7. Détails Colis (`/edit/[id]`)
- **Historique de traçabilité** : timeline des étapes avec l'admin qui a effectué chaque action
  - 📦 Reçu en Chine → `created_by`
  - ✈️ En Transit → `transit_by`
  - 🏠 Arrivé à Lomé → `received_by`
  - ✅ Livré → `delivered_by`
- Photos, notes internes, infos client
- Suppression via API serveur (service role key)

### 8. Notifications Temps Réel (Cloche 🔔)
- Pages `/chine` et `/lome` : cloche avec badge rouge (compteur)
- **Déclenchement** : quand un client réclame son colis sur `/track`
- **Persistance** : notifications sauvegardées dans `localStorage`
- Effacement manuel via "Tout effacer"

> ⚠️ **Prérequis Realtime** : activer `packages` dans Supabase → Database → Replication → `supabase_realtime`. Si RLS activé, ajouter policy SELECT publique.

### 9. Import Excel (`/import`)
- Colonnes reconnues automatiquement (Tracking, Nom, Téléphone…)
- Déduplication interne au fichier
- Aperçu avec lignes valides (vert) / ignorées (rouge)
- `tracking_number` est la seule colonne obligatoire
- Reconnaît `BATTERIE` ou `COLIS_BATTERIE` → mappe vers `COLIS_BATTERIE`

### 10. Calcul Automatique des Tarifs
- **Ordinaire** : 10 000 FCFA / kg
- **Express** : 13 000 FCFA / kg
- **Colis Batterie** 🔋 : 11 000 FCFA / kg
- Affiché sur `/track`, `/edit`, `/client/dashboard` et dans les notifications WhatsApp

### 11. Notifications WhatsApp (Meta Cloud API)
Fichier principal : `src/lib/whatsapp.ts`

| Événement | Template | Déclencheur |
| :--- | :--- | :--- |
| Colis reçu en Chine | `colis_recu_chine` | POST `/api/packages` |
| Colis en transit | `colis_en_transit` | Bouton Transit `/chine` |
| Colis arrivé à Lomé | `colis_arrive_lome` | Bouton Réceptionner `/lome` |
| Réponse client | Auto-reply texte libre | Webhook `/api/whatsapp/webhook` |

**Auto-reply** : quand un client répond à une notif → réponse automatique avec le numéro `+228 70 15 13 30`.

**Format téléphone** : numéros togolais 8 chiffres détectés automatiquement → préfixe `+228` ajouté.

### 12. Page Politique de Confidentialité (`/privacy`)
- Accessible publiquement sur `https://hamidcargo.com/privacy`
- Requise pour le Live Mode Meta

### 13. Espace Client (`/client/*`)
Système d'authentification séparé (JWT cookie `hc_client`, table `client_accounts`).

| Route | Description |
| :--- | :--- |
| `/client/login` | Connexion par téléphone + mot de passe. Supporte `?redirect=` |
| `/client/register` | Création de compte (nom, téléphone, mot de passe min 6 chars) |
| `/client/dashboard` | Liste des colis du client, filtres (Tous/En cours/Livrés), recherche tracking, tri date, 4 actions rapides |
| `/client/profile` | Modifier nom / téléphone / mot de passe. JWT rafraîchi après modif |

**Normalisation téléphone** : `90123456` → `+22890123456` automatiquement à l'inscription, connexion et recherche de colis. Fallback suffix pour comptes legacy.

**Liaison colis** : les colis apparaissent si `packages.customer_phone` correspond au numéro du compte (toutes variantes).

**Actions rapides dashboard** : Suivre un colis · WhatsApp Lomé · Appeler · Nos tarifs.

**État vide** : contacts directs Mouhamed & Seyni (Lomé) avec boutons WhatsApp.

**Home page intelligente** : détecte session active → bouton "Mes colis" au lieu de "Connexion".

### 14. Sauvegarde Base de Données (`/admin` → tab Backup)
- Accessible **superadmin uniquement**
- Télécharge `hamidcargo_backup_YYYY-MM-DD.json` contenant : colis + clients + comptes client
- Mots de passe jamais en clair (hash bcrypt uniquement)
- Mémorise la date et le nombre de lignes de la dernière sauvegarde (localStorage)

### 15. Statistiques (`/stats`)
- Total colis exact (count query DB, pas limité à 1000)
- Répartition par statut + type d'envoi
- Revenus estimés (colis livrés × tarif)
- Poids moyen
- Graphique colis / semaine (8 dernières semaines)
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
| `archived_at` | timestamptz | Date d'archivage (set à `ARRIVE_LOME`) |
| `created_by` | text | Admin qui a enregistré le colis |
| `transit_by` | text | Admin qui a mis en transit |
| `received_by` | text | Admin qui a réceptionné à Lomé |
| `delivered_by` | text | Admin qui a livré |

> ⚠️ **Migration SQL requise** si pas encore exécutée :
> ```sql
> ALTER TABLE packages ADD COLUMN IF NOT EXISTS archived_at timestamptz;
> ALTER TABLE packages ADD COLUMN IF NOT EXISTS created_by text;
> ALTER TABLE packages ADD COLUMN IF NOT EXISTS transit_by text;
> ALTER TABLE packages ADD COLUMN IF NOT EXISTS received_by text;
> ALTER TABLE packages ADD COLUMN IF NOT EXISTS delivered_by text;
> ```

### Indexes recommandés (performance)
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
- **Base de données** : Supabase (PostgreSQL)
- **Realtime** : Supabase `postgres_changes` (WebSocket) — refetch sur INSERT/UPDATE/DELETE
- **Stockage** : Supabase Storage (Bucket: `packages`)
- **WhatsApp** : Meta Cloud API (Graph API v20.0)
- **Auth admin** : JWT (`jose`) + cookie `hc_session` — middleware `src/proxy.ts`
- **Auth client** : JWT (`jose`) + cookie `hc_client` — `src/lib/clientAuth.ts`
- **Scanner** : `BarcodeDetector` (natif) + `@zxing/library` (fallback)
- **Import** : `xlsx` (SheetJS)
- **Icônes** : `lucide-react`

### Note importante — RLS Supabase
Toutes les opérations **écriture** (INSERT, UPDATE, DELETE) passent par des routes API serveur utilisant `supabaseServer` (clé service role). La clé anon (`supabase` client) est réservée aux lectures publiques. Si RLS est activé, les écritures côté client échouent silencieusement.

### Rafraîchissement JWT permissions
`GET /api/auth/profile` re-signe automatiquement le JWT si les permissions en DB diffèrent du token. Les utilisateurs obtiennent les nouvelles permissions sans se reconnecter.

---

## 🔑 Variables d'Environnement (Vercel)

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase (serveur) |
| `JWT_SECRET` | Secret JWT partagé admin + client |
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
| `/` | Page d'accueil vitrine + contacts réels | Public |
| `/track` | Suivi de colis par numéro + bandeau connexion | Public |
| `/privacy` | Politique de confidentialité | Public |
| `/client/login` | Connexion espace client | Public |
| `/client/register` | Création compte client | Public |
| `/client/dashboard` | Mes colis + actions rapides + filtres | Client connecté |
| `/client/profile` | Modifier profil client | Client connecté |
| `/chine` | Dashboard admin Chine (paginé, archivage) | Admin |
| `/lome` | Dashboard admin Lomé | Admin |
| `/add` | Ajouter un colis | Admin |
| `/scan` | Scanner un code-barres | Admin |
| `/edit/[id]` | Détails + historique traçabilité | Admin |
| `/clients` | Liste clients + modifier/supprimer | Admin |
| `/import` | Import Excel en masse | Admin |
| `/stats` | Statistiques (counts exacts) | Admin |
| `/profile` | Profil admin | Admin |
| `/admin` | Gestion utilisateurs + paramètres + backup | Superadmin |

---

## 🗺️ Routes API

| Route | Méthode | Description |
| :--- | :--- | :--- |
| `/api/packages` | POST | Ajouter colis + notif WhatsApp |
| `/api/packages` | DELETE | Supprimer colis (1 ou plusieurs) + cleanup storage |
| `/api/packages/status` | PUT | Changer statut + notif WhatsApp + traçabilité |
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
| `/api/admin/client-phones` | GET | Téléphones des comptes clients (pour badge) |
| `/api/auth/profile` | GET | Profil admin + refresh JWT permissions |
| `/api/auth/login` | POST | Connexion admin |
| `/api/auth/logout` | POST | Déconnexion admin |

> ⚠️ Le webhook `/api/whatsapp/webhook` est exclu du middleware d'auth (`src/proxy.ts`).

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

### Colis ne s'affichent pas sur /chine :
- Vider le cache localStorage : ouvrir DevTools → Application → Local Storage → supprimer `chine_cache_v1`

### Suppression / statut ne fonctionne pas :
- Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est bien configurée dans Vercel
- Toutes les écritures passent par des routes API serveur (pas la clé anon)

---

*Document mis à jour le 17 Juin 2026 pour Hamid Cargo.*
