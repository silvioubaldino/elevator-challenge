import { t } from "../../i18n/pt-BR"

type Props = {
  floors: number[]
  lit: number[]
  display: string
  onBoard: number
  interactive: boolean
  onPress(floor: number): void
}

export function CabinPanel({ floors, lit, display, onBoard, interactive, onPress }: Props) {
  return (
    <div className="cabin-panel">
      <div className="cabin-panel-title">{t.cabinPanel}</div>
      <div className="cabin-panel-screen">{display}</div>
      <div className="cabin-panel-count">{t.onBoard(onBoard)}</div>
      <div className="cabin-panel-keys" role="group" aria-label={t.cabinPanel}>
        {floors.map((floor) => {
          const on = lit.includes(floor)
          return (
            <button
              type="button"
              key={floor}
              className={`cabin-button${on ? " lit" : ""}`}
              aria-label={t.cabinButton(t.floorLabel(floor))}
              aria-pressed={on}
              disabled={!interactive}
              onClick={() => onPress(floor)}
            >
              {t.floorLabel(floor)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
