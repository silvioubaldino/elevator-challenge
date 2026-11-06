import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { button, renderApp } from "./helpers"

const toggle = () => screen.getByRole("checkbox", { name: "Botões subir/descer" })

describe("botões subir/descer", () => {
  it("começa desligado, com um botão de chamar por andar", () => {
    renderApp()
    expect(toggle()).not.toBeChecked()
    expect(button("Chamar no andar 6")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /para subir/ })).toBeNull()
  })

  it("ligado, mostra subir e descer em cada andar, menos descer no T e subir no 10", async () => {
    renderApp()
    await userEvent.click(toggle())

    expect(button("Chamar para subir no andar 6")).toBeInTheDocument()
    expect(button("Chamar para descer no andar 6")).toBeInTheDocument()
    expect(button("Chamar para subir no andar T")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Chamar para descer no andar T" })).toBeNull()
    expect(button("Chamar para descer no andar 10")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Chamar para subir no andar 10" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Chamar no andar 6" })).toBeNull()
  })

  it("no modo livre acende só o botão clicado e registra a direção", async () => {
    const { clock } = renderApp()
    await userEvent.click(toggle())
    await userEvent.click(button(/Rodar/))
    await userEvent.click(button("Chamar para descer no andar 6"))
    await clock.advance(300)

    expect(button("Chamar para descer no andar 6")).toHaveAttribute("aria-pressed", "true")
    expect(button("Chamar para subir no andar 6")).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(screen.getByRole("tab", { name: "Eventos" }))
    expect(screen.getByText(/call_button\(6, down\)/)).toBeInTheDocument()
  })

  it("a escolha sobrevive ao recarregar", async () => {
    const first = renderApp()
    await userEvent.click(toggle())
    first.unmount()

    renderApp()
    expect(toggle()).toBeChecked()
    expect(button("Chamar para subir no andar 6")).toBeInTheDocument()
  })

  it("fica desabilitado enquanto a simulação roda", async () => {
    renderApp()
    await userEvent.click(button(/Rodar/))
    expect(toggle()).toBeDisabled()
    await userEvent.click(button(/Pausar/))
    expect(toggle()).toBeDisabled()
    await userEvent.click(button(/Reiniciar/))
    expect(toggle()).toBeEnabled()
  })
})
