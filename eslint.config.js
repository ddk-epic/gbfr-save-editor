import path from "node:path";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const SRC = path.resolve(import.meta.dirname, "src");

// Layers each layer may import.
const LAYERS = {
  core: ["core"],
  data: ["data"],
  domains: ["core", "data", "domains"],
  save: ["core", "data", "domains", "save"],
  entry: ["core", "data", "domains", "save", "entry"],
};

const ENTRIES = ["index", "edit", "language", "testing"];

// Layer of a src-relative path.
function layerOf(rel) {
  const top = rel.split("/")[0];
  if (ENTRIES.includes(top)) return "entry";
  return Object.hasOwn(LAYERS, top) ? top : undefined;
}

const isWrite = (rel) => /(^|\/)(edit|fill|clear|session)$/.test(rel);

// Reason an import is not allowed, or null.
function violation(fromRel, toRel) {
  const from = layerOf(fromRel);
  const to = layerOf(toRel);
  if (!from) return `${fromRel} is in no layer; add it to LAYERS`;
  if (!to) return `${toRel} is in no layer; add it to LAYERS`;
  if (isWrite(toRel) && !isWrite(fromRel))
    return "read code cannot import write code";
  if (!LAYERS[from].includes(to)) return `${from} cannot import ${to}`;
  return null;
}

const layers = {
  rules: {
    imports: {
      meta: { type: "problem", schema: [] },
      create(context) {
        const rel = (file) =>
          path
            .relative(SRC, file)
            .split(path.sep)
            .join("/")
            .replace(/\.[cm]?[jt]sx?$/, "");
        const fromRel = rel(context.filename);
        const check = (node) => {
          const source = node.source;
          if (source?.type !== "Literal" || !source.value.startsWith("."))
            return;
          const target = path.resolve(
            path.dirname(context.filename),
            source.value,
          );
          const toRel = rel(target);
          if (toRel.startsWith("..")) return;
          const reason = violation(fromRel, toRel);
          if (reason)
            context.report({
              node: source,
              message: `${reason} (${source.value}).`,
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
  // src runs in the browser: no Node modules, no aliases.
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
  // Restricts imports between src layers.
  {
    files: ["src/**"],
    plugins: { layers },
    rules: { "layers/imports": "error" },
  },
  prettier,
);
