import { keyTable } from "@gbfr/core";
import { GEM_KEYS, GEM_ROWS, type Gem } from "./data.gen";

export const GEMS = keyTable("gem", GEM_KEYS);
export { GEM_ROWS, type Gem };
