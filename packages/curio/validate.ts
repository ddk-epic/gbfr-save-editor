import { warning, type Graded } from "@gbfr/core";
import type { CurioIssue } from "./issues";
import type { Curio } from "./read";

/** Serials count up in the order curios were found, so they climb with the entity. */
export const validateCurios = (curios: Curio[]): Graded<CurioIssue>[] =>
  curios
    .filter((curio, i) => i > 0 && curio.serial <= curios[i - 1]!.serial)
    .map((curio) =>
      warning({ code: "curioSerialOrder", entity: curio.entity }),
    );
