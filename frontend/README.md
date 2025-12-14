# TEFAS dashboard frontend

A Vite + React single-page app ready for Vercel static deployment. It now pulls live TEFAS data through the included serverless endpoints so you can deploy without wiring an external backend first.

## Scripts
- `npm run dev` – local development server
- `npm run build` – production build (used by Vercel)
- `npm run preview` – preview the production build locally

## Data flow
1. Serverless functions under `/api` proxy TEFAS (fund list and history) to avoid browser CORS issues.
2. The React app calls those endpoints via `src/api.ts`; the fund selector is pre-wired to load the full catalog on mount.
3. Deploy via Vercel; the provided `vercel.json` points the build to `frontend/` and publishes `frontend/dist`. No additional configuration is required for the API routes.
