import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, keymap, type ViewUpdate } from "@codemirror/view";
import type { EditorView as EditorViewType } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
import { indentWithTab } from "@codemirror/commands";

/** Dispatch with a line number (1-indexed) to highlight it, or null to clear. */
export const setErrorLine = StateEffect.define<number | null>();

const errorLineDecoration = Decoration.line({ attributes: { class: "cm-error-line" } });

const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, tr) {
    let next = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setErrorLine)) {
        if (effect.value == null) {
          next = Decoration.none;
        } else {
          const lineNumber = Math.min(Math.max(1, effect.value), tr.state.doc.lines);
          const line = tr.state.doc.line(lineNumber);
          next = Decoration.set([errorLineDecoration.range(line.from)]);
        }
      }
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const errorLineTheme = EditorView.baseTheme({
  ".cm-error-line": { backgroundColor: "rgba(239, 68, 68, 0.22)" },
});

/** Static extension: shows a full-line red highlight wherever setErrorLine points, until cleared. */
export const errorLineExtension = [errorLineField, errorLineTheme];

/** Clear the error highlight whenever the student edits the doc, so it never goes stale. */
export const clearErrorLineOnEdit = EditorView.updateListener.of((update: ViewUpdate) => {
  if (update.docChanged) {
    update.view.dispatch({ effects: setErrorLine.of(null) });
  }
});

export function highlightErrorLine(view: EditorViewType, line: number | null) {
  view.dispatch({ effects: setErrorLine.of(line) });
}

/** Shared editor setup for every Python CodeMirror instance in the app. */
export const pythonEditorExtensions = [
  python(),
  indentUnit.of("    "),
  keymap.of([indentWithTab]),
  errorLineExtension,
  clearErrorLineOnEdit,
];
