import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { button, fakeRuntime, renderApp, type FakeClock } from "./helpers"

const clockText = () => screen.getByLabelText("Tempo simulado").textContent
const rows = () => within(screen.getByRole("list", { name: "Passageiros do cenário" })).getAllByRole("listitem")
const row = (id: string) => screen.getByTestId(`scenario-row-${id}`)
const banner = () => screen.queryByText(/Concluído em|Tempo esgotado/)

const appearsAt = (id: string) => screen.getByLabelText(`Passageiro ${id}: aparece em (s)`)
const fromFloor = (id: string) => screen.getByLabelText<HTMLSelectElement>(`Passageiro ${id}: de`)
const toFloor = (id: string) => screen.getByLabelText<HTMLSelectElement>(`Passageiro ${id}: para`)
const timeLimit = () => screen.getByLabelText("Limite de tempo (s)")

async function openEditor(renderer = renderApp) {
  const app = renderer()
  await userEvent.selectOptions(screen.getByLabelText("Cenário"), "Meu cenário")
  return app
}

async function typeNumber(input: HTMLElement, text: string) {
  await userEvent.clear(input)
  await userEvent.type(input, text)
  await userEvent.tab()
}

async function advanceUntil(clock: FakeClock, done: () => boolean, stepMs = 1000) {
  for (let i = 0; i < 400 && !done(); i++) await clock.advance(stepMs)
  expect(done()).toBe(true)
}

const optionLabels = (select: HTMLSelectElement) => Array.from(select.options).map((o) => o.textContent)

describe("editor de cenário", () => {
  it("abre com uma pessoa A em 0 s, do térreo ao 5, e limite de 120 s", async () => {
    await openEditor()

    expect(screen.getByRole("tab", { name: "Cenário" })).toHaveAttribute("aria-selected", "true")
    expect(rows()).toHaveLength(1)
    expect(within(row("A")).getByText("A")).toBeInTheDocument()
    expect(row("A").querySelector("svg")).not.toBeNull()
    expect(appearsAt("A")).toHaveValue(0)
    expect(fromFloor("A").selectedOptions[0]!.textContent).toBe("T")
    expect(toFloor("A").selectedOptions[0]!.textContent).toBe("5")
    expect(timeLimit()).toHaveValue(120)
  })

  it("adiciona a pessoa B com avatar próprio, 2 s depois, do térreo ao 5", async () => {
    await openEditor()
    await userEvent.click(button("+ Adicionar pessoa"))

    expect(rows()).toHaveLength(2)
    expect(appearsAt("B")).toHaveValue(2)
    expect(fromFloor("B").value).toBe("0")
    expect(toFloor("B").value).toBe("5")
    expect(row("B").querySelector("svg")!.innerHTML).not.toBe(row("A").querySelector("svg")!.innerHTML)
  })

  it("remove uma pessoa e impede remover a última", async () => {
    await openEditor()
    await userEvent.click(button("+ Adicionar pessoa"))
    expect(button("Remover passageiro A")).toBeEnabled()

    await userEvent.click(button("Remover passageiro A"))

    expect(screen.queryByTestId("scenario-row-A")).toBeNull()
    expect(row("B")).toBeInTheDocument()
    expect(button("Remover passageiro B")).toBeDisabled()
  })

  it("nunca deixa origem e destino iguais", async () => {
    await openEditor()
    expect(optionLabels(toFloor("A"))).not.toContain("T")

    await userEvent.selectOptions(fromFloor("A"), "5")

    expect(fromFloor("A").selectedOptions[0]!.textContent).toBe("5")
    expect(toFloor("A").selectedOptions[0]!.textContent).toBe("T")
    expect(optionLabels(toFloor("A"))).not.toContain("5")
  })

  it("arredonda o instante para 0,1 s e limita ao limite de tempo", async () => {
    await openEditor()
    await typeNumber(appearsAt("A"), "2.26")
    expect(appearsAt("A")).toHaveValue(2.3)

    await typeNumber(appearsAt("A"), "999")
    expect(appearsAt("A")).toHaveValue(120)
  })

  it("roda o cenário montado: a pessoa espera no andar escolhido e o evento aparece", async () => {
    const { clock } = await openEditor()
    await userEvent.click(button("+ Adicionar pessoa"))
    await typeNumber(appearsAt("B"), "3")
    await userEvent.selectOptions(fromFloor("B"), "6")
    await userEvent.selectOptions(toFloor("B"), "T")

    await userEvent.click(button(/Rodar/))
    await clock.advance(3500)

    expect(screen.getByRole("img", { name: "Passageiro B esperando, vai para T" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("tab", { name: "Eventos" }))
    expect(screen.getByText(/call_button\(6\)/)).toBeInTheDocument()
  })

  it("congela o painel enquanto a simulação roda ou está pausada", async () => {
    const { clock } = await openEditor()
    await userEvent.click(button(/Rodar/))
    await clock.advance(500)

    for (const control of [appearsAt("A"), fromFloor("A"), toFloor("A"), timeLimit()]) {
      expect(control).toBeDisabled()
    }
    expect(button("+ Adicionar pessoa")).toBeDisabled()
    expect(button("Remover passageiro A")).toBeDisabled()

    await userEvent.click(button(/Pausar/))
    expect(appearsAt("A")).toBeDisabled()
    expect(button("+ Adicionar pessoa")).toBeDisabled()

    await userEvent.click(button(/Reiniciar/))
    expect(appearsAt("A")).toBeEnabled()
    expect(button("+ Adicionar pessoa")).toBeEnabled()
  })

  it("congela os botões do prédio e não gera evento ao clicar", async () => {
    const { clock } = await openEditor()
    await userEvent.click(button(/Rodar/))
    await clock.advance(500)

    expect(button("Chamar no andar 6")).toBeDisabled()
    expect(button("Ir ao andar 2")).toBeDisabled()
    await userEvent.click(button("Chamar no andar 6"))
    await userEvent.click(button("Ir ao andar 2"))
    await clock.advance(300)

    await userEvent.click(screen.getByRole("tab", { name: "Eventos" }))
    expect(screen.queryByText(/call_button\(6\)/)).toBeNull()
    expect(screen.queryByText(/cabin_button\(2\)/)).toBeNull()
  })

  it("editar depois do fim zera o aviso, o relógio e o elevador", async () => {
    const { clock } = await openEditor(() => renderApp(fakeRuntime(() => [])))
    await typeNumber(timeLimit(), "3")
    await userEvent.click(button("4×"))
    await userEvent.click(button(/Rodar/))
    await advanceUntil(clock, () => banner() !== null)
    expect(banner()!.textContent).toMatch(/^Tempo esgotado/)

    await userEvent.selectOptions(toFloor("A"), "8")

    expect(banner()).toBeNull()
    expect(clockText()).toBe("0,0 s")
    expect(screen.getByTestId("cabin").getAttribute("data-position")).toBe("0")
  })

  it("guarda a lista e o limite no navegador", async () => {
    const first = await openEditor()
    await userEvent.click(button("+ Adicionar pessoa"))
    await userEvent.click(button("+ Adicionar pessoa"))
    await userEvent.selectOptions(toFloor("C"), "9")
    await typeNumber(timeLimit(), "90")
    first.unmount()

    await openEditor()

    expect(rows()).toHaveLength(3)
    expect(toFloor("C").value).toBe("9")
    expect(appearsAt("C")).toHaveValue(4)
    expect(timeLimit()).toHaveValue(90)
  })

  it("ignora dado salvo inválido e volta ao cenário inicial", async () => {
    localStorage.setItem(
      "elevator-challenge:custom-scenario",
      JSON.stringify({ time_limit_s: 30, passengers: [{ id: "A", at_s: 0, from: 4, to: 4 }] }),
    )

    await openEditor()

    expect(rows()).toHaveLength(1)
    expect(toFloor("A").value).toBe("5")
    expect(timeLimit()).toHaveValue(120)
  })

  it("volta a mostrar o enunciado ao sair do modo", async () => {
    await openEditor()
    await userEvent.selectOptions(screen.getByLabelText("Cenário"), "Parada no caminho")

    expect(screen.getByRole("tab", { name: "Enunciado" })).toBeInTheDocument()
    expect(screen.queryByTestId("scenario-row-A")).toBeNull()
  })
})
