import type { Context, DataFile } from "./context";

/** Emits `name`, a table column by the table's Key, into `file`. */
export function emitSortOrder(
  { db, emit }: Context,
  file: DataFile,
  name: string,
  table: string,
  column: string,
) {
  const rows = (
    db
      .prepare(`select Key, "${column}" as sortOrder from "${table}"`)
      .all() as {
      Key: string;
      sortOrder: number;
    }[]
  ).map(({ Key, sortOrder }) => `  ${JSON.stringify(Key)}: ${sortOrder},`);
  emit(
    file,
    `/** ${table}.${column} by ${table}.Key. */
export const ${name}: Readonly<Record<string, number>> = {
${rows.sort().join("\n")}
};`,
  );
  console.log(`${name}: ${rows.length} keys`);
}
