import { defineConfig } from "vitest/config";

// Library tests only; the app has none.
export default defineConfig({ test: { include: ["test/**/*.test.ts"] } });
