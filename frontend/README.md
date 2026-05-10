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

The dev compose (`docker-compose.dev.yml`) builds the frontend inside
the `herfbook-web` container via the multi-stage `Dockerfile.web`
(Node builds → Nginx serves) and exposes it on port 8080. No host
toolchain is required.

- **First build / after frontend changes:**
  `docker compose -f docker-compose.dev.yml up --build`
- **Just frontend changed:**
  `docker compose -f docker-compose.dev.yml up --build herfbook-web`
- **For fast iteration with HMR**, prefer `npm run dev` on `:5174` —
  the dev server proxies `/api` to `:8005` directly. The `:8080`
  serve is useful for verifying the production-style build.

For production, `docker-compose.prod.yml` pulls the same multi-stage
image from `ghcr.io/herfbook/herfbook-web:latest` (published by CI).
No host-side build step is needed.
