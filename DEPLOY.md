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
npx convex env set FIRECRAWL_WEBHOOK_SECRET choose-a-long-random-string
```

Auth vars (`SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`) are already set on the dev deployment.

## OpenAI via Convex AI Gateway

Greenlight calls **`openai/gpt-4o-mini`** through [Convex AI Gateway](https://docs.convex.dev/ai) for requirement extraction, inbound email parsing, clarification drafts, and document fact extraction. Enable gateway billing on your Convex deployment — no `OPENAI_API_KEY` env var in app code.

Smoke-test connectivity:

```bash
npx convex run integrations/openaiActions:testAiGateway
```

Run the full AI integration suite:

```bash
npx convex run testing/aggressiveSuite:runAggressiveSuite '{"gatewayIterations":3,"runFullPipeline":true}'
```

## AgentMail webhook setup

1. AgentMail → **Webhooks** → **+ Add Endpoint**
2. URL: `https://handsome-bison-608.convex.site/webhooks/agentmail`
3. Event: `message.received`
4. Copy `whsec_...` → `npx convex env set AGENTMAIL_WEBHOOK_SECRET whsec_...`

## Firecrawl webhook setup

1. Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Set it: `npx convex env set FIRECRAWL_WEBHOOK_SECRET your-secret`
3. New projects auto-register monitors with  
   `https://handsome-bison-608.convex.site/webhooks/firecrawl?secret=your-secret`
4. Existing monitors created before the secret was set must be recreated (create a new project, or delete and re-run compilation).

## Local development

```bash
npx convex dev
npm run dev
```

Use `http://localhost:5173` for the UI. Webhooks only work against the cloud `.convex.site` URL (or ngrok to local port 3211).
