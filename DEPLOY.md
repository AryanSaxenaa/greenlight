# Deploy Greenlight

## Live URLs (current)

| What | URL |
|---|---|
| **App** | https://handsome-bison-608.convex.site |
| **Convex API** | https://handsome-bison-608.convex.cloud |
| **Dashboard** | https://dashboard.convex.dev/d/handsome-bison-608 |
| **AgentMail webhook** | https://handsome-bison-608.convex.site/webhooks/agentmail |
| **Firecrawl webhook** | https://handsome-bison-608.convex.site/webhooks/firecrawl |

## Redeploy

```bash
npx convex dev --once --typecheck=disable   # push backend changes
npx @convex-dev/static-hosting upload --build  # rebuild + upload frontend
```

Or for production: `npm run deploy` (requires confirming prod push in terminal).

## Set integration keys on cloud

```bash
npx convex env set AGENTMAIL_API_KEY am_your_key
npx convex env set AGENTMAIL_WEBHOOK_SECRET whsec_your_secret
npx convex env set FIRECRAWL_API_KEY fc_your_key
```

Auth vars (`SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`) are already set on the dev deployment.

## AgentMail webhook setup

1. AgentMail → **Webhooks** → **+ Add Endpoint**
2. URL: `https://handsome-bison-608.convex.site/webhooks/agentmail`
3. Event: `message.received`
4. Copy `whsec_...` → `npx convex env set AGENTMAIL_WEBHOOK_SECRET whsec_...`

## Local development

```bash
npx convex dev
npm run dev
```

Use `http://localhost:5173` for the UI. Webhooks only work against the cloud `.convex.site` URL (or ngrok to local port 3211).
