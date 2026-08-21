import { sql } from "@codemirror/lang-sql";
import { indentUnit } from "@codemirror/language";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";

export const sqlEditorExtensions = [sql(), indentUnit.of("    "), keymap.of([indentWithTab])];
