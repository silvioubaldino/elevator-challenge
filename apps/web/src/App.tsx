import { SCENARIOS, type FleetSpec, type Scenario } from "@elevator/engine"
import { createPythonRuntime, TEMPLATE, type PythonRuntime } from "@elevator/runtime-python"
import { useCallback, useEffect, useRef, useState } from "react"
import { ApiReference } from "./components/ApiReference"
import { Building } from "./components/building/Building"
import { CodeEditor, type CodeEditorHandle } from "./components/CodeEditor"
import { Console } from "./components/Console"
import { Controls, CUSTOM_MODE, DEMO_MODE, FREE_MODE } from "./components/Controls"
import { SectionNav } from "./components/SectionNav"
import { ScenarioEditor } from "./components/ScenarioEditor"
import { DEMO_FLEET, DEMO_SCENARIO, loadDemoSolution } from "./demo"
import { hasServiceElevator, initialCustomScenario, toScenario, type CustomScenario } from "./customScenario"
import { t } from "./i18n/pt-BR"
import { createSimulation, type Clock, type Simulation, type Speed } from "./simulation"
import {
  loadCustomScenario,
  loadDirectionalCalls,
  loadFleet,
  loadSavedCode,
  saveCode,
  saveCustomScenario,
  saveDirectionalCalls,
  saveFleet,
} from "./storage"
import { useCompactLayout, useVisibleViewportHeight } from "./viewport"

export type LeftTab = "code" | "statement" | "api"
type PythonStatus = "loading" | "ready" | "failed"

export type AppProps = {
  createRuntime?: () => PythonRuntime
  clock?: Clock
}

const MIN_LEFT_PX = 280

export function App({ createRuntime = createPythonRuntime, clock }: AppProps) {
  const [code, setCode] = useState(() => loadSavedCode() ?? TEMPLATE)
  const [scenarioId, setScenarioId] = useState(FREE_MODE)
  const [custom, setCustom] = useState<CustomScenario>(() => loadCustomScenario() ?? initialCustomScenario())
  const [speed, setSpeed] = useState<Speed>(1)
  const [directionalCalls, setDirectionalCalls] = useState(loadDirectionalCalls)
  const [fleet, setFleet] = useState<FleetSpec>(loadFleet)
  const [leftTab, setLeftTab] = useState<LeftTab>("code")
  const [leftWidth, setLeftWidth] = useState(520)
  const [showBuilding, setShowBuilding] = useState(true)
  const [revealLine, setRevealLine] = useState<number | null>(null)
  const compact = useCompactLayout()
  useVisibleViewportHeight()
  const editorRef = useRef<CodeEditorHandle>(null)
  const [python, setPython] = useState<PythonStatus>("loading")
  const runtimeRef = useRef<PythonRuntime | null>(null)
  const simulationRef = useRef<Simulation | null>(null)

  const [view, setView] = useState(() => {
    runtimeRef.current = createRuntime()
    simulationRef.current = createSimulation({
      runtime: runtimeRef.current,
      clock,
      directionalCalls,
      fleet,
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

  useEffect(() => {
    if (revealLine === null) return
    editorRef.current?.reveal(revealLine)
    setRevealLine(null)
  }, [revealLine])

  const openLeftTab = (tab: LeftTab) => {
    setLeftTab(tab)
    setShowBuilding(false)
  }

  const updateCode = useCallback((next: string) => {
    setCode(next)
    saveCode(next)
  }, [])

  const restoreTemplate = () => {
    if (window.confirm(t.confirmRestore)) updateCode(TEMPLATE)
  }

  const leaveDemo = (next: Scenario | null) => {
    simulation.setDirectionalCalls(directionalCalls)
    simulation.setFleet(fleet, next)
  }

  const chooseScenario = (id: string) => {
    const leaving = scenarioId === DEMO_MODE
    setScenarioId(id)
    if (leaving) {
      leaveDemo(id === CUSTOM_MODE ? toScenario(custom, fleet) : (SCENARIOS.find((s) => s.id === id) ?? null))
      if (id === CUSTOM_MODE) openLeftTab("statement")
      return
    }
    if (id === CUSTOM_MODE) {
      openLeftTab("statement")
      simulation.select(toScenario(custom, fleet))
      return
    }
    simulation.select(SCENARIOS.find((s) => s.id === id) ?? null)
  }

  const editCustom = (next: CustomScenario) => {
    setCustom(next)
    saveCustomScenario(next)
    simulation.select(toScenario(next, fleet))
  }

  const run = async () => {
    setShowBuilding(true)
    void simulation.run(scenarioId === DEMO_MODE ? await loadDemoSolution() : code)
  }

  const startDemo = async () => {
    setScenarioId(DEMO_MODE)
    setLeftTab("statement")
    setShowBuilding(true)
    simulation.setDirectionalCalls(true)
    simulation.setFleet(DEMO_FLEET, DEMO_SCENARIO)
    void simulation.run(await loadDemoSolution())
  }

  const showErrorLine = (line: number) => {
    openLeftTab("code")
    setRevealLine(line)
  }

  const chooseDirectionalCalls = (on: boolean) => {
    setDirectionalCalls(on)
    saveDirectionalCalls(on)
    simulation.setDirectionalCalls(on)
  }

  const chooseFleet = (next: FleetSpec) => {
    setFleet(next)
    saveFleet(next)
    simulation.setFleet(next, scenarioId === CUSTOM_MODE ? toScenario(custom, next) : undefined)
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
  const editingScenario = scenarioId === CUSTOM_MODE
  const demoActive = scenarioId === DEMO_MODE
  const shownFleet = demoActive ? DEMO_FLEET : fleet
  const shownDirectionalCalls = demoActive || directionalCalls
  const scenarioLocked = phase === "running" || phase === "paused"
  const error = state.error
  const errorLine = error?.line ?? null
  const notArrived = state.passengers.filter((p) => p.state !== "arrived").map((p) => p.id)
  const statementLabel = editingScenario ? t.tabs.scenario : t.tabs.statement

  return (
    <div className={`app${compact ? " compact" : ""}`}>
      <Controls
        phase={phase}
        pythonReady={python === "ready"}
        pythonFailed={python === "failed"}
        scenarioId={scenarioId}
        compact={compact}
        speed={speed}
        tick={state.tick}
        directionalCalls={shownDirectionalCalls}
        directionalCallsLocked={scenarioLocked || demoActive}
        onDirectionalCalls={chooseDirectionalCalls}
        fleet={shownFleet}
        fleetLocked={scenarioLocked || demoActive}
        demoActive={demoActive}
        onDemo={startDemo}
        onFleet={chooseFleet}
        onScenario={chooseScenario}
        onRun={run}
        onPause={() => simulation.pause()}
        onRestart={() => simulation.restart()}
        onSpeed={chooseSpeed}
      />
      <main className="columns">
        <section className="left" style={compact ? undefined : { width: leftWidth }} hidden={compact && showBuilding}>
          {!compact && (
            <div role="tablist" className="tabs">
              {(["code", "statement", "api"] as const).map((id) => (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={leftTab === id}
                  onClick={() => setLeftTab(id)}
                >
                  {id === "statement" ? statementLabel : t.tabs[id]}
                </button>
              ))}
            </div>
          )}
          <div className="left-body" hidden={leftTab !== "code"}>
            <CodeEditor
              value={code}
              errorLine={errorLine}
              compact={compact}
              handle={editorRef}
              onChange={updateCode}
            />
            <button type="button" className="restore" onClick={restoreTemplate}>
              {t.restoreTemplate}
            </button>
          </div>
          {leftTab === "statement" && editingScenario && (
            <div role="tabpanel">
              <ScenarioEditor
                value={custom}
                locked={scenarioLocked}
                serviceAvailable={hasServiceElevator(fleet)}
                onChange={editCustom}
              />
            </div>
          )}
          {leftTab === "statement" && !editingScenario && (
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
        {!compact && (
          <div className="splitter" role="separator" aria-orientation="vertical" onPointerDown={startDrag} />
        )}
        <section className="right" hidden={compact && !showBuilding}>
          {error && (
            <div className="banner error" role="alert">
              <span>
                <strong>{t.errorTitle}</strong>: {error.message}
                {errorLine !== null && <> ({t.errorAtLine(errorLine)})</>}
              </span>
              {errorLine !== null && (
                <button type="button" onClick={() => showErrorLine(errorLine)}>
                  {t.showLine(errorLine)}
                </button>
              )}
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
            directionalCalls={shownDirectionalCalls}
            fleet={shownFleet}
            onPress={(kind, floor, direction, opts) => simulation.press(kind, floor, direction, opts)}
          />
          <Console log={state.log} />
        </section>
      </main>
      {compact && (
        <SectionNav
          showBuilding={showBuilding}
          leftTab={leftTab}
          statementLabel={statementLabel}
          onBuilding={() => setShowBuilding(true)}
          onLeftTab={openLeftTab}
        />
      )}
    </div>
  )
}
