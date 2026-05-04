# HerfBook — Application Design Document

**Version 0.4 — May 2026**
*Self-Hosted Cigar Collection & Tasting Journal with Community-Maintained Reference Data*

> **Status:** DRAFT — For Planning Purposes

---

## Project Identity

| | |
|---|---|
| **Name** | HerfBook |
| **Tagline** | Your cigar collection, your tasting journal, your data. |
| **Website** | [herfbook.com](https://herfbook.com) |
| **App Domain** | [herfbook.app](https://herfbook.app) |
| **Repository** | [github.com/herfbook](https://github.com/herfbook) |
| **License (Code)** | AGPL-3.0 |
| **License (Data)** | CC BY-SA 4.0 |

> **"Herf"** — cigar slang for a gathering of people for the purpose of smoking cigars. Coined on the alt.smokers.cigar newsgroup circa 1996. HerfBook is your book of herfs — a record of every cigar you collect, smoke, rate, and share.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Licensing](#2-licensing)
3. [Milestone Roadmap](#3-milestone-roadmap)
4. [Community-Maintained Lookup Lists](#4-community-maintained-lookup-lists)
5. [Data Model](#5-data-model)
6. [Guest & Friend Access](#6-guest--friend-access)
7. [Industry Ratings & Reviews — Legal Model](#7-industry-ratings--reviews--legal-model)
8. [API Contract: Local ↔ Community (M2)](#8-api-contract-local--community-m2)
9. [Architecture Overview](#9-architecture-overview)
10. [Cigar Identification](#10-cigar-identification)
11. [Key Technical Decisions](#11-key-technical-decisions)
12. [Open Questions](#12-open-questions)
13. [Repository Structure](#13-repository-structure)
14. [Next Steps](#14-next-steps)

---

## 1. Executive Summary

HerfBook is a self-hosted web application for cigar enthusiasts to manage their collection, log smoking sessions with detailed tasting notes, and track spending. The application uses a three-tier architecture: a personal collection backend, a user-facing PWA frontend, and a community reference data layer maintained via GitHub-synced YAML files.

This design supports fully independent self-hosted use today, with a clear upgrade path to an API-backed community database and optional hosted subscription model.

---

## 2. Licensing

### 2.1 Application Code — AGPL-3.0

The application source code is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**Why AGPL-3.0:**

- **Self-hosted users:** Full freedom to run, modify, and extend the application on their own infrastructure. No restrictions on personal or internal use.
- **Community contributions:** Modifications must be shared under the same license, ensuring improvements flow back to the project.
- **Network use protection:** The AGPL's key differentiator from GPL — anyone who runs a modified version as a network service (i.e., a competing hosted offering) must share their source code. This is the strongest open-source protection against someone forking the project and running a closed-source SaaS competitor.
- **Commercial hosted model:** The project maintainer (as copyright holder) retains the right to offer a hosted version under separate commercial terms, since AGPL only binds downstream users, not the original copyright holder.

**What this means in practice:**

- Self-hosted deployments: fully free, no restrictions, modify as you wish.
- If you modify the code and run it as a service for others, you must publish your changes under AGPL-3.0.
- The project maintainer can dual-license for commercial hosting without violating the AGPL.

### 2.2 Community Reference Data — CC BY-SA 4.0

All community YAML data files (brands, vitolas, wrappers, flavor tags, etc.) in the `community/` directory are licensed under **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**.

**Why CC BY-SA 4.0:**

- Matches Wikipedia's license (our primary seed source for brand data).
- Encourages contribution — anyone can use the data with attribution.
- ShareAlike ensures derivatives stay open — no one can lock up the community's curated cigar reference data.
- Separating the data license from the code license means the cigar catalog can be used by other projects (mobile apps, spreadsheets, research) even if they don't use our application code.

### 2.3 License Files

```
LICENSE              — AGPL-3.0 (application code)
community/LICENSE    — CC BY-SA 4.0 (reference data)
```

---

## 3. Milestone Roadmap

### 3.1 Milestone 1 — Self-Hosted Core + GitHub Community Data

A fully functional, independently deployable application. Reference data (brands, vitolas, wrappers, etc.) ships as YAML files in the repo and syncs from GitHub. All personal data stays on the user's infrastructure. No external API dependency required.

**Core Capabilities:**

- Multi-humidor inventory management with flexible add (box, 5-pack, singles, sampler, bundle)
- Community-maintained lookup lists for all standardized fields (see [Section 4](#4-community-maintained-lookup-lists))
- Purchase tracking: price paid, vendor/retailer, purchase date, UPC/barcode
- Smoking journal with structured tasting notes, flavor tags, and personal ratings (0–100)
- Quick-log mode: smoke a cigar not in inventory and still capture full tasting notes
- Gift tracking: received/given, from whom, occasion
- Want list driven from smoking sessions ("add to want list" flag) or manual entry
- Box splits and transfers between humidors with provenance tracking
- Humidor environment logging (temperature, humidity — manual initially)
- Cost analytics dashboard: spend/month, avg price/stick, price trends
- Cigar aging tracker: date added to humidor vs. manufacture/box date
- Image upload per cigar (personal photos, up to 3 per entry)
- Guest/friend read-only access with shareable links (see [Section 6](#6-guest--friend-access))
- Cigar swap tracking between friends with provenance
- External ratings tracking with review links (see [Section 7](#7-industry-ratings--reviews--legal-model))
- Full data export/import (JSON, CSV) — you own your data
- Docker Compose single-command deploy
- PWA with offline capability for logging sessions without connectivity

**Tech Stack:**

- Frontend: React PWA with responsive design (desktop + mobile web)
- Backend: FastAPI (Python) with PostgreSQL
- Image Storage: MinIO (S3-compatible, self-hosted)
- Community Data: YAML files in GitHub repo, synced on startup / manually
- Deployment: Docker Compose (API + Postgres + MinIO + Nginx)
- Auth: Local user accounts with JWT (single-user default, multi-user capable)

### 3.2 Milestone 2 — Central Community API + Cigar Database

Swap the GitHub-synced YAML module for a centrally hosted API-backed cigar database. The local app code changes are minimal because the community data layer is built as a pluggable module from M1. The central API becomes the canonical source for cigar catalog data, industry review links, and curated images.

**Core Capabilities:**

- Canonical cigar catalog: brand, line, vitola, wrapper/binder/filler, origin, manufacturer
- Curated links to industry reviews (Halfwheel, CA, Blind Man's Puff) — links only, not scores
- 2–3 curated reference images per cigar entry
- Submission pipeline: local instance pushes new cigars → review queue → approved/rejected
- Deduplication with fuzzy matching on brand + line + vitola
- API key per instance for rate limiting and tracking
- Opt-in sharing of tasting notes and ratings to the community layer
- Configurable sharing defaults: "Share these fields by default" per user preference
- Image contribution: upload a higher-quality photo as a candidate for canonical entry
- Local instance pulls canonical images if user has no personal photo
- API versioning from day one

**Module Swap:** The community data provider is abstracted behind a `CommunityDataProvider` interface. M1 ships with `GitHubYAMLProvider`. M2 introduces `CentralAPIProvider`. Both implement the same interface: `sync()`, `search()`, `get()`, `submit()`. The frontend and core backend code don't change — only the provider implementation swaps.

### 3.3 Milestone 3 — Community & Social Features

Build social and discovery features on top of the community database.

- Public user profiles with collection highlights and top-rated cigars
- Community aggregated ratings alongside industry review links
- Recommendation engine: "Users who rated X highly also enjoyed Y"
- Flavor profile matching across the community database
- Discussion threads per cigar entry
- Virtual herf / smoking session groups
- Retailer/lounge directory with user reviews
- Achievement system (e.g., "Smoked 10 different Padron vitolas")

### 3.4 Hosted Subscription Model (Optional)

Designing for multi-tenancy from the start (`user_id` on all personal tables) keeps the hosted option open without rearchitecting.

- Same Docker stack deployed to managed infrastructure
- Multi-tenancy via `user_id` foreign key (self-hosted = 1 user)
- Auth upgrade: Auth0 for hosted; local JWT remains for self-hosted
- Image storage quotas per tier (primary cost driver)
- Free tier: limited collection (50 cigars), community DB read-only, basic analytics
- Paid tier ($X/year): unlimited collection, full analytics, AI identification, export, image storage

---

## 4. Community-Maintained Lookup Lists

Adapted from the AmmoLedger pattern. Shared reference data lives as YAML files in the GitHub repo. Each self-hosted instance syncs from GitHub and merges community data with local user-created entries. The system is designed as a pluggable module so the YAML/GitHub backend can be swapped for a central API in Milestone 2 with minimal code changes.

### 4.1 Lookup List Inventory

The following fields are standardized as community-maintained lookup lists rather than free text. This prevents data drift ("med" vs "Medium" vs "MEDIUM") and enables meaningful filtering, analytics, and community data sharing.

| YAML File | Priority | Description |
|---|---|---|
| `brands.yml` | M1 — Ship | Cigar brand names with manufacturer FK, country, website, active status. The largest and most important list. (e.g., Padron, Arturo Fuente, Oliva, Drew Estate, My Father, Liga Privada) |
| `manufacturers.yml` | M1 — Ship | Parent companies that own/produce brands. One manufacturer → many brands. (e.g., General Cigar Co., Altadis USA, Scandinavian Tobacco Group, Padrón Cigars S.A.) |
| `vitolas.yml` | M1 — Ship | Standard shape/size combinations. Each entry includes name, length (inches), ring gauge, and shape category (parejo or figurado). Ring gauge is a property of a vitola, not a standalone list. (e.g., Robusto 5×50, Toro 6×50, Churchill 7×48, Corona 5.5×42, Lancero 7.5×38, Gordo 6×60, Torpedo, Belicoso, Perfecto) |
| `wrappers.yml` | M1 — Ship | Wrapper leaf types with color category and origin region. (e.g., Connecticut Shade, Connecticut Broadleaf, Habano, Maduro, Oscuro, Candela, Corojo, Cameroon, Sumatra, San Andres) |
| `binders.yml` | M1 — Ship | Binder leaf types. Separate from wrappers because the same leaf can serve as either. Similar fields. |
| `fillers.yml` | M1 — Ship | Filler tobaccos. Relationship is many-to-many (cigars use blends). Includes country and leaf priming where applicable. (e.g., Nicaraguan Ligero, Dominican Seco, Honduran Viso, Piloto Cubano) |
| `countries.yml` | M1 — Ship | Country of origin for the cigar. Short, rarely changes. (e.g., Cuba, Nicaragua, Dominican Republic, Honduras, Mexico, USA, Ecuador, Brazil) |
| `strength_levels.yml` | M1 — Ship | Standardized strength scale. Prevents drift. (Mild, Mild-Medium, Medium, Medium-Full, Full) |
| `flavor_tags.yml` | M1 — Ship | Tasting vocabulary organized by category. Benefits most from community curation. Categories: wood (cedar, oak, hickory), spice (pepper, cinnamon, clove), sweet (cocoa, chocolate, caramel, vanilla, honey), earth (leather, soil, moss, mushroom), nut (almond, walnut, peanut), fruit (citrus, berry, dried fruit, raisin), roast (coffee, espresso, toast, char), cream (cream, butter, milk), floral (hay, grass, floral), misc (mineral, salt, metallic) |
| `purchase_types.yml` | M1 — Ship | How the cigars were purchased. Tiny list. (Box, 5-Pack, Single, Sampler, Bundle, Gift) |
| `environments.yml` | M1 — Ship | Smoking environment tags. (Indoor, Outdoor – Patio, Outdoor – Yard, Lounge, Golf Course, Boat, Camping, Car, Other) |
| `vendors.yml` | M2 — Later | Retailers and lounges. Could get large. Fields: name, url, type (online/B&M/lounge), state, country. Stays user-only for M1, becomes community in M2. |
| `occasions.yml` | Optional | Smoking occasions. May stay free text with typeahead suggestions. (Celebration, Daily, Special Reserve, Holiday, Bachelor Party, Birth of Child, Promotion, Retirement) |

### 4.2 YAML File Structure

Each YAML file lives in a `community/` directory at the repository root. Files follow a consistent structure with a top-level key matching the filename.

**`community/brands.yml`**
```yaml
brands:
  - name: Padron
    manufacturer: Padrón Cigars S.A.
    country: Nicaragua
    website: https://padron.com
  - name: Arturo Fuente
    manufacturer: Tabacalera A. Fuente y Cia
    country: Dominican Republic
    website: https://arturofuente.com
```

**`community/vitolas.yml`**
```yaml
vitolas:
  - name: Robusto
    length_inches: 5.0
    ring_gauge: 50
    category: parejo
  - name: Toro
    length_inches: 6.0
    ring_gauge: 50
    category: parejo
  - name: Torpedo
    length_inches: 6.5
    ring_gauge: 52
    category: figurado
```

**`community/wrappers.yml`**
```yaml
wrappers:
  - name: Connecticut Shade
    color_category: claro
    origin_region: Connecticut River Valley
  - name: Maduro
    color_category: maduro
    origin_region: Various
```

**`community/flavor_tags.yml`**
```yaml
flavor_tags:
  - name: Cedar
    category: wood
  - name: Leather
    category: earth
  - name: Black Pepper
    category: spice
  - name: Dark Chocolate
    category: sweet
```

### 4.3 Database Model for Lookup Tables

Every lookup table shares the same community tracking fields from the AmmoLedger pattern. This enables the three-source model (community, user, local), admin review flow, and eventual PR contribution.

| Field | Type | Purpose |
|---|---|---|
| `source` | VARCHAR(20) | `"community"` (from YAML), `"user"` (created locally), or `"local"` (demoted from community) |
| `community_key` | VARCHAR(200) | Slugified name for stable matching across syncs (e.g., `"connecticut-shade"`) |
| `is_imported` | BOOLEAN | `FALSE` = pending admin review, `TRUE` = approved for use in dropdowns |
| `is_active` | BOOLEAN | `FALSE` = hidden from dropdowns (admin chose to hide it) |

**Three-Source Model:**

- **Community** (`source: "community"`): Entries from the upstream YAML files on GitHub. Managed by the project maintainer via PRs. All instances share these.
- **User** (`source: "user"`): Entries created locally by the instance admin. Only exist on that instance. Can be contributed back via PR.
- **Local** (`source: "local"`): Entries demoted from community (removed from YAML or renamed by admin). Detached from upstream sync.

### 4.4 Sync Process

A background task runs on container startup and can be triggered manually from the admin UI.

1. **Fetch YAML** from GitHub raw URL. Falls back to a bundled copy baked into the Docker image if GitHub is unreachable.
2. **For each YAML entry**, slugify the name to create a `community_key`.
3. **Match against the database:** match by `community_key` first (fast path), then by name (case-insensitive) for pre-existing entries. If no match, create a new entry with `is_imported=FALSE` (pending review).
4. **Orphan demotion:** after processing all YAML entries, find DB entries with `source=community` whose `community_key` is no longer in the YAML. Demote them to `source=local` and clear `community_key`. Never delete — they might be referenced by existing records.
5. **On first-run** (no community entries exist), auto-import all entries with `is_imported=TRUE` so the app is immediately usable.

**First-Run Experience:** When the app starts for the first time, all community entries are auto-approved. The user gets a fully populated set of brands, vitolas, wrappers, etc. without any manual review. Subsequent syncs surface new additions as pending for review.

### 4.5 Admin Review Flow

New community entries arrive with `is_imported=FALSE` after the initial first-run auto-import.

- They appear in the admin's dataset management page with a "Pending review" badge
- They are excluded from all dropdown menus until approved
- An amber banner shows "N new community entries available" with a "Review & Import" button
- The sidebar nav shows a pending count badge

**Review Dialog:** Admin can check entries to accept (`is_imported=TRUE`, appears in dropdowns) or uncheck to reject (`is_active=FALSE`, hidden). Bulk approve/reject supported.

**Rename/Edit Behavior:** If an admin renames a community entry, it detaches: `source` → `"local"`, `community_key` → `null`. The next sync won't overwrite the rename. The original community entry will be re-created as a new pending entry.

### 4.6 Contributing Back

The admin UI includes a "Generate PR Content" button that queries all `source=user` entries for a given lookup table, generates YAML text, and provides a "Copy to Clipboard" button plus a link to the GitHub file editor. The admin can paste into a PR to add their local entries to the community list.

This is deliberately low-tech for M1 — no direct API integration with GitHub. Just clipboard + browser. In M2, this becomes a proper submission pipeline with server-side review.

### 4.7 Module Architecture

The community data layer is abstracted behind a `CommunityDataProvider` interface. This is the key design decision that enables the M1 → M2 transition.

```python
class CommunityDataProvider(Protocol):
    async def sync(self) -> SyncResult:
        """Pull latest reference data from upstream."""

    async def search(self, table: str, query: str) -> list[dict]:
        """Search reference data by name/key."""

    async def get(self, table: str, key: str) -> dict | None:
        """Get a single entry by community_key."""

    async def submit(self, table: str, entry: dict) -> SubmitResult:
        """Submit a new entry for community review."""

    async def get_images(self, cigar_key: str) -> list[str]:
        """Get image URLs for a cigar (M2 only)."""
```

- **M1 — `GitHubYAMLProvider`:** Reads YAML from GitHub raw URLs, parses and upserts into local DB. `submit()` generates PR-ready YAML text. `get_images()` returns empty (no community images in M1).
- **M2 — `CentralAPIProvider`:** Calls the community REST API endpoints. `sync()` uses `/v1/cigars/updated?since=`. `submit()` POSTs to `/v1/submissions`. `get_images()` fetches from CDN. Drop-in replacement, same interface.

### 4.8 Community Data API Endpoints (M1 — Local)

These endpoints are on the local self-hosted API, not a central server.

| Endpoint | Method | Purpose |
|---|---|---|
| `/community/status` | GET | Per-table counts: total, imported, pending, hidden |
| `/community/sync` | POST | Triggers manual sync from GitHub (admin only) |
| `/community/import` | POST | Sets `is_imported=TRUE` on specified entry IDs |
| `/community/hide` | POST | Sets `is_active=FALSE` on specified entry IDs |
| `/community/unhide` | POST | Sets `is_active=TRUE` on specified entry IDs |
| `/community/contribute/{table}` | GET | Returns YAML of user-created entries for PR submission |

### 4.9 Seeding Sources

For each lookup list, here's where we source initial data and the legal basis for each.

| YAML File | Primary Source | Legal Basis | Est. Count |
|---|---|---|---|
| `brands.yml` | Wikipedia "List of cigar brands" (CC BY-SA) | CC-licensed. Brand names are not copyrightable. | 200–300 |
| `manufacturers.yml` | Wikipedia "Cigar manufacturing companies" category | CC-licensed. Company names are factual data. | 30–50 |
| `vitolas.yml` | Industry standard sizes (common knowledge) | Vitola names and traditional dimensions are industry-standard terms. | 25–35 |
| `wrappers.yml` | Agricultural/botanical terminology | Leaf variety names are descriptive terms. | 20–25 |
| `binders.yml` | Same as wrappers | Same basis. | 15–20 |
| `fillers.yml` | Botanical + geographic terminology | Country + priming names are factual. | 20–25 |
| `countries.yml` | ISO 3166 country list | International standard, public domain. | 8–12 |
| `strength_levels.yml` | Industry convention | 5 common terms, universally used. | 5 |
| `flavor_tags.yml` | Original taxonomy (our creation) | We define the vocabulary. | 60–80 |
| `purchase_types.yml` | Common sense | Descriptive terms. | 6 |
| `environments.yml` | Common sense | Descriptive terms. | 8–10 |

**Wikipedia as Primary Seed:** The Wikipedia "List of cigar brands" page is CC BY-SA licensed and contains a comprehensive alphabetical list with brand name, owning company, and source references. This gives us both `brands.yml` and most of `manufacturers.yml` in one pass.

**Existing APIs to Evaluate:**

- **RapidAPI "Cigars" API:** First publicly available cigar data API. Provides brand and cigar lists with filtering. Worth evaluating for data quality and licensing terms.
- **Elite Cigar Library:** Comprehensive cigar database. Considering adding API access. Worth monitoring for M2 partnership.
- **Cigar Geeks:** Long-running community with large database. No public API. Data is proprietary.
- **Cigar Sense:** Recommendation engine with 150+ parameters per cigar. Subscription-based. Proprietary but worth studying for flavor profiling approach.

---

## 5. Data Model

The schema is designed to work at both the local (self-hosted) and community levels. Lookup tables include community tracking fields. All personal tables include a `user_id` column for multi-tenant readiness.

### 5.1 Lookup Tables (Community-Maintained)

#### `manufacturers`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(200) | NO | e.g., General Cigar Co. |
| `website` | VARCHAR(500) | YES | |
| `country` | VARCHAR(100) | YES | Country of HQ |
| `source` | VARCHAR(20) | NO | community / user / local |
| `community_key` | VARCHAR(200) | YES | Slugified name for sync matching |
| `is_imported` | BOOLEAN | NO | Approved for dropdowns |
| `is_active` | BOOLEAN | NO | Visible in UI |

#### `brands`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(200) | NO | e.g., Padron |
| `manufacturer_id` | UUID | YES | FK → manufacturers |
| `country` | VARCHAR(100) | YES | Country of origin |
| `website` | VARCHAR(500) | YES | |
| `source` | VARCHAR(20) | NO | community / user / local |
| `community_key` | VARCHAR(200) | YES | Slugified name |
| `is_imported` | BOOLEAN | NO | |
| `is_active` | BOOLEAN | NO | |

#### `vitolas`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(100) | NO | e.g., Robusto, Toro, Churchill |
| `length_inches` | DECIMAL(3,1) | YES | e.g., 5.0, 6.0, 7.0 |
| `ring_gauge` | INT | YES | e.g., 50, 52, 48 |
| `category` | VARCHAR(20) | YES | parejo or figurado |
| `source` | VARCHAR(20) | NO | |
| `community_key` | VARCHAR(200) | YES | |
| `is_imported` | BOOLEAN | NO | |
| `is_active` | BOOLEAN | NO | |

> **Ring Gauge Design Decision:** Ring gauge is stored as a property of a vitola (two separate columns: `length_inches` + `ring_gauge`), not as a standalone lookup table. This matches how cigars are actually categorized. The `cigars` table has override fields (`custom_length`, `custom_ring_gauge`) for non-standard sizes. The display layer concatenates them as "6 × 50" but storage stays normalized. This enables independent filtering ("show me everything 50-ring and above") and analytics by ring gauge preference.

#### `wrappers`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(100) | NO | e.g., Connecticut Shade |
| `color_category` | VARCHAR(30) | YES | claro / colorado claro / colorado / colorado maduro / maduro / oscuro |
| `origin_region` | VARCHAR(100) | YES | e.g., Connecticut River Valley |
| `source` | VARCHAR(20) | NO | |
| `community_key` | VARCHAR(200) | YES | |
| `is_imported` | BOOLEAN | NO | |
| `is_active` | BOOLEAN | NO | |

#### `binders`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(100) | NO | |
| `origin_region` | VARCHAR(100) | YES | |
| `source` | VARCHAR(20) | NO | |
| `community_key` | VARCHAR(200) | YES | |
| `is_imported` | BOOLEAN | NO | |
| `is_active` | BOOLEAN | NO | |

#### `fillers`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(100) | NO | e.g., Nicaraguan Ligero |
| `country` | VARCHAR(100) | YES | |
| `priming` | VARCHAR(50) | YES | ligero / seco / viso / volado |
| `source` | VARCHAR(20) | NO | |
| `community_key` | VARCHAR(200) | YES | |
| `is_imported` | BOOLEAN | NO | |
| `is_active` | BOOLEAN | NO | |

#### `countries`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(100) | NO | e.g., Nicaragua |
| `iso_code` | VARCHAR(3) | YES | ISO 3166-1 alpha-2 |
| `source` | VARCHAR(20) | NO | |
| `community_key` | VARCHAR(200) | YES | |
| `is_imported` | BOOLEAN | NO | |
| `is_active` | BOOLEAN | NO | |

#### `strength_levels`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(30) | NO | e.g., Medium-Full |
| `sort_order` | INT | NO | For display ordering (1–5) |
| `source` | VARCHAR(20) | NO | |
| `community_key` | VARCHAR(200) | YES | |
| `is_imported` | BOOLEAN | NO | |
| `is_active` | BOOLEAN | NO | |

#### `flavor_tags`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(50) | NO | e.g., Cedar, Leather, Black Pepper |
| `category` | VARCHAR(50) | YES | wood / spice / sweet / earth / nut / fruit / roast / cream / floral / misc |
| `source` | VARCHAR(20) | NO | |
| `community_key` | VARCHAR(200) | YES | |
| `is_imported` | BOOLEAN | NO | |
| `is_active` | BOOLEAN | NO | |

#### `purchase_types`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(50) | NO | Box / 5-Pack / Single / Sampler / Bundle / Gift |
| `source` | VARCHAR(20) | NO | |
| `community_key` | VARCHAR(200) | YES | |
| `is_imported` | BOOLEAN | NO | |
| `is_active` | BOOLEAN | NO | |

#### `environments`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `name` | VARCHAR(50) | NO | Indoor / Outdoor – Patio / Lounge / etc. |
| `source` | VARCHAR(20) | NO | |
| `community_key` | VARCHAR(200) | YES | |
| `is_imported` | BOOLEAN | NO | |
| `is_active` | BOOLEAN | NO | |

### 5.2 Core Entity Tables

#### `users`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `username` | VARCHAR(100) | NO | Login identifier |
| `email` | VARCHAR(255) | YES | Optional, for notifications |
| `password_hash` | VARCHAR(255) | NO | bcrypt hash |
| `display_name` | VARCHAR(100) | YES | Shown in shared notes |
| `sharing_defaults` | JSONB | YES | Which fields to share by default |
| `preferences` | JSONB | YES | UI prefs, units, theme |
| `api_key` | VARCHAR(255) | YES | For community API auth (M2) |
| `created_at` | TIMESTAMP | NO | |
| `updated_at` | TIMESTAMP | NO | |

#### `humidors`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | FK → users |
| `name` | VARCHAR(100) | NO | e.g., Main Humidor, Travel Case |
| `description` | TEXT | YES | |
| `capacity` | INT | YES | Max cigar count |
| `location` | VARCHAR(255) | YES | Physical location |
| `target_humidity` | DECIMAL(4,1) | YES | Target RH % |
| `target_temp_f` | DECIMAL(4,1) | YES | Target temp °F |
| `is_active` | BOOLEAN | NO | Soft delete / archive |
| `created_at` | TIMESTAMP | NO | |

#### `humidor_readings`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `humidor_id` | UUID | NO | FK → humidors |
| `humidity` | DECIMAL(4,1) | YES | Measured RH % |
| `temperature_f` | DECIMAL(4,1) | YES | Measured temp °F |
| `source` | VARCHAR(50) | NO | `manual` / `sensor_api` |
| `recorded_at` | TIMESTAMP | NO | |

#### `cigars`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key (local) |
| `community_id` | UUID | YES | FK to community DB if synced (M2) |
| `user_id` | UUID | NO | FK → users (who created locally) |
| `brand_id` | UUID | NO | FK → brands (lookup) |
| `line` | VARCHAR(200) | YES | e.g., 1964 Anniversary, Serie V. Free text with typeahead. |
| `vitola_id` | UUID | YES | FK → vitolas (lookup) |
| `custom_vitola_name` | VARCHAR(100) | YES | Override if vitola doesn't match standard list |
| `custom_length` | DECIMAL(3,1) | YES | Override length |
| `custom_ring_gauge` | INT | YES | Override ring gauge |
| `wrapper_id` | UUID | YES | FK → wrappers (lookup) |
| `binder_id` | UUID | YES | FK → binders (lookup) |
| `country_id` | UUID | YES | FK → countries (lookup) |
| `manufacturer_id` | UUID | YES | FK → manufacturers (lookup) |
| `strength_id` | UUID | YES | FK → strength_levels (lookup) |
| `upc` | VARCHAR(50) | YES | Barcode if available |
| `description` | TEXT | YES | Personal notes about this cigar |
| `is_user_created` | BOOLEAN | NO | TRUE if not from community DB |
| `submission_status` | VARCHAR(20) | YES | null / submitted / approved / rejected |
| `created_at` | TIMESTAMP | NO | |
| `updated_at` | TIMESTAMP | NO | |

> **Design Decision — `line` as Free Text:** Line names (e.g., "1964 Anniversary", "Serie V Melanio") are too numerous and brand-specific to standardize as a lookup. Free text with typeahead from existing entries. The community cigar catalog (M2) becomes the de facto standardization layer for brand + line combinations.

#### `cigar_fillers` (many-to-many)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `cigar_id` | UUID | NO | FK → cigars |
| `filler_id` | UUID | NO | FK → fillers (lookup) |

#### `cigar_images`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `cigar_id` | UUID | NO | FK → cigars |
| `user_id` | UUID | NO | FK → users |
| `image_url` | VARCHAR(500) | NO | MinIO/S3 path |
| `image_type` | VARCHAR(20) | NO | `band` / `full` / `ash` |
| `is_primary` | BOOLEAN | NO | Display image |
| `contributed` | BOOLEAN | NO | Offered to community DB |
| `sort_order` | INT | NO | Display sequence |
| `created_at` | TIMESTAMP | NO | |

#### `inventory`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | FK → users |
| `cigar_id` | UUID | NO | FK → cigars |
| `humidor_id` | UUID | YES | FK → humidors (null = unassigned) |
| `quantity` | INT | NO | Current count |
| `purchase_date` | DATE | YES | |
| `purchase_price` | DECIMAL(8,2) | YES | Total price paid |
| `price_per_stick` | DECIMAL(8,2) | YES | Calculated or entered |
| `vendor` | VARCHAR(200) | YES | Free text M1, lookup M2 |
| `vendor_url` | VARCHAR(500) | YES | Online retailer link |
| `purchase_type_id` | UUID | YES | FK → purchase_types (lookup) |
| `box_code` | VARCHAR(50) | YES | Factory box date code |
| `date_added_humidor` | DATE | YES | When placed in humidor (aging) |
| `is_gift` | BOOLEAN | NO | Was this a gift? |
| `gift_from` | VARCHAR(200) | YES | Who gave it |
| `gift_occasion` | VARCHAR(200) | YES | Birthday, holiday, etc. |
| `gift_to` | VARCHAR(200) | YES | If you gave it away |
| `notes` | TEXT | YES | Inventory-level notes |
| `created_at` | TIMESTAMP | NO | |
| `updated_at` | TIMESTAMP | NO | |

#### `inventory_transfers`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `inventory_id` | UUID | NO | FK → inventory |
| `from_humidor_id` | UUID | YES | Source humidor |
| `to_humidor_id` | UUID | YES | Destination humidor |
| `quantity` | INT | NO | How many moved |
| `transferred_at` | TIMESTAMP | NO | |
| `notes` | TEXT | YES | |

#### `smoking_sessions`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | FK → users |
| `cigar_id` | UUID | NO | FK → cigars |
| `inventory_id` | UUID | YES | FK → inventory (null = quick-log) |
| `smoked_at` | TIMESTAMP | NO | When the session occurred |
| `duration_minutes` | INT | YES | How long the smoke lasted |
| `location` | VARCHAR(255) | YES | Where you smoked |
| `environment_id` | UUID | YES | FK → environments (lookup) |
| `occasion` | VARCHAR(200) | YES | Free text or typeahead |
| `personal_rating` | INT | YES | 0–100 scale |
| `would_buy_again` | BOOLEAN | YES | Quick repurchase signal |
| `add_to_want_list` | BOOLEAN | NO | Flag to add cigar to want list |
| `shared_to_community` | BOOLEAN | NO | Was this note shared |
| `created_at` | TIMESTAMP | NO | |
| `updated_at` | TIMESTAMP | NO | |

#### `tasting_notes`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `session_id` | UUID | NO | FK → smoking_sessions |
| `draw_quality` | VARCHAR(20) | YES | tight / perfect / loose |
| `burn_quality` | VARCHAR(20) | YES | even / uneven / canoe / tunnel |
| `ash_color` | VARCHAR(20) | YES | white / gray / dark |
| `ash_hold` | VARCHAR(20) | YES | short / medium / long / excellent |
| `strength_first_id` | UUID | YES | FK → strength_levels |
| `strength_second_id` | UUID | YES | FK → strength_levels |
| `strength_third_id` | UUID | YES | FK → strength_levels |
| `flavor_first` | TEXT | YES | Free text: first third flavors |
| `flavor_second` | TEXT | YES | Free text: second third flavors |
| `flavor_third` | TEXT | YES | Free text: final third flavors |
| `overall_notes` | TEXT | YES | General impressions |
| `retrohale_notes` | TEXT | YES | Retrohale specific notes |
| `finish` | VARCHAR(50) | YES | short / medium / long / lingering |

#### `session_flavor_tags`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `session_id` | UUID | NO | FK → smoking_sessions |
| `tag_id` | UUID | NO | FK → flavor_tags (lookup) |
| `third` | VARCHAR(10) | YES | first / second / third / all |

#### `pairings`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `session_id` | UUID | NO | FK → smoking_sessions |
| `type` | VARCHAR(20) | NO | drink / food |
| `name` | VARCHAR(200) | NO | What was paired |
| `notes` | TEXT | YES | How it paired |
| `rating` | INT | YES | Pairing quality 1–5 |

#### `want_list`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | FK → users |
| `cigar_id` | UUID | YES | FK → cigars (null if free-text entry) |
| `session_id` | UUID | YES | FK → smoking_sessions (source if from session) |
| `notes` | TEXT | YES | Why you want it |
| `priority` | VARCHAR(20) | YES | high / medium / low |
| `target_price` | DECIMAL(8,2) | YES | Max you'd pay |
| `fulfilled` | BOOLEAN | NO | Purchased? |
| `fulfilled_inventory_id` | UUID | YES | FK → inventory when purchased |
| `created_at` | TIMESTAMP | NO | |

#### `cigar_external_ratings`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `cigar_id` | UUID | NO | FK → cigars |
| `user_id` | UUID | NO | FK → users |
| `source_name` | VARCHAR(100) | NO | e.g., Cigar Aficionado, Halfwheel |
| `score` | DECIMAL(4,1) | YES | Numeric rating (user-entered) |
| `review_url` | VARCHAR(500) | YES | Link to the review |
| `review_date` | DATE | YES | When the review was published |
| `reviewer_name` | VARCHAR(100) | YES | Who wrote the review |
| `personal_notes` | TEXT | YES | User's notes about this rating/review |
| `created_at` | TIMESTAMP | NO | |

### 5.3 Community Database Schema (Milestone 2)

Separate PostgreSQL database on the central host. Replaces the GitHub YAML approach for cigar catalog data. This is the canonical cigar reference catalog with curated review links, curated images, and aggregated community data.

#### `community_cigars`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key (canonical ID) |
| `brand` | VARCHAR(200) | NO | Denormalized for API simplicity |
| `line` | VARCHAR(200) | YES | |
| `vitola_name` | VARCHAR(100) | YES | |
| `vitola_size` | VARCHAR(50) | YES | e.g., 5 × 50 |
| `ring_gauge` | INT | YES | |
| `length_inches` | DECIMAL(3,1) | YES | |
| `wrapper` | VARCHAR(100) | YES | |
| `binder` | VARCHAR(100) | YES | |
| `filler` | VARCHAR(200) | YES | |
| `country` | VARCHAR(100) | YES | |
| `manufacturer` | VARCHAR(200) | YES | |
| `strength` | VARCHAR(20) | YES | |
| `description` | TEXT | YES | Community-written description |
| `year_introduced` | INT | YES | |
| `is_discontinued` | BOOLEAN | NO | |
| `community_avg_rating` | DECIMAL(3,1) | YES | Aggregated from user ratings |
| `community_rating_count` | INT | YES | |
| `confidence_score` | DECIMAL(3,2) | YES | Data quality score |
| `created_at` | TIMESTAMP | NO | |
| `updated_at` | TIMESTAMP | NO | |

#### `community_cigar_images`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `cigar_id` | UUID | NO | FK → community_cigars |
| `image_url` | VARCHAR(500) | NO | CDN/S3 path |
| `image_type` | VARCHAR(20) | NO | band / full / ash |
| `is_primary` | BOOLEAN | NO | Default display image |
| `contributed_by` | UUID | YES | Instance that submitted |
| `sort_order` | INT | NO | Max 2–3 per cigar |
| `approved_at` | TIMESTAMP | YES | |

#### `community_review_links`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `community_cigar_id` | UUID | NO | FK → community_cigars |
| `source_name` | VARCHAR(100) | NO | Publication name |
| `review_url` | VARCHAR(500) | NO | URL to the review |
| `review_date` | DATE | YES | When published |
| `submitted_by` | UUID | YES | Instance that contributed this link |
| `is_verified` | BOOLEAN | NO | Admin confirmed URL works |
| `created_at` | TIMESTAMP | NO | |

#### `submissions`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `cigar_data` | JSONB | NO | Full cigar payload |
| `submitted_by` | UUID | NO | Instance API key identifier |
| `status` | VARCHAR(20) | NO | submitted / under_review / approved / rejected |
| `matched_cigar_id` | UUID | YES | If duplicate detected |
| `reviewer_notes` | TEXT | YES | |
| `submitted_at` | TIMESTAMP | NO | |
| `reviewed_at` | TIMESTAMP | YES | |

#### `shared_tasting_notes`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `community_cigar_id` | UUID | NO | FK → community_cigars |
| `anonymous_user_id` | UUID | NO | Hashed user identifier |
| `personal_rating` | INT | YES | 0–100 |
| `flavor_tags` | JSONB | YES | Array of tag names |
| `tasting_summary` | TEXT | YES | |
| `strength_profile` | JSONB | YES | First/second/third |
| `would_buy_again` | BOOLEAN | YES | |
| `shared_at` | TIMESTAMP | NO | |

#### `api_keys`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `instance_id` | UUID | NO | Unique instance identifier |
| `key_hash` | VARCHAR(255) | NO | |
| `tier` | VARCHAR(20) | NO | free / paid |
| `rate_limit_rpm` | INT | NO | |
| `last_sync_at` | TIMESTAMP | YES | |
| `created_at` | TIMESTAMP | NO | |
| `revoked_at` | TIMESTAMP | YES | |

---

## 6. Guest & Friend Access

Even in a self-hosted, single-owner deployment, there's a clear use case for letting friends view parts of your collection. This section defines a lightweight guest access model and a cigar swap tracking feature, both designed for Milestone 1.

### 6.1 Guest Access Model

The instance owner generates shareable invite links. Each link carries a permission set that controls what the guest can see. No password or email required for guests — the link itself is the authentication token (UUID-based, unguessable). Links can be time-limited or permanent, and revocable at any time.

**Permission Levels:**

- **Collection View:** See which cigars you have, brand/line/vitola, humidor assignment, quantities. No pricing, no vendor info.
- **Tasting Journal:** See your smoking sessions, tasting notes, ratings, flavor tags, pairings.
- **Humidor Status:** See humidor names, contents, and aging data.
- **Want List:** See your wish list. Useful for gift-giving or swap planning.
- **Swap List:** See a curated subset of cigars you're willing to trade (see 6.2).

**Explicitly Excluded (Never Visible to Guests):**

- Purchase prices, price per stick, total spend
- Vendor/retailer information and URLs
- Gift details (who gave you what)
- Analytics/spending dashboards
- Admin settings, community sync, API keys

#### `guest_links`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | FK → users (owner) |
| `token` | VARCHAR(64) | NO | Unique, unguessable URL token |
| `label` | VARCHAR(100) | YES | Friendly name (e.g., "Poker Night Crew") |
| `permissions` | JSONB | NO | Array of allowed views: collection, journal, humidors, want_list, swap_list |
| `expires_at` | TIMESTAMP | YES | null = never expires |
| `is_active` | BOOLEAN | NO | Revoke without deleting |
| `last_accessed` | TIMESTAMP | YES | |
| `created_at` | TIMESTAMP | NO | |

The guest accesses the collection via a URL like `https://your-instance.com/g/{token}`. The frontend renders a read-only view filtered by the permission set. No account creation, no login flow, no cookies beyond the session.

### 6.2 Cigar Swap Tracking

A swap is a peer-to-peer cigar exchange. The owner creates a "Swap List" — a curated subset of their inventory they're willing to trade. Friends with `swap_list` guest access can see this list. When a swap is agreed upon, both sides record it.

#### `swap_list_items`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | FK → users |
| `inventory_id` | UUID | NO | FK → inventory |
| `max_quantity` | INT | YES | How many available for swap (null = all) |
| `notes` | TEXT | YES | What you'd want in return, conditions, etc. |
| `is_active` | BOOLEAN | NO | |
| `created_at` | TIMESTAMP | NO | |

#### `swaps`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | FK → users (owner) |
| `partner_name` | VARCHAR(200) | NO | Who you're swapping with |
| `status` | VARCHAR(20) | NO | proposed / accepted / shipped / received / completed |
| `notes` | TEXT | YES | |
| `created_at` | TIMESTAMP | NO | |
| `completed_at` | TIMESTAMP | YES | |

#### `swap_items`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `swap_id` | UUID | NO | FK → swaps |
| `direction` | VARCHAR(10) | NO | `outgoing` (I'm sending) / `incoming` (I'm receiving) |
| `cigar_id` | UUID | NO | FK → cigars |
| `inventory_id` | UUID | YES | FK → inventory (for outgoing) |
| `quantity` | INT | NO | |
| `notes` | TEXT | YES | |

When a swap is completed, outgoing items decrement the sender's inventory and incoming items create new inventory entries with provenance metadata: `is_gift=FALSE`, a swap-specific note like "Received from Mike via swap #12", and the original `cigar_id` linked so tasting notes are associated with the right cigar.

---

## 7. Industry Ratings & Reviews — Legal Model

The distinction between self-hosted personal use and community redistribution is critical. This section defines what we can do, what we should avoid, and how to architect the feature to stay clean.

### 7.1 The Two Contexts

| | Self-Hosted (Personal) | Community DB (Redistributed) |
|---|---|---|
| **Numeric Scores** | User can manually enter scores from review sites. Personal reference data. Like writing it on an index card. | Cannot scrape and redistribute scores from CA, Halfwheel, BMP. These are editorial content and their business model. |
| **Review Text** | User can paste excerpts for personal notes. Fair use for personal reference. | Cannot reproduce review text. Not even summaries that closely mirror the original. |
| **Review Links** | User can store URLs to reviews. Bookmarking. No issue. | Can store and share URLs. Linking to published content is not infringement. This is the safe path. |
| **Images** | User can save any image for personal reference. | Cannot redistribute publication photos. Community images must be user-contributed originals only. |

### 7.2 Self-Hosted: What We Build

The self-hosted instance treats ratings and reviews as personal reference data. The user is bookmarking and note-taking, not publishing. The `cigar_external_ratings` table (defined in Section 5.2) lets the user track multiple external ratings per cigar. They can see their personal 87 next to CA's 94 and Halfwheel's 91. The delta between personal and industry ratings becomes a useful calibration tool over time.

The UI for this is an "External Ratings" section on the cigar detail page with an "Add Rating" button. Source name is a dropdown (seeded with common publications) with a free-text option. Score and URL are the key fields. The review text itself is never stored — just the link.

### 7.3 Community DB: The Link-First Approach

For the community database, we take a conservative approach. The `community_review_links` table (defined in Section 5.3) stores curated URLs to published reviews — never scores, never text.

**Safe to store & share in the community DB:**

- **Review URLs:** Links to published reviews. Linking is not infringement. The cigar entry becomes a hub of curated links to authoritative reviews.
- **Community User Ratings:** Our users' own 0–100 ratings. Original data, not derived from any publication.
- **Factual Metadata:** Brand, line, vitola, wrapper, country, manufacturer, year introduced, discontinued status.
- **User-Contributed Flavor Tags:** Aggregated from shared tasting notes. Original user data.

**NOT safe to store & share in the community DB:**

- **Publication Scores:** Cannot redistribute CA, Halfwheel, or BMP numeric scores.
- **Review Text/Summaries:** No excerpts, no paraphrases.
- **Publication Images:** Community images must be original user contributions.

**Advantages of the link-first approach:**

- Zero legal risk — linking to content is universally accepted
- Always up-to-date — links point to the live review, not a stale copy
- Drives traffic to review sites — positions us as complementary, not competitive
- Review sites may welcome the referral traffic and become friendly to the project
- Users who want scores can click through; the information exists one click away

### 7.4 Future Partnerships (M3+)

If the project gains traction, natural conversations with Halfwheel, CA, and others:

- Official data partnership: licensed access to scores in exchange for referral traffic and attribution
- Affiliate model: review links include affiliate tags, creating revenue for both parties
- API integration: some publications may offer or be open to an API for programmatic access to scores

Until such partnerships exist, the link-first approach keeps us clean.

---

## 8. API Contract: Local ↔ Community (Milestone 2)

The local backend communicates with the community API over HTTPS REST. All requests carry an API key in the Authorization header. The API is versioned via URL prefix.

### 8.1 Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/v1/cigars/search?q=` | Search community catalog |
| GET | `/v1/cigars/{id}` | Get full cigar details |
| GET | `/v1/cigars/{id}/images` | Get images (max 2–3) |
| GET | `/v1/cigars/{id}/reviews` | Get curated review links |
| GET | `/v1/cigars/updated?since=` | Catalog updates since last sync |
| POST | `/v1/submissions` | Submit new cigar for review |
| POST | `/v1/submissions/{id}/images` | Attach images to submission |
| GET | `/v1/submissions/mine` | Check submission status |
| POST | `/v1/shared-notes` | Share a tasting note |
| GET | `/v1/cigars/{id}/community-notes` | Get aggregated community notes |
| GET | `/v1/ratings/{cigar_id}` | Community ratings (user-generated only) |
| POST | `/v1/images/contribute` | Contribute a photo candidate |
| POST | `/v1/reviews/contribute` | Contribute a review link |
| GET | `/v1/health` | Health check |
| GET | `/v1/version` | API version + min client version |

### 8.2 Sync Strategy

Local instance stores a `last_community_sync` timestamp. Calls `/v1/cigars/updated?since=` to pull changes. Conflict resolution is last-write-wins on community side. Local overrides are never overwritten. Image sync is lazy — canonical images only downloaded when viewed and no local image exists.

### 8.3 Rate Limiting

Per API key, enforced server-side. Free: 60 RPM. Paid: 300 RPM. Bulk sync exempt up to 1 req/hour. `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers returned.

---

## 9. Architecture Overview

### 9.1 Self-Hosted Deployment (M1)

Single Docker Compose stack. All services on user's hardware. Community data synced from GitHub YAML.

**Services:**

- `herfbook-api`: FastAPI application, port 8000
- `herfbook-db`: PostgreSQL 16, port 5432 (internal only)
- `herfbook-minio`: MinIO S3-compatible object store, port 9000/9001
- `herfbook-web`: Nginx serving React PWA build, port 80/443

**Volumes:** `postgres_data` (persistent DB), `minio_data` (persistent images)

**Environment:** Single `.env` file for all configuration. Sensible defaults for single-user operation. Community sync runs on startup, configurable cron optional.

### 9.2 Community API Deployment (M2)

- `community-api`: FastAPI with its own database
- `community-db`: PostgreSQL (managed RDS/Supabase recommended)
- `community-cdn`: S3 + CloudFront for cigar images (2–3 per entry max)
- `community-admin`: Separate React app for submission review
- Contributed images go to staging bucket, promoted to CDN on approval

### 9.3 Hosted Multi-Tenant (Future)

Same stack with: tenant isolation via `user_id`, managed Postgres, shared S3 with per-user prefixes, Auth0, billing integration. Application code unchanged — only config and infra differ.

---

## 10. Cigar Identification

### 10.1 UPC / Barcode Scanning

PWA uses device camera via `quagga2` or `zxing-js` for barcode scanning. Scanned UPCs matched against local cigars table first, then community data. Works well for retail boxes; many singles and B&M purchases won't have scannable codes.

### 10.2 AI-Powered Image Identification

For cigars without UPCs, a vision model (Anthropic API) identifies band photos. Workflow: user snaps cigar band → image sent to API → model returns brand/line/vitola guess → app searches local + community for matches → user confirms or corrects. Self-hosted instances need their own Anthropic API key. Hosted instances absorb the cost. Natural premium feature differentiator.

---

## 11. Key Technical Decisions

| Decision | Rationale |
|---|---|
| **FastAPI (Python)** | Async support, auto OpenAPI docs, SQLAlchemy 2.0 + Alembic, Python ML ecosystem. |
| **PostgreSQL** | JSONB for flexible fields, full-text search, UUID PKs, rock-solid self-hosted. |
| **MinIO** | S3-compatible — same code works self-hosted (MinIO) and hosted (AWS S3). |
| **React PWA** | Single codebase for desktop + mobile. Offline service workers. Camera access for scanning. |
| **Docker Compose** | One-command deploy. Same compose file for dev, self-hosted prod, and hosted infra. |
| **Rating Scale 0–100** | Matches Cigar Aficionado convention. More granular than 5-star. Better for aggregation. |
| **YAML-First Community Data** | Low-friction for M1. GitHub PRs for contributions. Bundled fallback in Docker image. Swappable module for M2. |
| **`line` as Free Text** | Line names are too numerous and brand-specific to standardize. Typeahead from existing entries. Community catalog (M2) becomes the de facto standardization. |
| **Ring Gauge in Vitola** | Ring gauge is a property of a vitola, not standalone. Two columns (`length_inches` + `ring_gauge`) stored separately for independent filtering. |
| **AGPL-3.0 for Code** | Strong copyleft with network-use protection. Prevents closed-source competing hosted services while keeping self-hosted fully free. |
| **CC BY-SA 4.0 for Data** | Matches Wikipedia seed license. Keeps community data open and reusable. |
| **Link-First for Reviews** | Community DB stores URLs to reviews, never scores or text. Zero legal risk, drives traffic to publications. |

---

## 12. Open Questions

1. **Cigar data seeding:** How aggressively do we pre-populate `brands.yml` and `vitolas.yml` for M1? Start with top 50–100 brands, or go for the full Wikipedia list (200–300)?
2. **Vitola granularity:** The same name (Robusto) can mean different sizes across brands. Standardize to the most common dimensions, or document that custom overrides handle brand-specific sizes?
3. **Smart hygrometer integration:** Build SensorPush/Govee API integration in M1, or defer?
4. **Mobile native vs. PWA-only:** PWA covers 90% of use cases but camera/barcode performance may push React Native for M2+.
5. **Subscription pricing sweet spot:** $9.99/year? $19.99/year? Need to model infra cost per user.
6. **Import from existing tools:** CSV import is easy, but should we build importers for CigarScanner, Cigar Boss?
7. **Tasting note small lookup fields** (`draw_quality`, `burn_quality`, `ash_color`, `ash_hold`, `finish`): Promote to community YAML, or keep as hardcoded enums? They rarely change but consistency matters.
8. **Vendor as lookup:** Defer to M2, or build as YAML in M1? List could get very large.
9. **Guest link rate limiting:** Cap concurrent guests for hosted model?
10. **Swap notifications:** Email/push when swap partner updates status? Adds infrastructure complexity.
11. **Wikipedia seeding automation:** One-time scraper for CC-licensed brand list → YAML, or hand-curate?
12. **RapidAPI Cigars API:** Evaluate data quality and licensing. Could supplement seed data.
13. **Elite Cigar Library:** Monitor their API development. Potential M2 data partner.
14. **Halfwheel outreach:** Reach out early about data partnership, or wait until M2 has traction?
15. **Review link verification:** Automated broken-link checking for `community_review_links`, or admin-only?

---

## 13. Repository Structure

Monorepo at `github.com/herfbook/herfbook`. Single repo for M1 keeps things simple for a solo developer. Can split into separate repos for the community API in M2 if warranted.

```
herfbook/
├── LICENSE                          # AGPL-3.0 (application code)
├── DESIGN.md                        # This document
├── README.md                        # Project overview, quickstart
├── docker-compose.yml               # One-command deploy
├── docker-compose.dev.yml           # Dev overrides (hot reload, debug)
├── .env.example                     # Template for configuration
├── Dockerfile                       # Multi-stage build (API)
├── Dockerfile.web                   # Nginx + React build
│
├── community/                       # Community-maintained reference data
│   ├── LICENSE                      # CC BY-SA 4.0 (data only)
│   ├── brands.yml
│   ├── manufacturers.yml
│   ├── vitolas.yml
│   ├── wrappers.yml
│   ├── binders.yml
│   ├── fillers.yml
│   ├── countries.yml
│   ├── strength_levels.yml
│   ├── flavor_tags.yml
│   ├── purchase_types.yml
│   └── environments.yml
│
├── backend/                         # FastAPI application
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── config.py                # Settings / env vars
│   │   ├── database.py              # SQLAlchemy engine + session
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── humidor.py
│   │   │   ├── cigar.py
│   │   │   ├── inventory.py
│   │   │   ├── session.py           # smoking_sessions + tasting_notes
│   │   │   ├── guest.py             # guest_links, swaps
│   │   │   └── lookups.py           # All community-maintained lookup tables
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── routers/                 # API route handlers
│   │   │   ├── humidors.py
│   │   │   ├── cigars.py
│   │   │   ├── inventory.py
│   │   │   ├── sessions.py
│   │   │   ├── guests.py
│   │   │   ├── swaps.py
│   │   │   ├── community.py         # /community/* endpoints
│   │   │   ├── ratings.py
│   │   │   └── auth.py
│   │   ├── services/                # Business logic
│   │   │   ├── community_sync.py    # GitHub YAML sync engine
│   │   │   └── providers/
│   │   │       ├── base.py          # CommunityDataProvider protocol
│   │   │       └── github_yaml.py   # GitHubYAMLProvider (M1)
│   │   └── utils/
│   │       ├── slugify.py           # Community key generation
│   │       └── images.py            # MinIO/S3 helpers
│   ├── alembic/                     # Database migrations
│   │   ├── alembic.ini
│   │   └── versions/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/                        # React PWA
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   └── service-worker.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/                     # API client
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── nginx/                           # Web server config
│   └── default.conf
│
└── scripts/
    ├── seed.py                      # Initial YAML → DB seed
    ├── backup.sh                    # pg_dump + minio export
    └── restore.sh                   # Restore from backup
```

---

## 14. Next Steps

1. ~~Register domains and create GitHub organization~~ ✅
2. Initialize repository with `README.md`, `DESIGN.md`, `LICENSE`, and `community/LICENSE`
3. Populate initial community YAML files — brands, vitolas, wrappers, flavor tags (seed from Wikipedia CC data)
4. Scaffold Docker Compose with Postgres, MinIO, and a hello-world FastAPI
5. Build SQLAlchemy models and generate Alembic migrations from finalized schema
6. Build `CommunityDataProvider` interface and `GitHubYAMLProvider` implementation
7. Build community sync background task and admin review endpoints
8. Build FastAPI CRUD endpoints for core entities (humidors, cigars, inventory)
9. Design React component hierarchy and navigation structure
10. Build humidor management UI (first screen)
11. Build cigar add/edit flow with lookup dropdowns and barcode scanning
12. Build smoking session logger with tasting notes form
13. Build guest access link generation and read-only views
14. Build analytics/dashboard views
15. PWA setup: service worker, offline cache, manifest
16. Write deployment docs and one-command setup script

---

*This document is maintained at [github.com/herfbook/herfbook](https://github.com/herfbook/herfbook) and will be updated as design decisions are finalized.*
