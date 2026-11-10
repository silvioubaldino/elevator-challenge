import { MAX_ELEVATORS, SCENARIOS, type FleetSpec } from "@elevator/engine"
import { t } from "../i18n/pt-BR"
import type { Phase, Speed } from "../simulation"

const SPEEDS: Speed[] = [1, 2, 4]
export const FREE_MODE = "sandbox"
export const CUSTOM_MODE = "custom"
export const DEMO_MODE = "demo"

type Props = {
  phase: Phase
  pythonReady: boolean
  pythonFailed: boolean
  scenarioId: string
  compact: boolean
  speed: Speed
  tick: number
  directionalCalls: boolean
  directionalCallsLocked: boolean
  onDirectionalCalls(on: boolean): void
  fleet: FleetSpec
  fleetLocked: boolean
  onFleet(fleet: FleetSpec): void
  demoActive: boolean
  onDemo(): void
  onScenario(id: string): void
  onRun(): void
  onPause(): void
  onRestart(): void
  onSpeed(speed: Speed): void
}

function resizeFleet(fleet: FleetSpec, count: number): FleetSpec {
  return Array.from({ length: count }, (_, i) => fleet[i] ?? { service: false })
}

export function Controls(props: Props) {
  const { phase, pythonReady, pythonFailed, compact } = props
  const status = pythonFailed ? t.pythonFailed : pythonReady ? null : t.loadingPython
  const showRun = !compact || phase !== "running"
  const showPause = !compact || phase === "running"

  return (
    <>
      <header className="controls">
        <h1>{t.title}</h1>
        <select
          aria-label={t.scenarioLabel}
          value={props.scenarioId}
          onChange={(e) => props.onScenario(e.target.value)}
        >
          <option value={FREE_MODE}>{t.freeMode}</option>
          <option value={CUSTOM_MODE}>{t.customMode}</option>
          {props.demoActive && <option value={DEMO_MODE}>{t.demo}</option>}
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <label className="directional-toggle">
          <input
            type="checkbox"
            checked={props.directionalCalls}
            disabled={props.directionalCallsLocked}
            onChange={(e) => props.onDirectionalCalls(e.target.checked)}
          />
          {t.directionalCalls}
        </label>
        <div className="elevator-config">
          <label>
            {t.elevatorsLabel}
            <select
              aria-label={t.elevatorsLabel}
              value={props.fleet.length}
              disabled={props.fleetLocked}
              onChange={(e) => props.onFleet(resizeFleet(props.fleet, Number(e.target.value)))}
            >
              {Array.from({ length: MAX_ELEVATORS }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {props.fleet.map((car, i) =>
            i === 0 ? null : (
              <label key={i}>
                <input
                  type="checkbox"
                  aria-label={t.serviceElevator(i + 1)}
                  checked={car.service}
                  disabled={props.fleetLocked}
                  onChange={(e) =>
                    props.onFleet(props.fleet.map((c, j) => (j === i ? { service: e.target.checked } : c)))
                  }
                />
                {t.serviceElevator(i + 1)}
              </label>
            ),
          )}
        </div>
        {status && (
          <span className="muted status" role="status">
            {status}
          </span>
        )}
      </header>
      <div className="transport">
        {showRun && (
          <button
            type="button"
            className="primary"
            onClick={props.onRun}
            disabled={!pythonReady || phase === "running"}
          >
            {phase === "paused" ? t.resume : t.run}
          </button>
        )}
        {showPause && (
          <button type="button" className="primary" onClick={props.onPause} disabled={phase !== "running"}>
            {t.pause}
          </button>
        )}
        <button type="button" onClick={props.onRestart}>
          {t.restart}
        </button>
        <button type="button" aria-pressed={props.demoActive} onClick={props.onDemo} disabled={!pythonReady}>
          {t.demo}
        </button>
        <div role="group" aria-label={t.speedLabel} className="speeds">
          {SPEEDS.map((s) => (
            <button type="button" key={s} aria-pressed={props.speed === s} onClick={() => props.onSpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
      </div>
      <div className="clock-bar">
        <span className="clock" aria-label={t.clockLabel}>
          {t.seconds(props.tick)} s
        </span>
      </div>
    </>
  )
}
