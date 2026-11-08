import path from "node:path";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const PACKAGES = path.resolve(import.meta.dirname, "packages");

// Package specifiers that resolve to write code.
const WRITE_SPECIFIER =
  /^(@gbfr\/[^/]+\/edit|@gbfr\/core\/session|@gbfr\/workflows|gbfr-save-editor\/edit)$/;

const isWriteFile = (rel) =>
  /(^|\/)(edit|session)$/.test(rel) || rel.startsWith("workflows/");

const readWrite = {
  rules: {
    imports: {
      meta: { type: "problem", schema: [] },
      create(context) {
        const rel = (file) =>
          path
            .relative(PACKAGES, file)
            .split(path.sep)
            .join("/")
            .replace(/\.[cm]?[jt]sx?$/, "");
        const fromRel = rel(context.filename);
        const check = (node) => {
          const source = node.source;
          if (source?.type !== "Literal" || typeof source.value !== "string")
            return;
          if (isWriteFile(fromRel)) return;
          const spec = source.value;
          const write = spec.startsWith(".")
            ? isWriteFile(
                rel(path.resolve(path.dirname(context.filename), spec)),
              )
            : WRITE_SPECIFIER.test(spec);
          if (write)
            context.report({
              node: source,
              message: `read code cannot import write code (${spec}).`,
            });
        };
        return {
          ImportDeclaration: check,
          ExportAllDeclaration: check,
          ExportNamedDeclaration: check,
          ImportExpression: check,
        };
      },
    },
  },
};

export default tseslint.config(
  // Unlinted: .gitignore entries and app.
  { ignores: ["node_modules", "tmp", "app"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
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
  // Allows unused rest siblings.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
    },
  },
  // packages run in the browser: no Node modules, no aliases.
  {
    files: ["packages/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["node:*", "fs", "path", "@/*"],
              message:
                "packages run in the browser and import only relative paths or @gbfr/* packages; file access belongs in scripts or test.",
            },
          ],
        },
      ],
    },
  },
  // Read code never imports write code.
  {
    files: ["packages/**"],
    plugins: { "read-write": readWrite },
    rules: { "read-write/imports": "error" },
  },
  prettier,
);
