import { defineConfig } from "@caido-community/dev";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  id: "pixel-coordinate",
  name: "Pixel Coordinate",
  description:
    "Hover over rendered images to see pixel coordinates. Click to freeze the coordinate, then click Clear to reset.",
  version: "0.1.1",
  author: {
    name: "ruzfi",
    email: "riyan@ruz.fi",
  },
  plugins: [
    {
      kind: "backend",
      id: "backend",
      root: "packages/backend",
    },
    {
      kind: "frontend",
      id: "frontend",
      root: "packages/frontend",
      backend: {
        id: "backend",
      },
      vite: {
        plugins: [vue()],
        build: {
          rollupOptions: {
            external: ["@caido/frontend-sdk", "vue"],
          },
        },
      },
    },
  ],
});
