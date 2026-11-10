import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { DEMO_SCENARIO } from "../src/demo"
import solution from "../src/demo/solution.py?raw"
import { button, renderApp } from "./helpers"

const count = () => screen.getByRole("combobox", { name: "Elevadores" })
const directionalToggle = () => screen.getByRole("checkbox", { name: "Botões subir/descer" })
const scenarioSelect = () => screen.getByRole("combobox", { name: "Cenário" })
const editorText = () => document.querySelector(".cm-content")!.textContent ?? ""

async function startDemo() {
  const rendered = renderApp()
  await userEvent.click(button("Demo"))
  await waitFor(() => expect(rendered.runtime.loads).toHaveLength(1))
  return rendered
}

describe("demo", () => {
  it("o botão Demo fica junto de Rodar, Pausar e Reiniciar", () => {
    renderApp()
    const transport = button("Demo").parentElement!
    expect(transport).toContainElement(button(/Rodar/))
    expect(transport).toContainElement(button(/Pausar/))
    expect(transport).toContainElement(button(/Reiniciar/))
  })

  it("um clique prepara 3 elevadores, botões subir/descer e serviço, e começa a rodar", async () => {
    await startDemo()
    expect(count()).toHaveValue("3")
    expect(directionalToggle()).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Elevador 3 de serviço" })).toBeChecked()
    expect(screen.getAllByTestId(/^cabin/)).toHaveLength(3)
    expect(button("Chamar para subir no andar 5")).toBeInTheDocument()
    expect(button("Chamar para descer no andar 5 (serviço)")).toBeInTheDocument()
    expect(button(/Pausar/)).toBeEnabled()
    expect(button("Demo")).toHaveAttribute("aria-pressed", "true")
  })

  it("carrega a solução oculta e deixa o código do aluno intacto", async () => {
    localStorage.setItem("elevator-challenge:code", "# código do aluno")
    const { runtime } = await startDemo()
    expect(runtime.loads[0]).toBe(solution)
    expect(editorText()).toContain("# código do aluno")
    expect(localStorage.getItem("elevator-challenge:code")).toBe("# código do aluno")
    expect(screen.queryByText(/def choose_target/)).toBeNull()
    expect(screen.getByRole("heading", { name: DEMO_SCENARIO.title })).toBeInTheDocument()
  })

  it("frota e botões subir/descer ficam travados no Demo", async () => {
    await startDemo()
    expect(count()).toBeDisabled()
    expect(directionalToggle()).toBeDisabled()
  })

  it("sair do Demo restaura a escolha do aluno e não persiste o Demo", async () => {
    const first = renderApp()
    await userEvent.click(button("Demo"))
    await waitFor(() => expect(first.runtime.loads).toHaveLength(1))
    await userEvent.selectOptions(scenarioSelect(), "first-ride")
    expect(count()).toHaveValue("1")
    expect(directionalToggle()).not.toBeChecked()
    expect(screen.getAllByTestId(/^cabin/)).toHaveLength(1)
    first.unmount()

    renderApp()
    expect(scenarioSelect()).toHaveValue("sandbox")
    expect(count()).toHaveValue("1")
  })

  it("reiniciar e rodar no Demo carrega a solução oculta de novo", async () => {
    const { runtime } = await startDemo()
    await userEvent.click(button(/Reiniciar/))
    await userEvent.click(button(/Rodar/))
    await waitFor(() => expect(runtime.loads).toHaveLength(2))
    expect(runtime.loads[1]).toBe(solution)
  })
})
