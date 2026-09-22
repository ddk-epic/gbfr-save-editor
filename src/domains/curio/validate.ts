import { warning, type SaveIssue } from "../../core/validation";
import type { Curio } from "./read";

/** Serials count up in the order curios were found, so they climb with the entity. */
export const validateCurios = (curios: Curio[]): SaveIssue[] =>
  curios
    .filter((curio, i) => i > 0 && curio.serial <= curios[i - 1]!.serial)
    .map((curio) =>
      warning({ code: "curioSerialOrder", entity: curio.entity }),
    );
