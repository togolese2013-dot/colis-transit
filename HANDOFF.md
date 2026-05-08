# 🚢 Hamid Cargo Logistics - Document de Passation (Handoff)

Ce document résume l'état actuel de la plateforme de gestion de colis entre la Chine et le Togo.

## 🚀 État Actuel
L'application est stable et déployée sur **Vercel**. Elle est connectée à une base de données **Supabase** pour le stockage des colis et des photos.

---

## 🛠️ Fonctionnalités Clés

### 1. Scanner Ultra-Performant (V3.0)
Le module d'ajout de colis (`/add`) intègre un scanner hybride capable de lire les étiquettes logistiques difficiles (J&T Express, etc.).
- **Technologie** : Utilise Quagga2, ZXing et l'API native BarcodeDetector.
- **Optimisation** : Redimensionnement automatique en HD et zoom central (x2) pour isoler les codes-barres.
- **Majuscules forcées** : La saisie manuelle convertit automatiquement les textes en MAJUSCULES.

### 2. Gestion Multi-Photos
- Il est possible de prendre **plusieurs photos** par colis.
- Les photos sont stockées dans le bucket `packages` de Supabase.
- Une galerie d'aperçu permet de supprimer les photos ratées avant l'enregistrement.

### 3. Calcul Automatique des Tarifs
Le système calcule le montant à payer en fonction du poids et du type d'envoi :
- **Ordinaire** : 10 000 FCFA / kg
- **Express** : 13 000 FCFA / kg

---

## 📊 Structure de la Base de Données (Supabase)

La table principale est `packages`. Voici les colonnes indispensables :

| Colonne | Type | Description |
| :--- | :--- | :--- |
| `tracking_number` | text (PK) | Numéro de suivi (ex: JT...) |
| `customer_name` | text | Nom du client |
| `customer_phone` | text | Téléphone du client |
| `weight_kg` | numeric | Poids en kilogrammes |
| `shipping_type` | text | 'ORDINAIRE' ou 'EXPRESS' |
| `status` | text | 'RECU_CHINE', 'EN_TRANSIT', 'ARRIVE_LOME', 'LIVRE' |
| `photo_url` | text | URL de la photo principale (compatibilité) |
| `photo_urls` | text[] | Tableau des URLs de toutes les photos prises |
| `created_at` | timestamptz | Date d'enregistrement |

---

## 💻 Stack Technique
- **Framework** : Next.js 14 (App Router)
- **Base de données** : Supabase (PostgreSQL)
- **Stockage** : Supabase Storage (Bucket: `packages`)
- **Bibliothèques** : `xlsx` (Import Excel), `@ericblade/quagga2`, `@zxing/library`.

---

## 🚦 Maintenance & Conseils

### En cas d'échec du scan :
1. **Nettoyez l'objectif** du téléphone.
2. **Évitez les reflets** directs sur le plastique de l'étiquette.
3. **Rafraîchissez la page** pour vider le cache du navigateur.

### Modification des prix :
Les tarifs (10 000 et 13 000) sont codés en dur dans `src/app/track/page.tsx` et `src/app/add/page.tsx`. Pour les changer, il suffit de modifier ces valeurs numériques dans le code.

---
*Document généré le 08 Mai 2026 pour Hamid Cargo.*
