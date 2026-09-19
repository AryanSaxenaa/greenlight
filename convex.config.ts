import { defineApp } from "convex/server";
import auth from "@convex-dev/auth/convex.config";

export default defineApp({
  components: {
    auth,
  },
});
