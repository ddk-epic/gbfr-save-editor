import { mkdirSync, writeFileSync } from "node:fs";
import type { Context } from "./context";
import { loadMsg } from "./msg";

// Game text: gt() table -> query returning (key, text_id), the key domain
// returns and its .msg id. Unk* columns keep the extractor's names.
const GAME_TEXT = {
  character: `select CharId key, 'TXT_' || CharId text_id from chara`,
  weapon: `select Key key, Name text_id from weapon`,
  sigil: `select Key key, Name text_id from gem`,
  trait: `select Key key, Name text_id from skill`,
  // Unk5 is the name, Unk6 its _CG copy, Unk7 the info text.
  skill: `select Key key, Unk5 text_id from ability`,
  item: `select Key key, ItemName text_id from item`,
  mastery: `select Key key, FullName text_id from limit_bonus_param`,
  masteryNode: `select Key key, NodeTitle text_id from limit_bonus`,
  // Unique bonuses keep their format in FormatText1, the rest in NameFormat.
  masteryEffect: `select Key key, coalesce(nullif(FormatText1, ''), NameFormat) text_id from limit_bonus_param`,
  // Unk18 is the style title on the r1 perks, Unk19 the trait text.
  masterTrait: `select Key key, Unk19 text_id from skillboard_effect`,
  summon: `select s.Key key, p.SummonName text_id from summon s join summon_param p on p.Key = s.SummonParamId`,
  summonBonus: `select Key key, Name text_id from summon_base_param`,
  fateEpisode: `select Key key, FateMissionTitle text_id from fate_episode`,
  archive: `select Key key, NoteTitle text_id from story_note_archive`,
  // Unk4 is the entry title, Unk5 its summary; Unk6 and Unk7 repeat both.
  story: `select Key key, Unk4 text_id from story`,
  // Note numbers the chapter, "Prologue"; The Story So Far has none.
  storyChapter: `select cast(Key as text) key, Title text_id, Note prefix_id from story_note_chapter`,
  chapterStart: `select cast(Key as text) key, Title text_id from chapter_select`,
  // The story_note_chapter row a chapter_select row belongs to, by key.
  chapterStartChapter: `select cast(c.Key as text) key, n.Title text_id, n.Note prefix_id from chapter_select c join story_note_chapter n on n.Title = replace(c.ChapterText, 'TELOP_CHAPTER_MAIN_', 'TXT_CHAPTER_MAIN_TITLE_')`,
  fieldNoteCharacter: `select Key key, CharacterName text_id from story_note_picturebook_chara`,
  fieldNoteFoe: `select EnemyId key, EnemyName text_id from story_note_picturebook_enemy`,
  fieldNoteWrightstone: `select Key key, ItemName1 text_id from story_note_picturebook_code`,
  fieldNoteCategory: `select cast(Key as text) key, Name text_id from story_note_picturebook_category`,
  glossary: `select Key key, Key text_id from story_note_wordlist`,
  // Unk18 is the title on character tips; tutorial tips title elsewhere.
  tip: `select TutorialWindowIdUnlockRequirement key, Unk18 text_id from story_note_tips`,
  music: `select Key key, MusicTitle text_id from story_note_bgm`,
  // A quest title is TXT_QR_ and the quest id without its leading "00".
  quest: `select Key key, 'TXT_QR_' || substr(Key, 3) text_id from quest_baseinfo_ex_data`,
  trophy: `select cast(Key as text) key, Name text_id from badge`,
  trophyDescription: `select cast(Key as text) key, Description text_id from badge`,
  stage: `select PhaseId key, Name text_id from stagename`,
  aura: `select Unk105 key, BuffName text_id from endlessmode_buff`,
  // No table names the weapon series; weapon.Unk30 indexes these labels, and 6 has none.
  weaponSeries: `select '0' key, 'TXT_PAU_WEP_TYPE_BAHAMUT' text_id
    union all select '1', 'TXT_PAU_WEP_TYPE_STUN'
    union all select '2', 'TXT_PAU_WEP_TYPE_AWAKE'
    union all select '3', 'TXT_PAU_WEP_TYPE_CRI'
    union all select '4', 'TXT_PAU_WEP_DEFENSE'
    union all select '5', 'TXT_PAU_WEP_TYPE_WEAK'
    union all select '7', 'TXT_PAU_WEP_TYPE_PRIVILEGE'`,
  // No table names the categories; the collection's type labels are in category order.
  auraCategory: `select '0' key, 'TXT_KKTN_BFCHIC_TYPE_BREATH' text_id
    union all select '1', 'TXT_KKTN_BFCHIC_TYPE_ISOLATION'
    union all select '2', 'TXT_KKTN_BFCHIC_TYPE_TUTELARY'
    union all select '3', 'TXT_KKTN_BFCHIC_TYPE_AWE'
    union all select '4', 'TXT_KKTN_BFCHIC_TYPE_DESTROY'
    union all select '5', 'TXT_KKTN_BFCHIC_TYPE_CONFLICT'
    union all select '6', 'TXT_KKTN_BFCHIC_TYPE_DISASTER'
    union all select '7', 'TXT_KKTN_BFCHIC_TYPE_RESCUE'
    union all select '8', 'TXT_KKTN_BFCHIC_TYPE_CHAOS'`,
  // Game UI labels, keyed by app name.
  ui: `select 'close' key, 'TXT_DLG_BUTTON_CLOSE' text_id
    union all select 'apply', 'TXT_DLG_BUTTON_EXECUTE'
    union all select 'trait', 'TXT_BLS_CR_WEAPON_SKILL'
    union all select 'traitLevel', 'TXT_PAU_SKILL_LEVEL_DETAIL'
    union all select 'level', 'TXT_PAU_LEVEL'
    union all select 'mainStory', 'TXT_NOTE_MENU_MAIN_STORY'
    union all select 'unlockCharacter', 'TXT_PAU_TTL_SHOP_CHARA'`,
} satisfies Record<string, string>;

/** Output language -> .msg folder. */
const TEXT_LANGUAGES = { en: "en", ja: "jp" };

export function genText({ db, textDir, names }: Context) {
  mkdirSync(new URL("../../packages/gbfr-save-editor/text/", import.meta.url), {
    recursive: true,
  });
  for (const [lang, folder] of Object.entries(TEXT_LANGUAGES)) {
    const msg = loadMsg(textDir, folder);
    const out: Record<string, Record<string, string>> = {};
    const counts: string[] = [];
    for (const [table, sql] of Object.entries(GAME_TEXT)) {
      const rows = db.prepare(sql).all() as {
        key: unknown;
        text_id: unknown;
        prefix_id?: unknown;
      }[];
      const keys = new Set<string>();
      const texts = new Map<string, string>();
      for (const { key, text_id, prefix_id } of rows) {
        if (typeof key !== "string" || key === "") continue;
        keys.add(key);
        const body = typeof text_id === "string" ? msg.get(text_id) : undefined;
        // A query with a prefix_id puts that text first, as the game does with
        // "Prologue" before "The Forgotten Sky". An empty one drops away.
        const prefix =
          typeof prefix_id === "string" ? msg.get(prefix_id) : undefined;
        const text = body && prefix ? `${prefix} ${body}` : body;
        if (text && !texts.has(key)) texts.set(key, text);
      }
      out[table] = Object.fromEntries(
        [...texts].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
      counts.push(`${table} ${texts.size}/${keys.size}`);
    }
    writeFileSync(
      new URL(
        `../../packages/gbfr-save-editor/text/${lang}.json`,
        import.meta.url,
      ),
      `${JSON.stringify(out, null, 2)}\n`,
    );
    console.log(`text ${lang}: ${counts.join(", ")}`);
    if (lang === "en") {
      names.quest = out.quest ?? {};
      names.story = out.story ?? {};
      names.trophy = out.trophy ?? {};
    }
  }
}
