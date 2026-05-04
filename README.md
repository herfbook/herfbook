# HerfBook

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Status: In Development](https://img.shields.io/badge/Status-In%20Development-yellow.svg)](https://github.com/herfbook/herfbook)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://postgresql.org)
[![React](https://img.shields.io/badge/React-PWA-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

**Your cigar collection, your tasting journal, your data.**

HerfBook is an open-source, self-hosted cigar collection manager and tasting journal. A *herf* is cigar slang for a gathering of people to smoke cigars — coined on the alt.smokers.cigar newsgroup circa 1996. HerfBook is your book of herfs: a record of every cigar you collect, smoke, rate, and share.

Website: [herfbook.com](https://herfbook.com)

---

## Features

- **Multi-humidor inventory** — track boxes, packs, singles, gifts, and transfers between humidors
- **Tasting journal** — structured smoking sessions with draw, burn, ash, flavor tags, ratings (0–100), and pairings
- **Quick-log mode** — log a session for a cigar not in your inventory
- **Community reference data** — brands, vitolas, wrappers, flavor tags, and more maintained as open YAML files
- **Cost analytics** — spend per month, average price per stick, aging tracker
- **Want list** — flag cigars from sessions or add manually, with priority and target price
- **Guest/friend access** — shareable read-only links with configurable permissions (collection, journal, want list, swap list)
- **Cigar swap tracking** — peer-to-peer trade tracking with provenance
- **External ratings** — store links and personal notes from industry reviews (Cigar Aficionado, Halfwheel, etc.)
- **Full data export/import** — JSON and CSV; you own your data
- **PWA** — works on desktop and mobile, with offline session logging
- **Single-command deploy** — Docker Compose, everything self-hosted

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python), PostgreSQL 16, SQLAlchemy 2.0, Alembic |
| Frontend | React PWA, Vite |
| Image Storage | MinIO (S3-compatible) |
| Community Data | YAML files (GitHub-synced), upgradeable to central API |
| Deployment | Docker Compose |
| Auth | Local JWT (single-user default, multi-user capable) |

## Quick Start

```bash
cp .env.example .env        # copy config template
# edit .env — at minimum set strong passwords and JWT_SECRET
docker compose up           # starts api, db, minio, and web
```

`http://localhost/api/health` → `{"status":"ok","version":"0.1.0"}`

> The application is under active development. Database models and the full UI are not yet built.

See [DESIGN.md](DESIGN.md) for the full architecture and milestone roadmap.

## Configuration

HerfBook supports two equivalent configuration methods. **Environment variables always win** — useful for Docker, CI, and secrets managers. A YAML config file is available for users who prefer a single structured file over a `.env`.

### Option 1 — `.env` file (recommended for Docker)

```bash
cp .env.example .env
# edit .env, then:
docker compose up
```

### Option 2 — YAML config file

```bash
cp config.example.yml config.yml
# edit config.yml, then set the path:
export HERFBOOK_CONFIG_FILE=config.yml
docker compose up
```

### Precedence

```text
env vars  >  .env file  >  config.yml  >  built-in defaults
```

### Available settings

| Setting | Default | Description |
| --- | --- | --- |
| `POSTGRES_USER` | `herfbook` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `changeme` | PostgreSQL password — **change this** |
| `POSTGRES_DB` | `herfbook` | PostgreSQL database name |
| `MINIO_ROOT_USER` | `herfbook` | MinIO root username |
| `MINIO_ROOT_PASSWORD` | `changeme` | MinIO root password — **change this** |
| `JWT_SECRET` | `changeme-…` | Secret for signing JWTs — **change this** |
| `COMMUNITY_SYNC_ON_STARTUP` | `true` | Sync community YAML data from GitHub on startup |
| `GITHUB_COMMUNITY_REPO` | `herfbook/herfbook` | GitHub repo to pull community YAML from |
| `HERFBOOK_CONFIG_FILE` | *(unset)* | Optional path to a YAML config file |

### Development mode (hot reload + exposed Postgres)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This mounts `./backend` into the API container so code changes trigger an automatic reload, and exposes Postgres on `localhost:5432` for local DB tools.

## Contributing

HerfBook is in early development. If you'd like to contribute, start by reading [DESIGN.md](DESIGN.md) for the architecture, data model, and roadmap. Community reference data (brands, vitolas, flavor tags, etc.) lives in the [`community/`](community/) directory as YAML files and is separately licensed under CC BY-SA 4.0.

Issues and PRs welcome at [github.com/herfbook/herfbook](https://github.com/herfbook/herfbook).

## License

- **Application code** — [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE)
- **Community reference data** (`community/`) — [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](community/LICENSE)

The AGPL-3.0 ensures self-hosted users have full freedom while requiring anyone who runs a modified version as a network service to share their changes. The CC BY-SA 4.0 data license matches Wikipedia's, which seeds much of the community catalog.
