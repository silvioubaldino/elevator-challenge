import { TICK_MS, type Scenario, type SimulationState } from "@elevator/engine"
import { t } from "../i18n/pt-BR"
import type { Speed } from "../simulation"

const FLOOR_HEIGHT_PX = 44
const DEFAULT_BUILDING = { min_floor: 0, max_floor: 10 }

type Props = {
  state: SimulationState
  scenario: Scenario | null
  speed: Speed
  interactive: boolean
  onPress(kind: "call" | "cabin", floor: number): void
}

const range = (min: number, max: number) =>
  Array.from({ length: max - min + 1 }, (_, i) => max - i)

export function Building({ state, scenario, speed, interactive, onPress }: Props) {
  const { min_floor, max_floor } = scenario?.building ?? DEFAULT_BUILDING
  const floors = range(min_floor, max_floor)
  const { elevator } = state
  const onBoard = state.passengers.filter((p) => p.state === "riding").length
  const arrow = elevator.direction ?? "none"
  const shownFloor = Math.round(elevator.position)

  return (
    <div className="building">
      <div className="shaft" style={{ height: floors.length * FLOOR_HEIGHT_PX }}>
        {floors.map((floor) => {
          const lit = state.call_buttons.includes(floor)
          const waiting = state.passengers.filter((p) => p.state === "waiting" && p.from === floor)
          return (
            <div className="floor" key={floor} style={{ height: FLOOR_HEIGHT_PX }}>
              <span className="floor-label">{t.floorLabel(floor)}</span>
              <button
                type="button"
                className={`call-button${lit ? " lit" : ""}`}
                aria-label={t.callButton(t.floorLabel(floor))}
                aria-pressed={lit}
                disabled={!interactive}
                onClick={() => onPress("call", floor)}
              />
              <span className="waiting">
                {waiting.map((p) => (
                  <span
                    key={p.id}
                    className="passenger"
                    role="img"
                    aria-label={t.waiting(p.id, t.floorLabel(p.to))}
                    title={`${p.id} → ${t.floorLabel(p.to)}`}
                  >
                    🧍<small>{p.id}</small>
                  </span>
                ))}
              </span>
            </div>
          )
        })}
        <div
          className={`cabin${elevator.doors_open ? " doors-open" : ""}`}
          data-testid="cabin"
          data-position={elevator.position}
          style={{
            height: FLOOR_HEIGHT_PX - 6,
            bottom: (elevator.position - min_floor) * FLOOR_HEIGHT_PX + 3,
            transition: `bottom ${TICK_MS / speed}ms linear`,
          }}
        >
          <span className="cabin-display">
            {t.floorLabel(shownFloor)} {t.directionArrow[arrow]}
          </span>
          <span className="cabin-count">{t.onBoard(onBoard)}</span>
        </div>
      </div>
      <div className="panel" role="group" aria-label={t.cabinPanel}>
        {floors.map((floor) => {
          const lit = state.cabin_buttons.includes(floor)
          return (
            <button
              type="button"
              key={floor}
              className={`cabin-button${lit ? " lit" : ""}`}
              aria-label={t.cabinButton(t.floorLabel(floor))}
              aria-pressed={lit}
              disabled={!interactive}
              onClick={() => onPress("cabin", floor)}
            >
              {t.floorLabel(floor)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
