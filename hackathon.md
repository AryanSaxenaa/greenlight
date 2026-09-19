# Hackathon log

- **Project:** Greenlight
- **Event:** Convex All Gas Hackathon
- **What it does:** An AI permitting agent that turns a construction project into an executable path to approval.
- **Live app:** not deployed
- **Repo:** https://github.com/AryanSaxenaa/greenlight
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed
- **Components:** @convex-dev/auth
- **Convex features:** schema, indexes, queries, mutations, internal mutations, actions, scheduled functions, HTTP actions, file storage, realtime queries
- **Auth:** Convex Auth
- **AI models:** none
- **Started:** 2026-09-19T10:33:06Z
- **Last updated:** 2026-09-19T11:25:00Z

## Log

### 2026-09-19
Project currently contains a product specification for Greenlight (`PlanGreenlight.md`). There is no Convex application, schema, or frontend yet. Hackathon environment setup added a project-local build-log skill and recorded Convex static hosting as the intended frontend host.

### 2026-09-19 - 08554fd
Scaffolded the Greenlight hackathon app on React + Vite with Convex backend tables for projects, compiler stages, requirements, and project events. Added project creation, LA jurisdiction resolution, a staged compiler run via scheduled internal mutation, and a realtime project control room UI (`convex/schema.ts`, `convex/projects.ts`, `src/pages/*`). Initialized the public GitHub repository.

### 2026-09-19 - working tree
Added Convex Auth password sign-in, user-scoped projects, official LA source registry with Firecrawl scraping, Convex file storage for evidence uploads, AgentMail inbox provisioning, inbound webhook handling, outbound clarification approvals, and expanded project UI for sources, documents, inbox, and approvals (`convex/auth.ts`, `convex/integrations/*`, `convex/documents.ts`, `convex/communications.ts`, `convex/approvals.ts`, `convex/http.ts`).
