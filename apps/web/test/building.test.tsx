import { SCENARIOS, type Scenario, type SimulationState } from "@elevator/engine"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { avatarFromId, lookKey } from "../src/components/avatar/look"
import { Building } from "../src/components/building/Building"
import { REDUCED_WALK_MS, WALK_MS } from "../src/components/building/AvatarLayer"

type Passenger = SimulationState["passengers"][number]

const onTheWay = SCENARIOS.find((s) => s.id === "on-the-way")!

function snapshot(overrides: Partial<SimulationState> = {}): SimulationState {
  return {
    tick: 0,
    status: "running",
    elevator: { position: 0, direction: null, target_floor: null, doors_open: false },
    call_buttons: [],
    cabin_buttons: [],
    passengers: [],
    log: [],
    ...overrides,
  }
}

const show = (state: SimulationState, scenario: Scenario | null = onTheWay) => (
  <Building state={state} scenario={scenario} speed={1} interactive={false} directionalCalls={false} onPress={() => {}} />
)

const avatar = (id: string) => screen.getByTestId(`avatar-${id}`)

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("reduce"),
    addEventListener() {},
    removeEventListener() {},
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe("avatar", () => {
  it("é sempre o mesmo para o mesmo passageiro e varia entre passageiros", () => {
    expect(lookKey(avatarFromId("B"))).toBe(lookKey(avatarFromId("B")))
    const looks = new Set("ABCDEFGHIJ".split("").map((id) => lookKey(avatarFromId(id))))
    expect(looks.size).toBeGreaterThan(5)
  })

  it("mostra quem espera com o balão do destino e nome acessível", () => {
    const waiting: Passenger = { id: "B", from: 5, to: 9, state: "waiting" }
    render(show(snapshot({ tick: 40, passengers: [waiting], call_buttons: [{ floor: 5, direction: null }] })))
    const b = screen.getByRole("img", { name: "Passageiro B esperando, vai para 9" })
    expect(b).toHaveTextContent("→ 9")
    expect(b).toHaveAttribute("data-look", lookKey(avatarFromId("B")))
  })

  it("fica neutro depois de 15 s de espera e impaciente depois de 30 s", () => {
    const waiting: Passenger = { id: "A", from: 0, to: 10, state: "waiting" }
    const { rerender } = render(show(snapshot({ tick: 140, passengers: [waiting] })))
    expect(avatar("A")).toHaveAttribute("data-mood", "happy")
    rerender(show(snapshot({ tick: 150, passengers: [waiting] })))
    expect(avatar("A")).toHaveAttribute("data-mood", "neutral")
    rerender(show(snapshot({ tick: 300, passengers: [waiting] })))
    expect(avatar("A")).toHaveAttribute("data-mood", "angry")
  })
})

describe("embarque e desembarque", () => {
  const at = (p: Passenger["state"]): Passenger => ({ id: "A", from: 0, to: 7, state: p })

  it("caminha do andar até a cabine e, no destino, sai comemorando e some", () => {
    mockReducedMotion(false)
    const { rerender } = render(show(snapshot({ passengers: [at("waiting")] })))
    const queued = avatar("A").style.transform

    rerender(show(snapshot({ elevator: { position: 0, direction: null, target_floor: null, doors_open: true }, passengers: [at("riding")] })))
    expect(avatar("A")).toHaveAttribute("data-state", "riding")
    expect(avatar("A").style.transform).not.toBe(queued)
    expect(avatar("A").style.transition).toContain(`${WALK_MS}ms`)
    expect(screen.getByRole("img", { name: "Passageiro A a bordo, vai para 7" })).toBeInTheDocument()

    rerender(show(snapshot({ elevator: { position: 7, direction: null, target_floor: 7, doors_open: true }, passengers: [at("arrived")] })))
    expect(avatar("A")).toHaveAttribute("data-mood", "joy")
    expect(avatar("A")).toHaveAttribute("aria-hidden", "true")
    expect(screen.queryByRole("img", { name: /Passageiro A/ })).toBeNull()
  })

  it("com movimento reduzido troca de lugar numa transição curta", () => {
    mockReducedMotion(true)
    const { rerender } = render(show(snapshot({ passengers: [at("waiting")] })))
    rerender(show(snapshot({ elevator: { position: 0, direction: null, target_floor: null, doors_open: true }, passengers: [at("riding")] })))
    expect(avatar("A").style.transition).toContain(`${REDUCED_WALK_MS}ms`)
    expect(screen.getByTestId("cabin").closest(".building")).toHaveAttribute("data-motion", "reduced")
  })
})

describe("cabine", () => {
  it("mostra até 4 passageiros pela janela e um selo com o restante", () => {
    const riders: Passenger[] = "ABCDEF".split("").map((id) => ({ id, from: 0, to: 9, state: "riding" }))
    render(show(snapshot({ passengers: riders, cabin_buttons: [9] })))
    const visible = riders.filter((p) => avatar(p.id).getAttribute("opacity") === "1")
    expect(visible).toHaveLength(4)
    expect(screen.getByText("+2")).toBeInTheDocument()
    expect(screen.getByText("6 a bordo")).toBeInTheDocument()
  })

  it("abre as portas no ciclo de portas e fecha depois", () => {
    const doors = (open: boolean) => snapshot({ elevator: { position: 3, direction: null, target_floor: 3, doors_open: open } })
    const { rerender } = render(show(doors(false)))
    expect(screen.getByTestId("cabin")).toHaveAttribute("data-doors", "closed")
    rerender(show(doors(true)))
    expect(screen.getByTestId("cabin")).toHaveAttribute("data-doors", "open")
    rerender(show(doors(false)))
    expect(screen.getByTestId("cabin")).toHaveAttribute("data-doors", "closed")
  })
})
