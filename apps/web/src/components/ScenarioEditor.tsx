import { useState } from "react"
import {
  addPassenger,
  CUSTOM_BUILDING,
  MAX_PASSENGERS,
  removePassenger,
  setAppearsAt,
  setFrom,
  setTimeLimit,
  setTo,
  type CustomScenario,
} from "../customScenario"
import { t } from "../i18n/pt-BR"
import { AvatarFigure } from "./avatar/AvatarFigure"
import { avatarFromId } from "./avatar/look"

type Props = {
  value: CustomScenario
  locked: boolean
  onChange(next: CustomScenario): void
}

const FLOORS = Array.from(
  { length: CUSTOM_BUILDING.max_floor - CUSTOM_BUILDING.min_floor + 1 },
  (_, i) => CUSTOM_BUILDING.min_floor + i,
)

export function ScenarioEditor({ value, locked, onChange }: Props) {
  const onlyOne = value.passengers.length <= 1
  const full = value.passengers.length >= MAX_PASSENGERS

  return (
    <fieldset className="scenario-editor" disabled={locked}>
      <label className="scenario-limit">
        <span>{t.scenarioEditor.timeLimit}</span>
        <NumberField
          label={t.scenarioEditor.timeLimit}
          value={value.time_limit_s}
          min={1}
          step={1}
          onCommit={(seconds) => onChange(setTimeLimit(value, seconds))}
        />
      </label>
      <ul className="scenario-passengers" aria-label={t.scenarioEditor.passengers}>
        {value.passengers.map((p) => (
          <li key={p.id} className="scenario-passenger" data-testid={`scenario-row-${p.id}`}>
            <PassengerFace id={p.id} />
            <strong className="scenario-id">{p.id}</strong>
            <span className="scenario-field">
              <span aria-hidden="true">{t.scenarioEditor.appearsAtHeading}</span>
              <NumberField
                label={t.scenarioEditor.appearsAt(p.id)}
                value={p.at_s}
                min={0}
                max={value.time_limit_s}
                step={0.1}
                onCommit={(seconds) => onChange(setAppearsAt(value, p.id, seconds))}
              />
              <span aria-hidden="true">s</span>
            </span>
            <span className="scenario-field">
              <span aria-hidden="true">{t.scenarioEditor.fromHeading}</span>
              <select
                aria-label={t.scenarioEditor.from(p.id)}
                value={p.from}
                onChange={(e) => onChange(setFrom(value, p.id, Number(e.target.value)))}
              >
                {FLOORS.map((floor) => (
                  <option key={floor} value={floor}>
                    {t.floorLabel(floor)}
                  </option>
                ))}
              </select>
            </span>
            <span className="scenario-field">
              <span aria-hidden="true">{t.scenarioEditor.toHeading}</span>
              <select
                aria-label={t.scenarioEditor.to(p.id)}
                value={p.to}
                onChange={(e) => onChange(setTo(value, p.id, Number(e.target.value)))}
              >
                {FLOORS.filter((floor) => floor !== p.from).map((floor) => (
                  <option key={floor} value={floor}>
                    {t.floorLabel(floor)}
                  </option>
                ))}
              </select>
            </span>
            <button
              type="button"
              className="scenario-remove"
              aria-label={t.scenarioEditor.remove(p.id)}
              disabled={onlyOne}
              onClick={() => onChange(removePassenger(value, p.id))}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button type="button" disabled={full} onClick={() => onChange(addPassenger(value))}>
        {t.scenarioEditor.add}
      </button>
    </fieldset>
  )
}

function PassengerFace({ id }: { id: string }) {
  const look = avatarFromId(id)
  return (
    <svg className="scenario-avatar" viewBox="-18 -66 36 70" aria-hidden="true">
      <AvatarFigure look={look} mood="happy" />
    </svg>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  min: number
  max?: number
  step: number
  onCommit(value: number): void
}

function NumberField({ label, value, min, max, step, onCommit }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft === null) return
    setDraft(null)
    const parsed = Number(draft.replace(",", "."))
    if (draft.trim() !== "" && Number.isFinite(parsed)) onCommit(parsed)
  }

  return (
    <input
      type="number"
      aria-label={label}
      value={draft ?? String(value)}
      min={min}
      max={max}
      step={step}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit()
      }}
    />
  )
}
