import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { button, renderApp } from "./helpers"

const count = () => screen.getByRole("combobox", { name: "Elevadores" })
const serviceToggle = (n: number) => screen.getByRole("checkbox", { name: `Elevador ${n} de serviço` })

describe("frota de elevadores", () => {
  it("começa com um elevador, sem opção de serviço nem abas de cabine", () => {
    renderApp()
    expect(count()).toHaveValue("1")
    expect(screen.queryByRole("checkbox", { name: /de serviço/ })).toBeNull()
    expect(screen.queryByRole("tab", { name: /Elevador 1/ })).toBeNull()
    expect(screen.getAllByTestId("cabin")).toHaveLength(1)
  })

  it("com dois elevadores mostra duas cabines, abas no painel e a opção de serviço do segundo", async () => {
    renderApp()
    await userEvent.selectOptions(count(), "2")
    expect(screen.getByTestId("cabin")).toBeInTheDocument()
    expect(screen.getByTestId("cabin-1")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Elevador 1" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Elevador 2" })).toBeInTheDocument()
    expect(serviceToggle(2)).not.toBeChecked()
    expect(screen.queryByRole("checkbox", { name: "Elevador 1 de serviço" })).toBeNull()
    expect(screen.queryByRole("button", { name: /\(serviço\)/ })).toBeNull()
  })

  it("elevador de serviço ganha seu botão de chamar em cada andar", async () => {
    renderApp()
    await userEvent.selectOptions(count(), "2")
    await userEvent.click(serviceToggle(2))
    expect(button("Chamar no andar 6")).toBeInTheDocument()
    expect(button("Chamar no andar 6 (serviço)")).toBeInTheDocument()
    expect(screen.getByTestId("cabin-1")).toHaveAttribute("data-service", "true")
  })

  it("no modo livre o botão de serviço gera o evento com o tipo e o painel acende no elevador escolhido", async () => {
    const { clock } = renderApp()
    await userEvent.selectOptions(count(), "2")
    await userEvent.click(serviceToggle(2))
    await userEvent.click(button(/Rodar/))
    await userEvent.click(button("Chamar no andar 6 (serviço)"))
    await userEvent.click(screen.getByRole("tab", { name: "Elevador 2 (S)" }))
    await userEvent.click(button("Ir ao andar 4"))
    await clock.advance(300)

    expect(button("Chamar no andar 6 (serviço)")).toHaveAttribute("aria-pressed", "true")
    expect(button("Chamar no andar 6")).toHaveAttribute("aria-pressed", "false")
    expect(button("Ir ao andar 4")).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(screen.getByRole("tab", { name: "Elevador 1" }))
    expect(button("Ir ao andar 4")).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(screen.getByRole("tab", { name: "Eventos" }))
    expect(screen.getByText(/call_button\(6, serviço\)/)).toBeInTheDocument()
  })

  it("a escolha sobrevive ao recarregar", async () => {
    const first = renderApp()
    await userEvent.selectOptions(count(), "3")
    await userEvent.click(serviceToggle(3))
    first.unmount()

    renderApp()
    expect(count()).toHaveValue("3")
    expect(serviceToggle(3)).toBeChecked()
    expect(serviceToggle(2)).not.toBeChecked()
  })

  it("fica desabilitado enquanto a simulação roda", async () => {
    renderApp()
    await userEvent.selectOptions(count(), "2")
    await userEvent.click(button(/Rodar/))
    expect(count()).toBeDisabled()
    expect(serviceToggle(2)).toBeDisabled()
    await userEvent.click(button(/Reiniciar/))
    expect(count()).toBeEnabled()
  })

  it("no editor de cenário, passageiro de serviço só existe com elevador de serviço", async () => {
    renderApp()
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Cenário" }), "custom")
    expect(screen.queryByRole("checkbox", { name: "Passageiro A: de serviço" })).toBeNull()

    await userEvent.selectOptions(count(), "2")
    await userEvent.click(serviceToggle(2))
    const passenger = screen.getByRole("checkbox", { name: "Passageiro A: de serviço" })
    await userEvent.click(passenger)
    expect(passenger).toBeChecked()

    await userEvent.click(serviceToggle(2))
    expect(screen.queryByRole("checkbox", { name: "Passageiro A: de serviço" })).toBeNull()
    await userEvent.click(button(/Rodar/))
    expect(screen.queryByRole("alert")).toBeNull()
  })
})
