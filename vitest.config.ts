import { defineConfig } from "vitest/config";

// Library tests only; app has its own vitest run.
export default defineConfig({ test: { include: ["test/**/*.test.ts"] } });
