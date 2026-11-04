import { SCENARIOS } from "@elevator/engine"
import { t } from "../i18n/pt-BR"
import type { Phase, Speed } from "../simulation"

const SPEEDS: Speed[] = [1, 2, 4]
export const FREE_MODE = "sandbox"
export const CUSTOM_MODE = "custom"

type Props = {
  phase: Phase
  pythonReady: boolean
  pythonFailed: boolean
  scenarioId: string
  compact: boolean
  speed: Speed
  tick: number
  onScenario(id: string): void
  onRun(): void
  onPause(): void
  onRestart(): void
  onSpeed(speed: Speed): void
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
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
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
