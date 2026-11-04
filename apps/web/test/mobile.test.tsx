import { EditorView } from "@codemirror/view"
import { act, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { button, fakeRuntime, renderApp } from "./helpers"

const tab = (name: string) => screen.getByRole("tab", { name })
const buildingPane = () => screen.getByTestId("cabin").closest("section")!
const editorPane = () => document.querySelector(".code-editor")!.closest("section")!
const editorView = () => EditorView.findFromDOM(document.querySelector(".cm-editor") as HTMLElement)!

function emulatePhone(isPhone: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: isPhone,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

beforeEach(() => emulatePhone(true))
afterEach(() => vi.unstubAllGlobals())

describe("layout de celular", () => {
  it("mostra uma seção por vez e troca pela navegação inferior", async () => {
    renderApp()
    expect(screen.getByRole("navigation", { name: "Seções" })).toBeInTheDocument()
    expect(tab("Prédio")).toHaveAttribute("aria-selected", "true")
    expect(buildingPane()).toBeVisible()
    expect(editorPane()).not.toBeVisible()

    await userEvent.click(tab("Código"))
    expect(editorPane()).toBeVisible()
    expect(buildingPane()).not.toBeVisible()

    await userEvent.click(tab("API"))
    expect(screen.getByText("move_to(floor)")).toBeVisible()
  })

  it("abre o painel Cenário ao escolher Meu cenário", async () => {
    renderApp()
    await userEvent.selectOptions(screen.getByLabelText("Cenário"), "Meu cenário")
    expect(tab("Cenário")).toHaveAttribute("aria-selected", "true")
    expect(screen.getByLabelText("Limite de tempo (s)")).toBeVisible()
  })

  it("leva ao prédio ao rodar e troca Rodar por Pausar enquanto roda", async () => {
    renderApp()
    await waitFor(() => expect(button(/Rodar/)).toBeEnabled())
    expect(screen.queryByRole("button", { name: /Pausar/ })).toBeNull()
    await userEvent.click(tab("Código"))

    await userEvent.click(button(/Rodar/))

    expect(buildingPane()).toBeVisible()
    expect(button(/Pausar/)).toBeEnabled()
    expect(screen.queryByRole("button", { name: /Rodar/ })).toBeNull()
  })

  it("leva do aviso de erro direto para a linha no código", async () => {
    const runtime = fakeRuntime()
    runtime.load = async () => ({ kind: "syntax", message: "sintaxe inválida", line: 3 })
    renderApp(runtime)
    await waitFor(() => expect(button(/Rodar/)).toBeEnabled())
    await userEvent.click(button(/Rodar/))
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("linha 3"))

    await userEvent.click(button("Ver linha 3"))

    expect(tab("Código")).toHaveAttribute("aria-selected", "true")
    expect(editorPane()).toBeVisible()
    const { state } = editorView()
    expect(state.doc.lineAt(state.selection.main.head).number).toBe(3)
  })

  it("insere símbolos e indenta pela barra de atalhos sem tirar o foco do editor", async () => {
    renderApp()
    await userEvent.click(tab("Código"))
    const view = editorView()
    act(() => {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: "x" }, selection: { anchor: 1 } })
      view.focus()
    })
    const bar = screen.getByRole("toolbar", { name: "Símbolos de código" })
    expect(bar).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: ":" }))
    await userEvent.click(button("Indentar"))

    expect(view.state.doc.toString()).toBe("    x:")
    expect(view.hasFocus).toBe(true)
  })
})

describe("layout de computador", () => {
  it("mantém as duas colunas, sem navegação inferior nem barra de atalhos", () => {
    emulatePhone(false)
    renderApp()
    expect(screen.queryByRole("navigation", { name: "Seções" })).toBeNull()
    expect(screen.queryByRole("toolbar", { name: "Símbolos de código" })).toBeNull()
    expect(buildingPane()).toBeVisible()
    expect(editorPane()).toBeVisible()
    expect(button(/Pausar/)).toBeDisabled()
  })
})

describe("área visível com o teclado", () => {
  const root = document.documentElement
  const appTop = () => root.style.getPropertyValue("--app-top")
  const appHeight = () => root.style.getPropertyValue("--app-height")

  function stubViewport(visibleHeight: number) {
    const viewport = Object.assign(new EventTarget(), { height: visibleHeight, offsetTop: 40, scale: 1 })
    vi.stubGlobal("visualViewport", viewport)
    vi.stubGlobal("innerHeight", 800)
    return viewport
  }

  it("não reposiciona o app enquanto o teclado está fechado, mesmo com a página quicando", () => {
    const viewport = stubViewport(800)
    renderApp()
    act(() => {
      viewport.offsetTop = -60
      viewport.dispatchEvent(new Event("scroll"))
    })
    expect(appTop()).toBe("")
    expect(appHeight()).toBe("")
  })

  it("acompanha a área visível com o teclado aberto e solta ao fechar", () => {
    const viewport = stubViewport(480)
    renderApp()
    expect(appHeight()).toBe("480px")
    expect(appTop()).toBe("40px")

    act(() => {
      viewport.height = 800
      viewport.dispatchEvent(new Event("resize"))
    })
    expect(appHeight()).toBe("")
    expect(appTop()).toBe("")
  })
})
