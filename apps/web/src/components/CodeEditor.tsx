import { python } from "@codemirror/lang-python"
import { StateEffect, StateField } from "@codemirror/state"
import { Decoration, EditorView } from "@codemirror/view"
import { basicSetup } from "codemirror"
import { useEffect, useRef } from "react"

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

type Props = {
  value: string
  errorLine: number | null
  onChange(value: string): void
}

export function CodeEditor({ value, errorLine, onChange }: Props) {
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
        errorLineField,
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

  return <div className="code-editor" ref={host} />
}
