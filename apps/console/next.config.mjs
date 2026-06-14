import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load the monorepo-root .env into process.env (Next only auto-loads the
// app-dir .env, not the workspace root). Mirrors apps/sites.
config({ path: join(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@platform/db", "@platform/blocks", "@platform/config", "@platform/notify"],
};

export default nextConfig;
