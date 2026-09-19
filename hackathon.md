# Hackathon log

- **Project:** Greenlight
- **Event:** Convex All Gas Hackathon
- **What it does:** An AI permitting agent that turns a construction project into an executable path to approval.
- **Live app:** not deployed
- **Repo:** https://github.com/AryanSaxenaa/greenlight
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed
- **Components:** none
- **Convex features:** schema, indexes, queries, mutations, internal mutations, scheduled functions, realtime queries
- **Auth:** none
- **AI models:** none
- **Started:** 2026-09-19T10:33:06Z
- **Last updated:** 2026-09-19T11:15:00Z

## Log

### 2026-09-19
Project currently contains a product specification for Greenlight (`PlanGreenlight.md`). There is no Convex application, schema, or frontend yet. Hackathon environment setup added a project-local build-log skill and recorded Convex static hosting as the intended frontend host.

### 2026-09-19 - working tree
Scaffolded the Greenlight hackathon app on React + Vite with Convex backend tables for projects, compiler stages, requirements, and project events. Added project creation, LA jurisdiction resolution, a staged compiler run via scheduled internal mutation, and a realtime project control room UI (`convex/schema.ts`, `convex/projects.ts`, `src/pages/*`). Initialized the public GitHub repository.
