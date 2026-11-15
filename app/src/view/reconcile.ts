import { reuse } from "./reuse";
import type { SaveView } from "./types";

export const reconcileView = (prev: SaveView, next: SaveView): SaveView =>
  reuse(prev, next);
