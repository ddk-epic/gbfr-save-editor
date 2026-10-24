import path from "node:path";
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const APP = import.meta.dirname;

/** The library's package entries. */
const ENTRIES = [
  "gbfr-save-editor",
  "gbfr-save-editor/edit",
  "gbfr-save-editor/language",
];

/** Folders under src/ each folder may not import. */
const LAYERS = {
  pages: ["shell"],
  tables: ["shell", "pages"],
  issues: ["shell", "pages", "tables"],
  state: ["shell", "pages", "tables", "issues", "ui"],
  ui: ["shell", "pages", "tables", "issues", "state"],
  view: ["shell", "pages", "tables", "issues", "state", "ui"],
  i18n: ["shell", "pages", "tables", "issues", "state", "ui", "view"],
};

/** The src/ folder a file sits in. */
const layerOf = (file) =>
  path.relative(path.join(APP, "src"), file).split(path.sep)[0];

const boundary = {
  rules: {
    imports: {
      meta: { type: "problem", schema: [] },
      create(context) {
        const check = (node) => {
          const source = node.source;
          if (source?.type !== "Literal") return;
          const spec = source.value;
          if (spec.startsWith("gbfr-save-editor") && !ENTRIES.includes(spec))
            context.report({
              node: source,
              message: `Import the library through ${ENTRIES.join(", ")}, not ${spec}.`,
            });
          const layer = layerOf(context.filename);
          if (
            layer === "view" &&
            (spec === "react" || spec.startsWith("react/"))
          )
            context.report({
              node: source,
              message: "view/ builds plain data; keep React out of it.",
            });
          if (!spec.startsWith(".")) return;
          const target = path.resolve(path.dirname(context.filename), spec);
          if (path.relative(APP, target).startsWith(".."))
            context.report({
              node: source,
              message: `${spec} leaves app/; import the library through its package entries.`,
            });
          const into = layerOf(target);
          if (LAYERS[layer]?.includes(into))
            context.report({
              node: source,
              message: `${layer}/ may not import ${into}/.`,
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
  { ignores: ["node_modules", "dist"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  {
    languageOptions: { parserOptions: { tsconfigRootDir: APP } },
  },
  {
    plugins: { boundary },
    rules: { "boundary/imports": "error" },
  },
  prettier,
);
