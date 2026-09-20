/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public Convex deployment URL — safe to expose in the browser bundle. */
  readonly VITE_CONVEX_URL: string;
  /** Public site URL for canonical links and social previews. */
  readonly VITE_CONVEX_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
