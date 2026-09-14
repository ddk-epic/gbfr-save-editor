import "i18next";
import type { resources } from "./index";

// Types t() against the English messages: a missing or misspelt key fails typecheck.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: (typeof resources)["en"];
  }
}
