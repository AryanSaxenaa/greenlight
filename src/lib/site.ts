export const SITE_NAME = "Greenlight";
export const SITE_TAGLINE = "Know what the city requires";
export const SITE_DESCRIPTION =
  "AI permitting agent for Los Angeles residential work. Compile your permit graph, track requirements, and manage agency correspondence in one control room.";

export const SITE_URL =
  import.meta.env.VITE_CONVEX_SITE_URL ?? "https://handsome-bison-608.convex.site";

export const SITE_ROUTES = [
  "/",
  "/auth",
  "/projects",
  "/projects/new",
  "/privacy",
  "/terms",
] as const;

export const COOKIE_CONSENT_KEY = "greenlight-cookie-consent";
