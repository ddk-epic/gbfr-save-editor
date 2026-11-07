# Validation

`validateSave` in `src/save/validate.ts` runs a list of modules that check claims every save the game writes holds, and returns what it finds. Reading a save says what it holds; validation says whether what it holds makes sense.

```ts
const issues = validateSave(readSave(bytes));
```

Save content never makes it throw. A reader throwing `SaveFormatError` on the way is caught and returned as a reject, and the modules that did not depend on it still run. `now` can be passed to fix the latest a quest can have been cleared.

## Issues

An issue is a `code` and that check's parameters, in the shape `SaveFormatError` uses, plus a severity. The library holds no text for them; callers phrase the message in their own language, as `app/src/issues/ValidationIssueText.tsx` does.

```ts
{ severity: "warning", code: "tableCount", table: "item", held: 447, expected: 448 }
```

| Severity  | Means                                                                    |
| --------- | ------------------------------------------------------------------------ |
| `reject`  | The reading cannot be trusted, or the game would refuse the save         |
| `warning` | The save reads, but something is off, usually `src/data` behind the game |

Three kinds of check make up the list.

- **Save invariants.** Claims about one save's own consistency: counter quest clears add up to the profile's count, a completed side quest was accepted, a wish list holds at most 20 materials the inventory holds, a wrightstone rolls at most three traits in descending level, a mastery section takes no more nodes than it holds.
- **Table counts.** The save keeps a row for every game table row from the start, so a count below the table means a misread and one above it means `src/data` is behind the game. Items, characters and the journal lists are counted this way, as `tableCount`.
- **Container checks.** The header fields the format fixes, the versions the readers were written against, and ten non-zero SlotData checksums.

Unresolved keys are not reported here yet. They still surface as a console warning while reading and as the app's `unresolved` count.

## Layout

- `src/core/validation.ts` holds the generic machinery: `Issue`, `Graded`, `reject`, `warning`, `duplicates` and `TableCountIssue`.
- `src/core/module.ts` defines `SaveModule`, a named set of checks over a save, and the `ValidateContext` they receive.
- `src/core/validate-container.ts` holds the container checks and their `ContainerIssue` codes as `containerModule`.
- `src/domains/<x>/issues.ts` holds the issue codes that domain's checks produce, and any format codes its reader throws.
- `src/domains/<x>/validate.ts` checks what that domain's reader returns, such as `validateTrophies(trophies)`, and exports a module when the checks need only that reader: `confluxModule`, `trophyModule`, `sideQuestModule` (side quests) and `journalModule`.
- `src/save/cross-validate.ts` holds checks spanning domains, such as quest clears against the profile, as `characterModule`, `inventoryModule` and `counterQuestModule` (counter quests, then their clears against the profile).
- `src/save/issues.ts` holds the codes those checks produce and composes the public `ValidationIssue`, `SaveFormatIssue` and `SaveIssue` unions.
- `src/save/validate.ts` lists the default modules as `SAVE_MODULES` and runs them in that order. `validateSave(save, { now, modules })` takes another list, and catches a `SaveFormatError` per module.

Each check takes records rather than a `UnitStore`, so its test states the records it checks. A module wraps reading and one check; counter quests and their clears share a module, so a read failing in either drops both.

## Checking a file

```
pnpm check:save [files...]
```

Defaults to every `tmp/SaveData*.dat`. It prints the issues per file and exits non-zero when a save is rejected. This is the loop for decoding new units: read a save, see what stops adding up.
