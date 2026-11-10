import { useState } from "react"
import { t } from "../../i18n/pt-BR"

export type CabinPanelCar = {
  id: number
  service: boolean
  lit: number[]
  display: string
  onBoard: number
}

type Props = {
  floors: number[]
  cars: CabinPanelCar[]
  interactive: boolean
  onPress(floor: number, elevator: number): void
}

export function CabinPanel({ floors, cars, interactive, onPress }: Props) {
  const [chosen, setChosen] = useState(0)
  const car = cars[chosen] ?? cars[0]!
  const title = cars.length > 1 ? t.cabinPanelOf(car.id + 1) : t.cabinPanel

  return (
    <div className="cabin-panel">
      <div className="cabin-panel-title">{title}</div>
      {cars.length > 1 && (
        <div role="tablist" className="cabin-panel-tabs" aria-label={t.cabinPanel}>
          {cars.map((c) => (
            <button
              type="button"
              role="tab"
              key={c.id}
              aria-selected={c.id === car.id}
              className={c.service ? "service" : undefined}
              onClick={() => setChosen(c.id)}
            >
              {t.elevatorTab(c.id + 1, c.service)}
            </button>
          ))}
        </div>
      )}
      <div className="cabin-panel-screen">{car.display}</div>
      <div className="cabin-panel-count">{t.onBoard(car.onBoard)}</div>
      <div className="cabin-panel-keys" role="group" aria-label={title}>
        {floors.map((floor) => {
          const on = car.lit.includes(floor)
          return (
            <button
              type="button"
              key={floor}
              className={`cabin-button${on ? " lit" : ""}`}
              aria-label={t.cabinButton(t.floorLabel(floor))}
              aria-pressed={on}
              disabled={!interactive}
              onClick={() => onPress(floor, car.id)}
            >
              {t.floorLabel(floor)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
