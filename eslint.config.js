import path from "node:path";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const SRC = path.resolve(import.meta.dirname, "src");

/**
 * Layer of a module path under src, without extension. Edit: the edit entry,
 * session/, data/rules/, and any edit or rules file. Catalog: the catalog entry
 * and catalog/. Everything else is read.
 */
function layerOf(rel) {
  if (/^catalog(\/|$)/.test(rel)) return "catalog";
  if (/^(edit$|session\/|data\/rules\/)|(^|\/)(edit|rules)$/.test(rel))
    return "edit";
  return "read";
}

/** Layers each layer may import. Read stays copyable on its own. */
const ALLOWED = {
  read: ["read"],
  edit: ["read", "edit"],
  catalog: ["read", "catalog"],
};

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
        const from = layerOf(rel(context.filename));
        const check = (node) => {
          const source = node.source;
          if (source?.type !== "Literal" || !source.value.startsWith("."))
            return;
          const target = path.resolve(
            path.dirname(context.filename),
            source.value,
          );
          const to = rel(target);
          if (to.startsWith("..")) return;
          if (!ALLOWED[from].includes(layerOf(to)))
            context.report({
              node: source,
              message: `${from} code cannot import ${layerOf(to)} code (${source.value}).`,
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
  // Read, edit and catalog layers, matching the package entries.
  {
    files: ["src/**"],
    plugins: { layers },
    rules: { "layers/imports": "error" },
  },
  prettier,
);
