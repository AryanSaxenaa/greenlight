/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentRuns from "../agentRuns.js";
import type * as approvals from "../approvals.js";
import type * as auth from "../auth.js";
import type * as communications from "../communications.js";
import type * as dependencies from "../dependencies.js";
import type * as documents from "../documents.js";
import type * as http from "../http.js";
import type * as integrations_agentmailActions from "../integrations/agentmailActions.js";
import type * as integrations_documentActions from "../integrations/documentActions.js";
import type * as integrations_firecrawlActions from "../integrations/firecrawlActions.js";
import type * as integrations_firecrawlWebhook from "../integrations/firecrawlWebhook.js";
import type * as integrations_openaiActions from "../integrations/openaiActions.js";
import type * as lib_agentRuns from "../lib/agentRuns.js";
import type * as lib_aiExamples from "../lib/aiExamples.js";
import type * as lib_aiGateway from "../lib/aiGateway.js";
import type * as lib_aiPrompts from "../lib/aiPrompts.js";
import type * as lib_aiSchemas from "../lib/aiSchemas.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_compiler from "../lib/compiler.js";
import type * as lib_dependencies from "../lib/dependencies.js";
import type * as lib_documentExtraction from "../lib/documentExtraction.js";
import type * as lib_draftEmail from "../lib/draftEmail.js";
import type * as lib_emailParsing from "../lib/emailParsing.js";
import type * as lib_emailValidation from "../lib/emailValidation.js";
import type * as lib_jurisdiction from "../lib/jurisdiction.js";
import type * as lib_requirementExtraction from "../lib/requirementExtraction.js";
import type * as lib_sources from "../lib/sources.js";
import type * as lib_svix from "../lib/svix.js";
import type * as lib_webhookAuth from "../lib/webhookAuth.js";
import type * as parameters from "../parameters.js";
import type * as projects from "../projects.js";
import type * as requirements from "../requirements.js";
import type * as sources from "../sources.js";
import type * as testing_aggressiveSuite from "../testing/aggressiveSuite.js";
import type * as testing_fixtures from "../testing/fixtures.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentRuns: typeof agentRuns;
  approvals: typeof approvals;
  auth: typeof auth;
  communications: typeof communications;
  dependencies: typeof dependencies;
  documents: typeof documents;
  http: typeof http;
  "integrations/agentmailActions": typeof integrations_agentmailActions;
  "integrations/documentActions": typeof integrations_documentActions;
  "integrations/firecrawlActions": typeof integrations_firecrawlActions;
  "integrations/firecrawlWebhook": typeof integrations_firecrawlWebhook;
  "integrations/openaiActions": typeof integrations_openaiActions;
  "lib/agentRuns": typeof lib_agentRuns;
  "lib/aiExamples": typeof lib_aiExamples;
  "lib/aiGateway": typeof lib_aiGateway;
  "lib/aiPrompts": typeof lib_aiPrompts;
  "lib/aiSchemas": typeof lib_aiSchemas;
  "lib/auth": typeof lib_auth;
  "lib/compiler": typeof lib_compiler;
  "lib/dependencies": typeof lib_dependencies;
  "lib/documentExtraction": typeof lib_documentExtraction;
  "lib/draftEmail": typeof lib_draftEmail;
  "lib/emailParsing": typeof lib_emailParsing;
  "lib/emailValidation": typeof lib_emailValidation;
  "lib/jurisdiction": typeof lib_jurisdiction;
  "lib/requirementExtraction": typeof lib_requirementExtraction;
  "lib/sources": typeof lib_sources;
  "lib/svix": typeof lib_svix;
  "lib/webhookAuth": typeof lib_webhookAuth;
  parameters: typeof parameters;
  projects: typeof projects;
  requirements: typeof requirements;
  sources: typeof sources;
  "testing/aggressiveSuite": typeof testing_aggressiveSuite;
  "testing/fixtures": typeof testing_fixtures;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
