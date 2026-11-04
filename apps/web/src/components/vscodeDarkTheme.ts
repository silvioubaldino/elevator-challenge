import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { Extension } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { tags as t } from "@lezer/highlight"

const palette = {
  background: "#1e1e1e",
  foreground: "#d4d4d4",
  gutterBackground: "#1e1e1e",
  gutterForeground: "#858585",
  gutterActiveForeground: "#c6c6c6",
  activeLine: "#2a2d2e",
  selection: "#264f78",
  selectionInactive: "#3a3d41",
  cursor: "#aeafad",
  matchingBracket: "#0064001a",
  bracketBorder: "#888888",
  searchMatch: "#515c6a",
  keyword: "#569cd6",
  control: "#c586c0",
  string: "#ce9178",
  number: "#b5cea8",
  comment: "#6a9955",
  function: "#dcdcaa",
  type: "#4ec9b0",
  variable: "#9cdcfe",
  constant: "#4fc1ff",
  operator: "#d4d4d4",
  decorator: "#dcdcaa",
}

const editorTheme = EditorView.theme(
  {
    "&": { backgroundColor: palette.background, color: palette.foreground },
    ".cm-content": { caretColor: palette.cursor },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: palette.cursor },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: palette.selection },
    ".cm-selectionBackground": { backgroundColor: palette.selectionInactive },
    ".cm-activeLine": { backgroundColor: palette.activeLine },
    ".cm-gutters": {
      backgroundColor: palette.gutterBackground,
      color: palette.gutterForeground,
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
      color: palette.gutterActiveForeground,
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "transparent",
      border: "none",
      color: palette.gutterForeground,
    },
    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: palette.matchingBracket,
      outline: `1px solid ${palette.bracketBorder}`,
    },
    ".cm-searchMatch": { backgroundColor: palette.searchMatch },
    ".cm-panels": { backgroundColor: "#252526", color: palette.foreground },
    ".cm-tooltip": {
      backgroundColor: "#252526",
      border: "1px solid #454545",
      color: palette.foreground,
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "#04395e",
      color: "#ffffff",
    },
  },
  { dark: true },
)

const highlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.self, t.null, t.bool, t.operatorKeyword], color: palette.keyword },
  { tag: [t.controlKeyword, t.moduleKeyword], color: palette.control },
  { tag: [t.string, t.special(t.string)], color: palette.string },
  { tag: [t.number, t.integer, t.float], color: palette.number },
  { tag: [t.comment, t.lineComment, t.blockComment], color: palette.comment, fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: palette.function },
  { tag: [t.className, t.typeName], color: palette.type },
  { tag: [t.definition(t.variableName), t.variableName, t.propertyName], color: palette.variable },
  { tag: [t.standard(t.variableName), t.constant(t.variableName)], color: palette.constant },
  { tag: [t.operator, t.punctuation, t.bracket], color: palette.operator },
  { tag: [t.meta, t.annotation], color: palette.decorator },
])

export const vscodeDark: Extension = [editorTheme, syntaxHighlighting(highlightStyle)]
