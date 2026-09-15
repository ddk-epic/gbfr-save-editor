import path from "node:path";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const APP = import.meta.dirname;

/** The library's package entries, the only way into it. */
const ENTRIES = [
  "gbfr-save-editor",
  "gbfr-save-editor/edit",
  "gbfr-save-editor/language",
];

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
          if (!spec.startsWith(".")) return;
          const target = path.resolve(path.dirname(context.filename), spec);
          if (path.relative(APP, target).startsWith(".."))
            context.report({
              node: source,
              message: `${spec} leaves app/; import the library through its package entries.`,
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
  {
    languageOptions: { parserOptions: { tsconfigRootDir: APP } },
  },
  {
    plugins: { boundary },
    rules: { "boundary/imports": "error" },
  },
  prettier,
);
