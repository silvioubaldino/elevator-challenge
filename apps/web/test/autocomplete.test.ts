import { python, pythonLanguage } from "@codemirror/lang-python"
import {
  CompletionContext,
  type Completion,
  type CompletionResult,
} from "@codemirror/autocomplete"
import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { describe, expect, it } from "vitest"
import { elevatorCompletions } from "../src/components/elevatorCompletions"

function complete(doc: string): CompletionResult | null {
  const state = EditorState.create({
    doc,
    extensions: [python(), pythonLanguage.data.of({ autocomplete: elevatorCompletions })],
  })
  return elevatorCompletions(new CompletionContext(state, doc.length, false)) as CompletionResult | null
}

function labels(doc: string) {
  return complete(doc)?.options.map((option) => option.label) ?? []
}

function applyOption(doc: string, label: string) {
  const result = complete(doc)!
  const option = result.options.find((candidate) => candidate.label === label) as Completion
  const view = new EditorView({ state: EditorState.create({ doc }) })
  ;(option.apply as (...args: unknown[]) => void)(view, option, result.from, doc.length)
  return view.state.doc.toString()
}

describe("autocomplete do editor", () => {
  it("sugere as funções do elevator depois de 'elevator.'", () => {
    expect(labels("def on_idle(elevator):\n    elevator.")).toEqual([
      "move_to",
      "current_floor",
      "target_floor",
      "direction",
      "is_idle",
      "min_floor",
      "max_floor",
      "id",
      "is_service",
      "fleet",
    ])
  })

  it("filtra as funções pelo prefixo digitado", () => {
    const result = complete("elevator.m")!
    expect(result.from).toBe("elevator.".length)
    expect(result.options.map((option) => option.label)).toContain("move_to")
  })

  it("insere move_to com o parâmetro selecionável e as demais funções com parênteses", () => {
    expect(applyOption("elevator.mo", "move_to")).toBe("elevator.move_to(floor)")
    expect(applyOption("elevator.cur", "current_floor")).toBe("elevator.current_floor()")
  })

  it("sugere os quatro handlers no início de uma linha", () => {
    expect(labels("on_")).toEqual(["on_call_button", "on_cabin_button", "on_stop", "on_idle"])
  })

  it("completa o handler inteiro com def e corpo quando digitado sozinho", () => {
    expect(applyOption("on_ca", "on_call_button")).toBe(
      "def on_call_button(elevator, floor, direction, service):\n    pass",
    )
  })

  it("completa só a assinatura quando 'def ' já foi digitado", () => {
    expect(applyOption("def on_i", "on_idle")).toBe("def on_idle(elevator):\n    pass")
  })

  it("não sugere handlers no meio de uma expressão", () => {
    expect(complete("x = on_")).toBeNull()
  })

  it("não sugere nada para outros objetos", () => {
    expect(complete("floors.")).toBeNull()
  })
})
