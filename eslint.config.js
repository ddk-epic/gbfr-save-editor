import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  // Unlinted trees, mirroring .gitignore.
  { ignores: ["node_modules", "tmp"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        fetch: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly",
      },
    },
  },
  // Rest destructuring drops fields such as steamId.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
    },
  },
  // src is bundled into gbfr-sharecard: browser-safe, no aliases.
  {
    files: ["src/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["node:*", "fs", "path", "@/*"],
              message:
                "src runs in the browser and uses relative imports; file access belongs in scripts or test.",
            },
          ],
        },
      ],
    },
  },
  prettier,
);
