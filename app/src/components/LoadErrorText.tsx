import { useTranslation } from "react-i18next";
import type { LoadError } from "../save/load";

const hex = (n: number | bigint) => `0x${n.toString(16)}`;

/** Phrases a load error from its code in the current language. */
export function LoadErrorText({ error }: { error: LoadError }) {
  const { t } = useTranslation();
  return <>{t("loadErrors.rejected", { reason: reason(t, error) })}</>;
}

function reason(
  t: ReturnType<typeof useTranslation>["t"],
  error: LoadError,
): string {
  switch (error.code) {
    case "outOfBounds":
      return t("loadErrors.outOfBounds", {
        what: error.what,
        at: hex(error.at),
        size: error.size,
        length: hex(error.length),
      });
    case "tooLarge":
      return t("loadErrors.tooLarge", {
        what: error.what,
        value: hex(error.value),
      });
    case "noFooterRoom":
      return t("loadErrors.noFooterRoom", { size: hex(error.slotDataSize) });
    case "footerMisaligned":
      return t("loadErrors.footerMisaligned", {
        bytes: hex(error.checksumBytes),
        offset: hex(error.checksumOffset),
        footer: hex(error.footerAt),
      });
    case "flatBufferTooShort":
      return t("loadErrors.flatBufferTooShort");
    case "mixedValueType":
      return t("loadErrors.mixedValueType", {
        idType: error.idType,
        first: error.first,
        second: error.second,
      });
    case "duplicateUnit":
      return t("loadErrors.duplicateUnit", {
        idType: error.idType,
        unitId: error.unitId,
      });
    case "wrongValueType":
      return t("loadErrors.wrongValueType", {
        idType: error.idType,
        expected: error.expected,
        actual: error.actual,
      });
    case "unusedMasteryBit":
      return t("loadErrors.unusedMasteryBit", {
        unitId: error.unitId,
        bit: error.bit,
      });
    case "overMasteryLevel":
      return t("loadErrors.overMasteryLevel", {
        unitId: error.unitId,
        bits: error.bits,
      });
    case "unexpected":
      return t("loadErrors.unexpected");
  }
}
