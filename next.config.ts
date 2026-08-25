import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next advertises localhost:3000; WorkOS redirects there. Opening the shell
  // at 127.0.0.1:3000 otherwise blocks /_next vendor chunks (agents/react),
  // so handshake can run while useAgent never fires.
  allowedDevOrigins: ["127.0.0.1"],
  // Keep Turbopack rooted on the repo, not on ./app (that panic killed the last
  // dev server: "Next.js package not found").
  turbopack: {
    root: path.join(__dirname),
  },
  // Driver adapter + pg (Hyperdrive). Do not ship the native Prisma engine.
  // pg-cloudflare must be listed or OpenNext copies only dist/empty.js.
  // @prisma/client and .prisma/client must stay external so the bundler
  // resolves their `workerd` export condition (the WASM query compiler)
  // instead of the Node entry, which reads the .wasm off disk.
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "pg-cloudflare",
    "puppeteer",
    "pdf-lib",
  ],
  // Prisma's generated runtime does path.join(process.cwd(), …) which traces
  // the whole repo (knowledge dumps, scripts, native engines) into the Worker.
  outputFileTracingExcludes: {
    "/*": [
      "./knowledge/**/*",
      "./scripts/**/*",
      "./docs/**/*",
      "./workers/**/*",
      "./node_modules/@prisma/engines/**/*",
    ],
  },
};

export default nextConfig;

// Dynamic import — a static @opennextjs/cloudflare import makes next.config
// an ESM graph with top-level await, which Next 16 cannot require().
if (process.env.NODE_ENV !== "production") {
  void import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}
