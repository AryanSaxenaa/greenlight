# Hackathon log

- **Project:** Greenlight
- **Event:** [Convex All Gas Hackathon](https://www.convex.dev/hackathons/all-gas)
- **What it does:** An AI permitting agent that turns a construction project into an executable path to approval.
- **Live app:** https://handsome-bison-608.convex.site
- **Repo:** https://github.com/AryanSaxenaa/greenlight
- **Frontend:** Convex static hosting (`@convex-dev/static-hosting`)
- **Convex deployment:** dev:handsome-bison-608 (https://handsome-bison-608.convex.cloud)
- **AgentMail webhook:** https://handsome-bison-608.convex.site/webhooks/agentmail
- **Components:** @convex-dev/auth
- **Convex features:** schema, indexes, queries, mutations, internal mutations, actions, scheduled functions, HTTP actions, file storage, realtime queries
- **Auth:** Convex Auth
- **AI models:** openai/gpt-4o-mini (Convex AI Gateway)
- **Started:** 2026-09-19T10:33:06Z
- **Last updated:** 2026-09-20T13:30:00Z

## Log

### 2026-09-19
Project currently contains a product specification for Greenlight (`PlanGreenlight.md`). There is no Convex application, schema, or frontend yet. Hackathon environment setup added a project-local build-log skill and recorded Convex static hosting as the intended frontend host.

### 2026-09-19 - 08554fd
Scaffolded the Greenlight hackathon app on React + Vite with Convex backend tables for projects, compiler stages, requirements, and project events. Added project creation, LA jurisdiction resolution, a staged compiler run via scheduled internal mutation, and a realtime project control room UI (`convex/schema.ts`, `convex/projects.ts`, `src/pages/*`). Initialized the public GitHub repository.

### 2026-09-19 - 7a8de82
Added Convex Auth password sign-in, user-scoped projects, official LA source registry with Firecrawl scraping, Convex file storage for evidence uploads, AgentMail inbox provisioning, inbound webhook handling, outbound clarification approvals, and expanded project UI for sources, documents, inbox, and approvals (`convex/auth.ts`, `convex/integrations/*`, `convex/documents.ts`, `convex/communications.ts`, `convex/approvals.ts`, `convex/http.ts`).

### 2026-09-19 - fd7a013
Added requirement extraction from scraped official sources, Firecrawl monitor webhook handling with re-evaluation, document fact extraction with evidence-to-requirement mapping, Svix webhook verification for AgentMail, and inbound email-to-requirement linking (`convex/requirements.ts`, `convex/integrations/firecrawlWebhook.ts`, `convex/integrations/documentActions.ts`, `convex/lib/*`).

### 2026-09-19 - f3cd9c8
Addressed PlanGreenlight audit gaps: evidence discipline on requirements, real compiler stage sequencing, full snapshot storage, dependency graph, change impact compiler, inbound email decision extraction, fact-based clarification drafts, readiness recomputation, agent run logging, and expanded control room UI.

### 2026-09-20 - deployment
Deployed Greenlight to Convex Sites at https://handsome-bison-608.convex.site using `@convex-dev/static-hosting`. Fixed Convex Auth JWT key format for cloud sign-in, query return validators for parameters/agent runs, and verified core §55 flow: auth → create ADU project → compiler → change impact propose/apply. Pending: `FIRECRAWL_API_KEY` + `AGENTMAIL_API_KEY` on cloud for full scrape/monitor/email demo, demo video, vibeapps.dev submission.

### 2026-09-20 - integrations live
Set Firecrawl + AgentMail API keys on cloud. Verified full §55 email loop on live deployment: AgentMail inbox provisioned (`greenlight-y98eshf5@agentmail.to`), clarification approved and sent to test recipient, inbound agency webhook processed (classification + extractions). Polished README and fixed communication extraction query validators.

### 2026-09-20 - openai gateway
Integrated Convex AI Gateway with `openai/gpt-4o-mini` for requirement extraction, inbound email parsing, clarification draft generation, and document fact extraction (`convex/integrations/openaiActions.ts`, `convex/lib/aiGateway.ts`). Compiler now schedules OpenAI extraction after Firecrawl scrape; regex/template fallbacks remain when gateway calls fail. Verified gateway connectivity with `integrations/openaiActions:testAiGateway`.

### 2026-09-20 - aggressive ai testing
Added `convex/testing/aggressiveSuite.ts` and ran full AI integration tests against live deployment (requirement extraction, email parse, clarification draft, document facts). Updated README and product copy across landing page, control room, and docs to highlight OpenAI via Convex AI Gateway.
