import type { SaveIssue, ValidationIssue } from "gbfr-save-editor";
import { useTranslation } from "react-i18next";
import { reason } from "./LoadErrorText";

const VALIDATION_CODES = new Set<string>([
  "headerLayout",
  "slotDataPastFileSize",
  "unexpectedVersion",
  "zeroChecksum",
  "tableCount",
  "masteryOverTotal",
  "masterTraitPool",
  "overMasteryOverMax",
  "duplicateFateEpisode",
  "negativeResonancePoints",
  "resonanceRootNotTaken",
  "auraSeenNotObtained",
  "auraNotInTable",
  "negativeItemCount",
  "wishListTooLong",
  "duplicateWishListItem",
  "wishListNotTreasure",
  "itemNotHeld",
  "tooManyTraits",
  "traitsNotDescending",
  "curioSerialOrder",
  "duplicateJournalRow",
  "trophySeenNotEarned",
  "trophyNotInTable",
  "duplicateQuest",
  "completedNotAccepted",
  "clearDateWithoutClear",
  "clearDateOutOfRange",
  "questClearsMismatch",
  "unknownCharacter",
] satisfies ValidationIssue["code"][]);

const isValidation = (issue: SaveIssue): issue is ValidationIssue & SaveIssue =>
  VALIDATION_CODES.has(issue.code);

/** Phrases one validation issue in the current language. */
export function ValidationIssueText({ issue }: { issue: SaveIssue }) {
  const { t } = useTranslation();
  if (!isValidation(issue)) return <>{reason(t, issue)}</>;
  switch (issue.code) {
    case "headerLayout":
      return (
        <>
          {t("validationIssues.headerLayout", {
            field: issue.field,
            expected: issue.expected,
            actual: issue.actual,
          })}
        </>
      );
    case "slotDataPastFileSize":
      return (
        <>
          {t("validationIssues.slotDataPastFileSize", {
            end: issue.end,
            size: issue.fileSize,
          })}
        </>
      );
    case "unexpectedVersion":
      return (
        <>
          {t("validationIssues.unexpectedVersion", {
            what: issue.what,
            expected: issue.expected ?? "none",
            actual: issue.actual ?? "none",
          })}
        </>
      );
    case "zeroChecksum":
      return <>{t("validationIssues.zeroChecksum", { index: issue.index })}</>;
    case "tableCount":
      return (
        <>
          {t("validationIssues.tableCount", {
            table: issue.table,
            held: issue.held,
            expected: issue.expected,
          })}
        </>
      );
    case "masteryOverTotal":
      return (
        <>
          {t("validationIssues.masteryOverTotal", {
            character: issue.character,
            section: issue.section,
            taken: issue.taken,
            total: issue.total,
          })}
        </>
      );
    case "masterTraitPool":
      return (
        <>
          {t("validationIssues.masterTraitPool", {
            character: issue.character,
            rank: issue.rank,
            chosen: issue.chosen,
            pool: issue.pool,
          })}
        </>
      );
    case "overMasteryOverMax":
      return (
        <>
          {t("validationIssues.overMasteryOverMax", {
            character: issue.character,
            level: issue.level,
          })}
        </>
      );
    case "duplicateFateEpisode":
      return (
        <>
          {t("validationIssues.duplicateFateEpisode", {
            character: issue.character,
            key: issue.key,
          })}
        </>
      );
    case "negativeResonancePoints":
      return (
        <>
          {t("validationIssues.negativeResonancePoints", {
            points: issue.points,
          })}
        </>
      );
    case "resonanceRootNotTaken":
      return <>{t("validationIssues.resonanceRootNotTaken")}</>;
    case "auraSeenNotObtained":
      return (
        <>{t("validationIssues.auraSeenNotObtained", { key: issue.key })}</>
      );
    case "auraNotInTable":
      return <>{t("validationIssues.auraNotInTable", { key: issue.key })}</>;
    case "negativeItemCount":
      return (
        <>
          {t("validationIssues.negativeItemCount", {
            key: issue.key,
            count: issue.count,
          })}
        </>
      );
    case "wishListTooLong":
      return (
        <>
          {t("validationIssues.wishListTooLong", {
            count: issue.count,
            max: issue.max,
          })}
        </>
      );
    case "duplicateWishListItem":
      return (
        <>{t("validationIssues.duplicateWishListItem", { key: issue.key })}</>
      );
    case "wishListNotTreasure":
      return (
        <>{t("validationIssues.wishListNotTreasure", { key: issue.key })}</>
      );
    case "itemNotHeld":
      return (
        <>
          {t("validationIssues.itemNotHeld", {
            list: issue.list,
            key: issue.key,
          })}
        </>
      );
    case "tooManyTraits":
      return (
        <>
          {t("validationIssues.tooManyTraits", {
            holder: issue.holder,
            id: issue.id,
            count: issue.count,
            max: issue.max,
          })}
        </>
      );
    case "traitsNotDescending":
      return (
        <>
          {t("validationIssues.traitsNotDescending", {
            holder: issue.holder,
            id: issue.id,
          })}
        </>
      );
    case "curioSerialOrder":
      return (
        <>{t("validationIssues.curioSerialOrder", { entity: issue.entity })}</>
      );
    case "duplicateJournalRow":
      return (
        <>
          {t("validationIssues.duplicateJournalRow", {
            list: issue.list,
            key: issue.key,
          })}
        </>
      );
    case "trophySeenNotEarned":
      return (
        <>{t("validationIssues.trophySeenNotEarned", { key: issue.key })}</>
      );
    case "trophyNotInTable":
      return <>{t("validationIssues.trophyNotInTable", { key: issue.key })}</>;
    case "duplicateQuest":
      return (
        <>
          {t("validationIssues.duplicateQuest", {
            list: issue.list,
            id: issue.id,
          })}
        </>
      );
    case "completedNotAccepted":
      return (
        <>{t("validationIssues.completedNotAccepted", { id: issue.id })}</>
      );
    case "clearDateWithoutClear":
      return (
        <>{t("validationIssues.clearDateWithoutClear", { id: issue.id })}</>
      );
    case "clearDateOutOfRange":
      return (
        <>
          {t("validationIssues.clearDateOutOfRange", {
            id: issue.id,
            date: issue.date,
          })}
        </>
      );
    case "questClearsMismatch":
      return (
        <>
          {t("validationIssues.questClearsMismatch", {
            sum: issue.sum,
            profile: issue.profile,
          })}
        </>
      );
    case "unknownCharacter":
      return (
        <>
          {t("validationIssues.unknownCharacter", {
            where: issue.where,
            key: issue.key,
          })}
        </>
      );
  }
}
