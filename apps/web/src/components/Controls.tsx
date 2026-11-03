import { SCENARIOS } from "@elevator/engine"
import { t } from "../i18n/pt-BR"
import type { Phase, Speed } from "../simulation"

const SPEEDS: Speed[] = [1, 2, 4]
export const FREE_MODE = "sandbox"

type Props = {
  phase: Phase
  pythonReady: boolean
  pythonFailed: boolean
  scenarioId: string
  speed: Speed
  tick: number
  onScenario(id: string): void
  onRun(): void
  onPause(): void
  onRestart(): void
  onSpeed(speed: Speed): void
}

export function Controls(props: Props) {
  const { phase, pythonReady, pythonFailed } = props
  const status = pythonFailed ? t.pythonFailed : pythonReady ? null : t.loadingPython

  return (
    <header className="controls">
      <h1>{t.title}</h1>
      <select
        aria-label={t.scenarioLabel}
        value={props.scenarioId}
        onChange={(e) => props.onScenario(e.target.value)}
      >
        <option value={FREE_MODE}>{t.freeMode}</option>
        {SCENARIOS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>
      <button type="button" onClick={props.onRun} disabled={!pythonReady || phase === "running"}>
        {phase === "paused" ? t.resume : t.run}
      </button>
      <button type="button" onClick={props.onPause} disabled={phase !== "running"}>
        {t.pause}
      </button>
      <button type="button" onClick={props.onRestart}>
        {t.restart}
      </button>
      <div role="group" aria-label={t.speedLabel} className="speeds">
        {SPEEDS.map((s) => (
          <button
            type="button"
            key={s}
            aria-pressed={props.speed === s}
            onClick={() => props.onSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
      <span className="clock" aria-label={t.clockLabel}>
        {t.seconds(props.tick)} s
      </span>
      {status && (
        <span className="muted" role="status">
          {status}
        </span>
      )}
    </header>
  )
}
