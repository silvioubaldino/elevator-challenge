import {
  createEngine,
  TICK_MS,
  type Engine,
  type Runtime,
  type Scenario,
  type SimulationState,
} from "@elevator/engine"

export type Speed = 1 | 2 | 4
export type Phase = "ready" | "running" | "paused" | "finished"

export type Clock = {
  now(): number
  nextFrame(): Promise<void>
}

export const browserClock: Clock = {
  now: () => performance.now(),
  nextFrame: () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
}

export type SimulationView = {
  phase: Phase
  state: SimulationState
  scenario: Scenario | null
}

export type SimulationOptions = {
  runtime: Runtime
  clock?: Clock
  onChange(view: SimulationView): void
}

export type Simulation = {
  select(scenario: Scenario | null): void
  run(code: string): Promise<void>
  pause(): void
  restart(): void
  press(kind: "call" | "cabin", floor: number): void
  setSpeed(speed: Speed): void
  view(): SimulationView
  dispose(): void
}

export function createSimulation({
  runtime,
  clock = browserClock,
  onChange,
}: SimulationOptions): Simulation {
  let scenario: Scenario | null = null
  let engine: Engine = createEngine({ runtime, scenario: scenario ?? undefined })
  let phase: Phase = "ready"
  let speed: Speed = 1
  let epoch = 0
  let latest = engine.state()

  const view = (): SimulationView => ({ phase, state: latest, scenario })

  function publish() {
    onChange(view())
  }

  function reset() {
    epoch += 1
    engine = createEngine({ runtime, scenario: scenario ?? undefined })
    latest = engine.state()
    phase = "ready"
    publish()
  }

  function failWith(error: NonNullable<SimulationState["error"]>) {
    latest = {
      ...latest,
      status: "error",
      error,
      log: [
        ...latest.log,
        {
          tick: latest.tick,
          kind: "error",
          text: `${error.message}${error.line === undefined ? "" : ` (linha ${error.line})`}`,
        },
      ],
    }
    phase = "finished"
    publish()
  }

  async function pump() {
    const mine = epoch
    let last = clock.now()
    let owed = 0
    while (mine === epoch && phase === "running") {
      await clock.nextFrame()
      const current = clock.now()
      owed += (current - last) * speed
      last = current
      while (owed >= TICK_MS && mine === epoch && phase === "running") {
        owed -= TICK_MS
        const next = await engine.step()
        if (mine !== epoch) return
        latest = next
        if (next.status !== "running") phase = "finished"
        publish()
      }
    }
  }

  return {
    select(next) {
      scenario = next
      reset()
    },
    async run(code) {
      if (phase === "running") return
      if (phase === "paused") {
        phase = "running"
        publish()
        return pump()
      }
      if (phase === "finished") reset()
      const mine = epoch
      const error = await runtime.load(code)
      if (mine !== epoch) return
      if (error) return failWith(error)
      phase = "running"
      publish()
      return pump()
    },
    pause() {
      if (phase !== "running") return
      epoch += 1
      phase = "paused"
      publish()
    },
    restart: reset,
    press(kind, floor) {
      engine.press(kind, floor)
    },
    setSpeed(next) {
      speed = next
    },
    view,
    dispose() {
      epoch += 1
      runtime.dispose()
    },
  }
}
