import path from "node:path";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const PACKAGES = path.resolve(import.meta.dirname, "packages");

// Package specifiers that resolve to write code.
const WRITE_SPECIFIER =
  /^(@gbfr\/[^/]+\/edit|@gbfr\/core\/session|@gbfr\/core\/draft|@gbfr\/workflows|gbfr-save-editor\/edit)$/;

const isWriteFile = (rel) =>
  /(^|\/)(edit|session|draft)$/.test(rel) || rel.startsWith("workflows/");

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

const editEntry = {
  rules: {
    imports: {
      meta: { type: "problem", schema: [] },
      create(context) {
        const check = (node) => {
          const source = node.source;
          if (source?.type !== "Literal" || typeof source.value !== "string")
            return;
          if (!WRITE_SPECIFIER.test(source.value))
            context.report({
              node: source,
              message: `the edit entry exports only write code (${source.value}).`,
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

const BROWSER_ONLY = {
  group: ["node:*", "fs", "path", "@/*"],
  message:
    "packages run in the browser and import only relative paths or @gbfr/* packages; file access belongs in scripts or test.",
};

const SESSION_ONLY = {
  group: ["@gbfr/core/session", "**/core/session"],
  message:
    "only core and gbfr-save-editor use SaveSession; domain code takes a Draft.",
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
        { patterns: [BROWSER_ONLY, SESSION_ONLY] },
      ],
    },
  },
  // Only core and the facade open sessions.
  {
    files: ["packages/core/**", "packages/gbfr-save-editor/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [BROWSER_ONLY] }],
    },
  },
  // Read code never imports write code.
  {
    files: ["packages/**"],
    plugins: { "read-write": readWrite },
    rules: { "read-write/imports": "error" },
  },
  // The facade's edit entry exports only write code.
  {
    files: ["packages/gbfr-save-editor/edit.ts"],
    plugins: { "edit-entry": editEntry },
    rules: { "edit-entry/imports": "error" },
  },
  prettier,
);
