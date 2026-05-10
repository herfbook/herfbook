# HerfBook — Product Requirements Document

**Product:** HerfBook
**Version target:** 0.1.0 (M1 — Self-Hosted Core)
**Last updated:** 2026-05-06

---

## Overview

HerfBook M1 delivers a fully functional self-hosted cigar collection manager and tasting journal. Users can manage humidors and inventory, log smoking sessions with structured tasting notes, track purchases and spending, and share read-only views with friends via guest links. Community-maintained reference data (brands, vitolas, wrappers, etc.) ships as YAML files and syncs from GitHub. All personal data stays on the user's own infrastructure.

Reference DESIGN.md for architecture decisions, data model, schema, and technical rationale.

---

## Milestone 1 Epics & Features

### Epic 1: Infrastructure & DevOps

- [x] Repository setup (README, LICENSE, DESIGN.md)
- [x] Community YAML seed files
- [x] Docker Compose scaffold (API, DB, MinIO, Nginx)
- [x] FastAPI hello-world with /health endpoint
- [x] Configuration system (env vars + config file)
- [x] GitHub Actions CI/CD workflows
- [x] Branch protection and PR workflow
- [x] Alembic migration setup
- [ ] Production Docker Compose with GHCR images

### Epic 2: Data Layer

- [x] SQLAlchemy ORM models — lookup tables (all 11 community tables)
- [x] SQLAlchemy ORM models — core entities (users, humidors, cigars, inventory, smoking_sessions, tasting_notes, etc.)
- [x] SQLAlchemy ORM models — guest access & swaps
- [x] Initial Alembic migration (full schema)
- [x] Database seeding from community YAML files
- [x] CommunityDataProvider interface
- [x] LocalYAMLProvider implementation (M1; M2 will add a remote/GitHub variant)
- [x] Community sync on startup (lifespan hook; non-fatal)

### Epic 3: Authentication & Users

- [x] User registration (single-user default)
- [x] JWT login/logout
- [x] Password hashing (bcrypt)
- [x] User preferences (JSONB)
- [x] Sharing defaults configuration

### Epic 4: Humidor Management

- [x] CRUD endpoints: create, read, update, archive humidors
- [x] Humidor readings: manual temperature/humidity logging
- [x] Humidor capacity tracking
- [x] Create humidor (name, description, capacity, location, target humidity, target temp)
- [x] List humidors with cigar count, capacity fill %, latest reading
- [x] View humidor detail (header, stats, contents)
- [x] Edit humidor settings
- [x] Archive (soft-delete) humidor
- [x] Show/hide archived humidors on list page
- [x] Log humidor reading (humidity, temperature, manual source)
- [x] Display latest reading on cards and detail page
- [ ] Reading history list and chart (deferred — needs real data)
- [ ] Restore archived humidor UI (deferred)
- [ ] Sensor API integration (M3+)

### Epic 5: Cigar Management

- [x] CRUD endpoints for cigars with lookup FK resolution
- [x] Cigar creation with brand/vitola/wrapper dropdown selection
- [x] Custom vitola override (name, length, ring gauge)
- [x] Filler many-to-many management
- [x] Cigar image upload (up to 3, stored in MinIO)
- [x] UPC/barcode field
- [x] Cigar detail view with all metadata

### Epic 6: Inventory Management

- [x] Add to inventory (box, 5-pack, single, sampler, bundle, gift)
- [x] Purchase tracking (price, vendor, date, purchase type)
- [x] Assign to humidor
- [x] Transfer between humidors with provenance
- [x] Gift tracking (received/given, from/to whom, occasion)
- [x] Inventory list with filtering and sorting
- [x] Box code and aging date tracking

### Epic 7: Smoking Journal

- [x] Create smoking session (from inventory or quick-log)
- [x] Structured tasting notes (draw, burn, ash, strength by thirds)
- [x] Flavor tag selection (from community lookup)
- [x] Free-text flavor notes per third
- [x] Retrohale and finish notes
- [x] Personal rating (0–100)
- [x] Would buy again flag
- [x] Add to want list flag
- [x] Pairing tracking (drink/food with notes and rating)
- [x] Session environment selection (from lookup)
- [x] Session list view with filtering

### Epic 8: Want List

- [x] Add from smoking session (via flag)
- [x] Manual add (free-text or cigar FK)
- [x] Priority levels (high/medium/low)
- [x] Target price
- [x] Mark as fulfilled (link to inventory)

### Epic 9: External Ratings

- [x] Add external rating per cigar (source, score, URL, date)
- [x] Source name dropdown with free-text option
- [x] Rating comparison view (personal vs external)

### Epic 10: Guest Access & Swaps

- [x] Generate shareable guest links with permissions
- [x] Guest read-only views (collection, journal, humidors, want list)
- [x] Permission enforcement (hide prices, vendors, gifts from guests)
- [x] Link management (activate, deactivate, set expiry)
- [x] Swap list management (mark inventory as available for trade)
- [x] Swap tracking (proposed → accepted → shipped → received → completed)
- [x] Swap provenance on incoming inventory

### Epic 11: Community Data Admin

- [ ] Admin review UI for pending community entries
- [ ] Import/hide/unhide controls per entry
- [ ] Manual sync trigger from admin
- [ ] Pending count badge in navigation
- [ ] Generate PR content (YAML export for contribution)

### Epic 12: Analytics Dashboard

- [ ] Spend per month chart
- [ ] Average price per stick
- [ ] Top-rated cigars
- [ ] Vitola preference breakdown
- [ ] Cigars smoked per month
- [ ] Aging inventory summary
- [ ] Cost trends over time

### Epic 13: Frontend Shell

- [x] React app scaffold with Vite
- [x] Navigation/layout component
- [x] Responsive design (desktop + mobile)
- [x] API client module
- [x] Auth context and protected routes

### Epic 14: PWA & Offline

- [ ] Service worker setup
- [ ] PWA manifest
- [ ] Offline session logging (queue and sync)
- [ ] Camera access for photos and barcode scanning

### Epic 15: Data Portability

- [ ] Full JSON export
- [ ] CSV export
- [ ] JSON import
- [ ] CSV import

---

## Future Milestones (Not Tracked Here)

- **M2 — Central Community API + Cigar Database:** See DESIGN.md §3.2
- **M3 — Community & Social Features:** See DESIGN.md §3.3
- **Hosted Subscription Model:** See DESIGN.md §3.4

---

## Notes

- Each epic maps roughly to a set of Claude Code prompts
- Items are ordered by dependency (infra first, then data layer, then features that build on them)
- Status is updated as work progresses
- Features may be split into smaller tasks as implementation begins
