import { SCENARIOS } from "@elevator/engine"
import { createPythonRuntime, TEMPLATE, type PythonRuntime } from "@elevator/runtime-python"
import { useCallback, useEffect, useRef, useState } from "react"
import { ApiReference } from "./components/ApiReference"
import { Building } from "./components/building/Building"
import { CodeEditor } from "./components/CodeEditor"
import { Console } from "./components/Console"
import { Controls, FREE_MODE } from "./components/Controls"
import { t } from "./i18n/pt-BR"
import { createSimulation, type Clock, type Simulation, type Speed } from "./simulation"
import { loadSavedCode, saveCode } from "./storage"

type LeftTab = "code" | "statement" | "api"
type PythonStatus = "loading" | "ready" | "failed"

export type AppProps = {
  createRuntime?: () => PythonRuntime
  clock?: Clock
}

const MIN_LEFT_PX = 280

export function App({ createRuntime = createPythonRuntime, clock }: AppProps) {
  const [code, setCode] = useState(() => loadSavedCode() ?? TEMPLATE)
  const [scenarioId, setScenarioId] = useState(FREE_MODE)
  const [speed, setSpeed] = useState<Speed>(1)
  const [leftTab, setLeftTab] = useState<LeftTab>("code")
  const [leftWidth, setLeftWidth] = useState(520)
  const [python, setPython] = useState<PythonStatus>("loading")
  const runtimeRef = useRef<PythonRuntime | null>(null)
  const simulationRef = useRef<Simulation | null>(null)

  const [view, setView] = useState(() => {
    runtimeRef.current = createRuntime()
    simulationRef.current = createSimulation({
      runtime: runtimeRef.current,
      clock,
      onChange: (next) => setView(next),
    })
    return simulationRef.current.view()
  })
  const simulation = simulationRef.current!

  useEffect(() => {
    runtimeRef.current!.ready().then(
      () => setPython("ready"),
      () => setPython("failed"),
    )
    return () => simulation.dispose()
  }, [simulation])

  const updateCode = useCallback((next: string) => {
    setCode(next)
    saveCode(next)
  }, [])

  const restoreTemplate = () => {
    if (window.confirm(t.confirmRestore)) updateCode(TEMPLATE)
  }

  const chooseScenario = (id: string) => {
    setScenarioId(id)
    simulation.select(SCENARIOS.find((s) => s.id === id) ?? null)
  }

  const chooseSpeed = (next: Speed) => {
    setSpeed(next)
    simulation.setSpeed(next)
  }

  const startDrag = (event: React.PointerEvent) => {
    const startX = event.clientX
    const startWidth = leftWidth
    const move = (e: PointerEvent) =>
      setLeftWidth(Math.max(MIN_LEFT_PX, startWidth + e.clientX - startX))
    const stop = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", stop)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", stop)
  }

  const { state, scenario, phase } = view
  const error = state.error
  const errorLine = error?.line ?? null
  const notArrived = state.passengers.filter((p) => p.state !== "arrived").map((p) => p.id)

  return (
    <div className="app">
      <Controls
        phase={phase}
        pythonReady={python === "ready"}
        pythonFailed={python === "failed"}
        scenarioId={scenarioId}
        speed={speed}
        tick={state.tick}
        onScenario={chooseScenario}
        onRun={() => void simulation.run(code)}
        onPause={() => simulation.pause()}
        onRestart={() => simulation.restart()}
        onSpeed={chooseSpeed}
      />
      <main className="columns">
        <section className="left" style={{ width: leftWidth }}>
          <div role="tablist" className="tabs">
            {(["code", "statement", "api"] as const).map((id) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={leftTab === id}
                onClick={() => setLeftTab(id)}
              >
                {t.tabs[id]}
              </button>
            ))}
          </div>
          <div className="left-body" hidden={leftTab !== "code"}>
            <CodeEditor value={code} errorLine={errorLine} onChange={updateCode} />
            <button type="button" className="restore" onClick={restoreTemplate}>
              {t.restoreTemplate}
            </button>
          </div>
          {leftTab === "statement" && (
            <div className="doc" role="tabpanel">
              <h2>{scenario?.title ?? t.freeMode}</h2>
              <p>{scenario?.description ?? t.freeModeStatement}</p>
            </div>
          )}
          {leftTab === "api" && (
            <div role="tabpanel">
              <ApiReference />
            </div>
          )}
        </section>
        <div className="splitter" role="separator" aria-orientation="vertical" onPointerDown={startDrag} />
        <section className="right">
          {error && (
            <div className="banner error" role="alert">
              <strong>{t.errorTitle}</strong>: {error.message}
              {errorLine !== null && <> ({t.errorAtLine(errorLine)})</>}
            </div>
          )}
          {state.status === "success" && (
            <div className="banner success" role="status">
              {t.success(t.seconds(state.tick))}
            </div>
          )}
          {state.status === "timeout" && (
            <div className="banner error" role="status">
              {t.timeout}. {t.notArrived(notArrived.join(", "))}
            </div>
          )}
          <Building
            state={state}
            scenario={scenario}
            speed={speed}
            interactive={scenario === null}
            onPress={(kind, floor) => simulation.press(kind, floor)}
          />
          <Console log={state.log} />
        </section>
      </main>
    </div>
  )
}
