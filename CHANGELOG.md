# Changelog

All notable changes to HerfBook will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

### Changed
- Standardized all YAML file extensions to .yml

## [0.1.0] — Unreleased

Target: M1 Self-Hosted Core (see PRD.md for feature tracking)
