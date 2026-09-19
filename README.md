# Greenlight

Get your project permit-ready.

Greenlight is an AI permitting agent that turns a construction project into an executable path to approval. It researches jurisdiction rules, compiles requirements, identifies blockers, and tracks permitting progress in real time.

Built for the [Convex All Gas Hackathon](https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit).

## Stack

- [Convex](https://convex.dev) — realtime backend, database, and functions
- React + Vite — frontend
- Convex static hosting — production frontend (`*.convex.site`)

## Development

```bash
npm install
npx convex dev
npm run dev
```

### Required deployment environment variables

Set these with `npx convex env set` after `npx convex dev`:

- `JWT_PRIVATE_KEY`, `JWKS`, and `SITE_URL` for Convex Auth
- `FIRECRAWL_API_KEY` for official source scraping
- `AGENTMAIL_API_KEY` for project inboxes and outbound mail
- `AGENTMAIL_WEBHOOK_SECRET` for inbound webhook verification

See `.env.example` for the full list.

## Project docs

- `PlanGreenlight.md` — product specification
- `hackathon.md` — public build log
