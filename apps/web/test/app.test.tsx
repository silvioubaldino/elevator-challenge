import { EditorView } from "@codemirror/view"
import { TEMPLATE } from "@elevator/runtime-python"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { App } from "../src/App"
import { button, fakeClock, fakeRuntime, renderApp, type FakeClock } from "./helpers"

const editorText = () => document.querySelector(".cm-content")!.textContent ?? ""
const clockText = () => screen.getByLabelText("Tempo simulado").textContent
const cabinPosition = () => screen.getByTestId("cabin").getAttribute("data-position")

async function choose(scenario: string) {
  await userEvent.selectOptions(screen.getByLabelText("Cenário"), scenario)
}

async function advanceUntil(clock: FakeClock, done: () => boolean, stepMs = 1000) {
  for (let i = 0; i < 400 && !done(); i++) await clock.advance(stepMs)
  expect(done()).toBe(true)
}

const banner = () => screen.queryByText(/Concluído em|Tempo esgotado/)

async function playToEnd(speed: string) {
  const { clock, unmount } = renderApp()
  await choose("Parada no caminho")
  await userEvent.click(button(speed))
  await userEvent.click(button(/Rodar/))
  await advanceUntil(clock, () => banner() !== null)
  const text = banner()!.textContent
  unmount()
  return text
}

afterEach(() => vi.restoreAllMocks())

describe("tela inicial", () => {
  it("mostra o template, modo livre, elevador no térreo e libera Rodar só com o Python pronto", async () => {
    const runtime = fakeRuntime()
    render(<App createRuntime={() => runtime} clock={fakeClock()} />)

    expect(editorText()).toContain("def on_call_button")
    expect(screen.getByLabelText<HTMLSelectElement>("Cenário").selectedOptions[0]!.textContent).toBe(
      "Modo livre",
    )
    expect(cabinPosition()).toBe("0")
    expect(button(/Rodar/)).toBeDisabled()
    expect(screen.getByText("Carregando Python…")).toBeInTheDocument()

    runtime.makeReady()
    await waitFor(() => expect(button(/Rodar/)).toBeEnabled())
    expect(screen.queryByText("Carregando Python…")).toBeNull()
  })
})

describe("controles", () => {
  it("roda, congela ao pausar e volta ao início ao reiniciar usando o código atual", async () => {
    const { clock, runtime } = renderApp()
    await waitFor(() => expect(button(/Rodar/)).toBeEnabled())
    await choose("Parada no caminho")

    await userEvent.click(button(/Rodar/))
    await clock.advance(1000)
    expect(clockText()).toBe("1,0 s")

    await userEvent.click(button(/Pausar/))
    await clock.advance(1000)
    expect(clockText()).toBe("1,0 s")

    await userEvent.click(button(/Reiniciar/))
    expect(clockText()).toBe("0,0 s")
    expect(cabinPosition()).toBe("0")

    await userEvent.click(button(/Rodar/))
    await clock.advance(500)
    expect(runtime.loads).toHaveLength(2)
    expect(clockText()).toBe("0,5 s")
  })

  it("a 4× o relógio avança 4 s por segundo real e o resultado final é o mesmo de 1×", async () => {
    const { clock, unmount } = renderApp()
    await choose("Parada no caminho")
    await userEvent.click(button("4×"))
    await userEvent.click(button(/Rodar/))
    await clock.advance(1000)
    expect(clockText()).toBe("4,0 s")
    unmount()

    const fast = await playToEnd("4×")
    const slow = await playToEnd("1×")
    expect(fast).toMatch(/^Concluído em/)
    expect(fast).toBe(slow)
  })
})

describe("modo livre", () => {
  it("acende os botões clicados e registra os eventos", async () => {
    const { clock } = renderApp()
    await userEvent.click(button(/Rodar/))
    await userEvent.click(button("Chamar no andar 6"))
    await userEvent.click(button("Ir ao andar 2"))
    await clock.advance(300)

    expect(button("Chamar no andar 6")).toHaveAttribute("aria-pressed", "true")
    expect(button("Ir ao andar 2")).toHaveAttribute("aria-pressed", "true")

    await userEvent.click(screen.getByRole("tab", { name: "Eventos" }))
    expect(screen.getByText(/call_button\(6\)/)).toBeInTheDocument()
    expect(screen.getByText(/cabin_button\(2\)/)).toBeInTheDocument()
  })

  it("desabilita os botões quando há um cenário selecionado", async () => {
    renderApp()
    await choose("Parada no caminho")
    expect(button("Chamar no andar 6")).toBeDisabled()
  })
})

describe("cenário", () => {
  it("mostra o passageiro esperando, entrando na cabine e sumindo ao chegar", async () => {
    const { clock } = renderApp()
    await choose("Parada no caminho")
    await userEvent.click(button("4×"))
    await userEvent.click(button(/Rodar/))

    const waitingB = () => screen.queryByRole("img", { name: "Passageiro B esperando, vai para 9" })
    await advanceUntil(clock, () => waitingB() !== null, 100)
    expect(screen.getByText(/1 a bordo/)).toBeInTheDocument()

    await advanceUntil(clock, () => waitingB() === null)
    await advanceUntil(clock, () => banner() !== null)
    expect(screen.getByText(/0 a bordo/)).toBeInTheDocument()
  })

  it("mostra o tempo total ao concluir", async () => {
    const { clock } = renderApp()
    await choose("Parada no caminho")
    await userEvent.click(button("4×"))
    await userEvent.click(button(/Rodar/))
    await advanceUntil(clock, () => banner() !== null)
    expect(banner()!.textContent).toMatch(/^Concluído em \d+,\d s$/)
  })

  it("mostra quem não chegou quando o tempo esgota", async () => {
    const { clock } = renderApp(fakeRuntime(() => []))
    await choose("Primeira viagem")
    await userEvent.click(button("4×"))
    await userEvent.click(button(/Rodar/))
    await advanceUntil(clock, () => banner() !== null)
    expect(banner()!.textContent).toMatch(/^Tempo esgotado\. Não chegaram: /)
  })
})

describe("erro do aluno", () => {
  it("para a simulação, mostra a mensagem e destaca a linha no editor", async () => {
    const runtime = fakeRuntime(() => [], { kind: "exception", message: "boom", line: 7 })
    const { clock } = renderApp(runtime)
    await choose("Parada no caminho")
    await userEvent.click(button(/Rodar/))
    await clock.advance(500)

    expect(screen.getByRole("alert").textContent).toContain("boom")
    expect(screen.getByRole("alert").textContent).toContain("linha 7")
    const lines = [...document.querySelectorAll(".cm-line")]
    expect(lines[6]).toHaveClass("cm-error-line")

    const frozen = clockText()
    await clock.advance(1000)
    expect(clockText()).toBe(frozen)
  })

  it("mostra erro de carga com a linha", async () => {
    const runtime = fakeRuntime()
    runtime.load = async () => ({ kind: "syntax", message: "sintaxe inválida", line: 3 })
    renderApp(runtime)
    await userEvent.click(button(/Rodar/))
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("linha 3"))
  })
})

describe("código salvo", () => {
  function type(code: string) {
    const content = document.querySelector<HTMLElement>(".cm-content")!
    const view = EditorView.findFromDOM(content)!
    act(() => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } }))
  }

  it("restaura o código editado ao recarregar", () => {
    const first = renderApp()
    type("def on_idle(elevator):\n    pass\n")
    first.unmount()

    renderApp()
    expect(editorText()).toContain("def on_idle")
    expect(editorText()).not.toContain("on_call_button")
  })

  it("só restaura o template depois de confirmar", async () => {
    renderApp()
    type("x = 1")
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true)

    await userEvent.click(button("Restaurar template"))
    expect(editorText()).toBe("x = 1")

    await userEvent.click(button("Restaurar template"))
    expect(confirm).toHaveBeenCalledTimes(2)
    expect(editorText()).toContain("def on_call_button")
    expect(localStorage.getItem("elevator-challenge:code")).toBe(TEMPLATE)
  })

  it("funciona quando o navegador bloqueia o armazenamento", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado")
    })
    renderApp()
    expect(editorText()).toContain("def on_call_button")
    type("x = 1")
    expect(editorText()).toBe("x = 1")
  })
})

describe("textos em português", () => {
  it("rotula controles, abas e andares em PT-BR com o térreo como T", async () => {
    renderApp()
    for (const name of [/Rodar/, /Pausar/, /Reiniciar/, "Restaurar template"]) {
      expect(button(name)).toBeInTheDocument()
    }
    for (const name of ["Código", "Enunciado", "API", "Saída", "Eventos"]) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument()
    }
    expect(button("Chamar no andar T")).toBeInTheDocument()
    expect(button("Ir ao andar T")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("tab", { name: "Enunciado" }))
    expect(screen.getByText(/Sem cenário/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("tab", { name: "API" }))
    expect(screen.getByText("move_to(floor)")).toBeInTheDocument()
  })
})
