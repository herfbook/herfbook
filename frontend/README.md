# HerfBook — Frontend

React 18 + TypeScript frontend for HerfBook, a self-hosted cigar collection manager and tasting journal.

## Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v3 |
| Components | shadcn/ui (Radix primitives) |
| Server state | TanStack Query v5 |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |
| HTTP client | Axios |
| Theme | Dark default, light toggle via next-themes |
| Icons | lucide-react |

## Quickstart

```bash
cd frontend
npm install
npm run dev
```

Dev server runs at `http://localhost:5174`.

## Dev proxy

`/api/*` requests are proxied to the backend at `http://localhost:8005`. Start
the backend first (see root `docker-compose.dev.yml` or run the FastAPI app
directly) before making API calls.

## Design system page

Navigate to `http://localhost:5174/_/dev` to see the design system showcase:
typography, color swatches, all component variants, form controls, cards,
overlays, and a data table example.

## Build

```bash
npm run build
```

Output lands in `frontend/dist/`.

```bash
npm run typecheck   # TypeScript check (no emit)
npm run lint        # ESLint
npm run preview     # Preview the production build locally at http://localhost:5175
```

## Docker dev workflow

The dev compose (`docker-compose.dev.yml`) serves the frontend via
Nginx on port 8080 by mounting `frontend/dist` as a read-only volume
into the `herfbook-web` container. This means:

- Run `npm run build` on the host whenever you want :8080 to update.
- For fast iteration, prefer `npm run dev` on `:5174` instead — it
  has HMR and doesn't require Docker.
- The `:8080` serve is useful for verifying the production-style
  build occasionally.

For production, `Dockerfile.web` is a multi-stage build that runs
`npm ci && npm run build` inside the image. CI publishes this to
`ghcr.io/herfbook/herfbook-web:latest`; `docker-compose.prod.yml`
pulls and runs it. No host-side build step is needed in production.
