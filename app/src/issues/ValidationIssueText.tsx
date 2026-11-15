import type {
  SaveIssue,
  ValidationCode,
  ValidationIssue,
} from "gbfr-save-editor";
import { useTranslation } from "react-i18next";
import en from "../i18n/en.json";
import { reason } from "./LoadErrorText";

/** One text per validation code, its placeholders named after the issue's fields. */
const TEXTS: Record<ValidationCode, string> = en.validationIssues;

const isValidation = (issue: SaveIssue): issue is ValidationIssue & SaveIssue =>
  issue.code in TEXTS;

/** Phrases one validation issue in the current language. */
export function ValidationIssueText({ issue }: { issue: SaveIssue }) {
  const { t } = useTranslation();
  if (!isValidation(issue)) return <>{reason(t, issue)}</>;
  const none = t("validation.none");
  const fields = Object.fromEntries(
    Object.entries(issue).map(([field, value]) => [field, value ?? none]),
  );
  return <>{t(`validationIssues.${issue.code}`, { replace: fields })}</>;
}
