import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// load the monorepo-root .env into process.env
config({ path: join(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@platform/db", "@platform/blocks", "@platform/config"],
  typedRoutes: true,
};
export default nextConfig;