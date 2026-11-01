import type { NextConfig } from "next";

// STATIC_EXPORT=true builds a plain HTML export into `out/` (used by the
// GitHub Pages workflow). BASE_PATH serves it from a sub-path such as
// /first-principles when the site isn't at the domain root.
const staticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(staticExport && {
    output: "export",
    trailingSlash: true,
    basePath: process.env.BASE_PATH || undefined,
  }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
