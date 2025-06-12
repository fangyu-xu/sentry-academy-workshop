import "dotenv/config";
import esbuild from "esbuild";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";

// require("esbuild").build({
//   sourcemap: true, // Source map generation must be turned on
//   plugins: [
//     // Put the Sentry esbuild plugin after all other plugins
//     sentryEsbuildPlugin({
//       authToken: process.env.SENTRY_AUTH_TOKEN,
//       org: "trawa",
//       project: "portal-api",
//     }),
//   ],
// });

esbuild.build({
  entryPoints: ["index.ts"],
  sourcemap: true,
  bundle: true,
  minify: true,
  platform: "node",
  format: "cjs",
  outdir: "dist",
  allowOverwrite: true,
  external: ["express", "drizzle-orm", "pg"],
  plugins: [
    // Put the Sentry esbuild plugin after all other plugins
    sentryEsbuildPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "trawa",
      project: "portal-api",
    }),
  ],
});
