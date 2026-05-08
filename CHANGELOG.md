# Changelog

All notable changes to HerfBook will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Axios HTTP client with JWT bearer interceptor and transparent refresh-and-retry on 401
- Concurrent-request-safe token refresh using promise singleton (queues 401-triggering requests during refresh)
- Auth API module wrapping POST /auth/login (form-encoded), POST /auth/refresh, POST /auth/logout, GET /users/me
- Setup API module wrapping GET /status and POST /setup
- Zustand auth store with localStorage persistence and boot-time hydration via /users/me
- AuthBoot component gating router on authentication hydration
- SetupGate component routing unconfigured instances to /setup and configured instances away from it
- ProtectedRoute layout component redirecting unauthenticated users to /login with return-path state
- First-run setup page (/setup) creating admin user + default humidor and auto-logging in
- Login page (/login) with inline error feedback and return-path navigation
- Home placeholder page (/) with health pills and logout action
- 404 page for unknown routes
- TypeScript types mirroring backend Pydantic schemas (User, TokenPair, SetupStatus, SetupResponse)
- Frontend application scaffold: React 18 + TypeScript + Vite
- Tailwind CSS v3 with HerfBook design tokens (warm tobacco-inspired palette)
- shadcn/ui component library with curated starter set (Button, Card, Input, Label, Textarea, Select, Checkbox, Switch, Dialog, Sheet, Dropdown Menu, Popover, Tooltip, Sonner toast, Badge, Separator, Skeleton, Table, Tabs, Avatar)
- Dark/light theme system with persistence via next-themes (dark default)
- Inter, Fraunces, and JetBrains Mono variable fonts (self-hosted via @fontsource-variable)
- Layout primitives: Container, PageHeader, PageSection
- React Router v7 in plain mode
- TanStack Query v5 client with sensible defaults
- Vite dev server proxy from /api to backend at localhost:8005
- Design system showcase page at /_/dev for visual reference
- frontend/README.md with quickstart and build instructions

## [0.0.1] — 2026-05-04

### Added

- Guest access link generation with configurable permissions (collection, journal, humidors, want list, swap list)
- Public read-only guest views at /g/{token}/* with token-based authentication
- Permission enforcement stripping financial data from guest views (prices, vendors, gift details)
- Guest link management (create, update permissions, deactivate, set expiry)
- Swap list management for marking inventory items as available for trade
- Swap lifecycle tracking with status transitions (proposed → accepted → shipped → received → completed)
- Swap completion logic: outgoing inventory decrement and incoming inventory creation with provenance notes
- Status transition validation preventing illegal swap state changes
- Want list CRUD endpoints with priority filtering and duplicate prevention
- Want list fulfillment flow linking purchases to wish list items
- External ratings endpoints nested under /cigars/{cigar_id}/ratings
- Personal reference data model for industry review scores and links (DESIGN.md §7.2)
- Smoking session CRUD endpoints with from-inventory and quick-log modes
- Structured tasting notes (draw quality, burn quality, ash, strength by thirds, finish)
- Flavor tag management per session with third designation (first/second/third/all)
- Pairing tracking (drink/food) with notes and 1–5 rating
- Session filtering by date range, cigar, rating, and repurchase signal
- Service layer for session business logic (inventory decrement, want list auto-creation)
- Pydantic schemas with Literal-type validation for tasting note enum fields
- Inventory management endpoints: add, list, detail, update with purchase and gift tracking
- Inventory transfer between humidors with provenance tracking and partial quantity splits
- Smoke endpoint: decrement inventory quantity and create smoking session stub for tasting notes flow
- Inventory statistics: total sticks, total value, average price per stick, breakdown by humidor
- Inventory list with pagination and filtering by humidor, cigar, gift status, and minimum quantity
- Cigar display name resolution on inventory list (brand + line + vitola)
- Aging calculation (days since added to humidor) on inventory list and detail
- Cigar management endpoints: create, list, detail, update, delete with lookup FK validation
- Cigar search and filtering by brand, wrapper, strength, country, and free text
- Filler many-to-many management: accept array of filler IDs on create/update
- Cigar image upload to MinIO with validation (max 3 per cigar, 5 MB limit, JPEG/PNG/WebP)
- Image management: set primary, delete with auto-promotion, presigned URL generation
- MinIO service module (S3-compatible) for image upload, delete, and presigned URL generation
- Custom vitola override support (name, length, ring gauge) on cigar create/update
- CigarDetail response resolves all lookup FKs to human-readable names
- Humidor management endpoints: create, list, detail, update, archive (soft delete)
- Humidor readings: manual temperature/humidity logging with pagination and date range filtering
- Humidor list enrichment: cigar count, capacity utilization percentage, latest reading
- Humidor detail with inventory contents including resolved cigar names and aging calculation
- Pydantic schemas for humidor request/response models
- Project repository with README, DESIGN.md (v0.4), and dual licensing (AGPL-3.0 + CC BY-SA 4.0)
- Community YAML seed files: brands, manufacturers, vitolas, wrappers, binders, fillers, countries, strength levels, flavor tags, purchase types, environments
- Docker Compose scaffold with FastAPI, PostgreSQL 16, MinIO, and Nginx
- FastAPI application with /health endpoint
- Configuration system supporting environment variables and YAML config file (env vars take precedence)
- GitHub Actions CI/CD: linting, testing, community YAML validation, Docker image builds with GHCR
- Docker image tagging strategy: :dev, :latest, :sha-xxx, semver tags on release
- Security scanning: CodeQL, dependency audit, Trivy
- Branch protection: PRs required for main, automated status checks
- PR template and CODEOWNERS
- Community YAML validation script with schema checking, duplicate detection, and sort enforcement
- Production Docker Compose example for GHCR-based deployments
- Landing page at herfbook.com (Cloudflare Pages)
- PRD.md tracking M1 epics and feature status
- SQLAlchemy ORM models for all M1 tables (11 community lookup tables, 17 core entity and guest access tables)
- Base model mixins: UUIDPrimaryKey (PostgreSQL gen_random_uuid()), TimestampMixin, CommunityLookupMixin (AmmoLedger three-source pattern)
- Composite database indexes on high-volume tables for multi-tenant query performance
- Alembic migration framework configured with autogenerate from model metadata
- Container entrypoint script (entrypoint.sh) runs database migrations automatically before starting the application
- pg_isready wait loop in entrypoint for reliable database availability
- Initial Alembic migration covering full M1 schema (29 tables)
- Async database session factory with asyncpg connection pooling
- JWT authentication utilities (access tokens, refresh tokens with rotation)
- Password hashing with bcrypt via passlib
- FastAPI authentication dependencies (get_current_user, get_current_user_optional)
- Refresh token storage model for secure token rotation and invalidation
- is_admin flag on users table (first registered user becomes admin)
- Auth configuration settings: JWT algorithm, access token expiry, refresh token expiry
- User registration endpoint with first-user-is-admin pattern (POST /auth/register)
- JWT login with OAuth2 form-based authentication (POST /auth/login)
- Refresh token rotation endpoint (POST /auth/refresh)
- Logout with token revocation (POST /auth/logout)
- User profile endpoints (GET /users/me, PATCH /users/me, PATCH /users/me/password)
- Registration closed by default for single-user self-hosted deployments (configurable via ALLOW_REGISTRATION)
- Pydantic v2 request/response schemas for auth and user operations
- JSONB shallow merge on user preferences and sharing_defaults updates
- First-run setup endpoint that creates admin user and default humidor atomically (POST /setup)
- Setup status detection endpoint for frontend routing (GET /status)
- Auto-login after initial setup (returns JWT tokens immediately)
- Default user preferences: system theme, Fahrenheit, MM/DD/YYYY date format
- Default sharing settings: all sharing disabled (privacy-first default)
- setup_required flag added to /health response

### Changed

- Standardized all YAML file extensions to .yml
