import { indentLess, indentMore } from "@codemirror/commands"
import { indentUnit } from "@codemirror/language"
import { python, pythonLanguage } from "@codemirror/lang-python"
import { Compartment, StateEffect, StateField } from "@codemirror/state"
import { Decoration, EditorView } from "@codemirror/view"
import { basicSetup } from "codemirror"
import { useEffect, useImperativeHandle, useRef, type Ref } from "react"
import { t } from "../i18n/pt-BR"
import { elevatorCompletions } from "./elevatorCompletions"
import { vscodeDark } from "./vscodeDarkTheme"

const setErrorLine = StateEffect.define<number | null>()

const errorLineField = StateField.define({
  create: () => Decoration.none,
  update(decorations, tr) {
    let next = decorations.map(tr.changes)
    for (const effect of tr.effects) {
      if (!effect.is(setErrorLine)) continue
      const line = effect.value
      next =
        line === null || line < 1 || line > tr.state.doc.lines
          ? Decoration.none
          : Decoration.set([
              Decoration.line({ class: "cm-error-line" }).range(tr.state.doc.line(line).from),
            ])
    }
    return next
  },
  provide: (field) => EditorView.decorations.from(field),
})

export type CodeEditorHandle = {
  reveal(line: number): void
}

type Props = {
  value: string
  errorLine: number | null
  compact?: boolean
  handle?: Ref<CodeEditorHandle>
  onChange(value: string): void
}

const SYMBOLS = [":", "(", ")", "_", ".", "=", '"', "[", "]", ",", "#"]

const wrapping = new Compartment()

export function CodeEditor({ value, errorLine, compact = false, handle, onChange }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      doc: value,
      extensions: [
        basicSetup,
        python(),
        indentUnit.of("    "),
        pythonLanguage.data.of({ autocomplete: elevatorCompletions }),
        vscodeDark,
        errorLineField,
        wrapping.of(compact ? EditorView.lineWrapping : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString())
        }),
      ],
    })
    view.current = editor
    return () => editor.destroy()
  }, [])

  useEffect(() => {
    const editor = view.current
    if (!editor || editor.state.doc.toString() === value) return
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } })
  }, [value])

  useEffect(() => {
    view.current?.dispatch({ effects: setErrorLine.of(errorLine) })
  }, [errorLine, value])

  useEffect(() => {
    view.current?.dispatch({ effects: wrapping.reconfigure(compact ? EditorView.lineWrapping : []) })
  }, [compact])

  useImperativeHandle(handle, () => ({
    reveal(line) {
      const editor = view.current
      if (!editor || line < 1 || line > editor.state.doc.lines) return
      const from = editor.state.doc.line(line).from
      editor.dispatch({ selection: { anchor: from }, effects: EditorView.scrollIntoView(from, { y: "center" }) })
    },
  }))

  return (
    <>
      <div className="code-editor" ref={host} />
      {compact && <SymbolBar view={() => view.current} />}
    </>
  )
}

function SymbolBar({ view }: { view(): EditorView | null }) {
  const run = (action: (editor: EditorView) => void) => () => {
    const editor = view()
    if (editor) action(editor)
  }
  const insert = (text: string) => run((editor) => editor.dispatch(editor.state.replaceSelection(text)))
  const keepFocus = (event: React.SyntheticEvent) => event.preventDefault()

  return (
    <div className="symbol-bar" role="toolbar" aria-label={t.symbolBar.label}>
      <div className="symbol-keys">
        <button type="button" aria-label={t.symbolBar.indent} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={run(indentMore)}>
          ⇥
        </button>
        <button type="button" aria-label={t.symbolBar.dedent} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={run(indentLess)}>
          ⇤
        </button>
        {SYMBOLS.map((symbol) => (
          <button type="button" key={symbol} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={insert(symbol)}>
            {symbol}
          </button>
        ))}
      </div>
      <button type="button" className="symbol-done" onClick={run((editor) => editor.contentDOM.blur())}>
        {t.symbolBar.done}
      </button>
    </div>
  )
}
