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

Output lands in `frontend/dist/`. The existing `Dockerfile.web` copies this
directory into the Nginx image — no changes to the Docker contract needed.

```bash
npm run typecheck   # TypeScript check (no emit)
npm run lint        # ESLint
npm run preview     # Preview the production build locally at http://localhost:5175
```
