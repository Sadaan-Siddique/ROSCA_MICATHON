// TanStack Start needs this wrapper; plain vite + react() expects index.html + src/main.tsx.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    // Use "/<repo-name>/" here when building for GitHub Pages under a subpath.
    base: "/",
  },
});
