import { TICK_MS, type Scenario, type SimulationState } from "@elevator/engine"
import { useMemo } from "react"
import { t } from "../../i18n/pt-BR"
import type { Speed } from "../../simulation"
import { AvatarLayer } from "./AvatarLayer"
import { CabinPanel } from "./CabinPanel"
import {
  CABIN_CX,
  CABIN_H,
  CABIN_W,
  CABIN_X,
  DIAL_X,
  FLOOR_H,
  geometryFor,
  percentX,
  percentY,
  TOP,
  VIEW_W,
  VISIBLE_RIDERS,
  type Geometry,
} from "./geometry"
import { placeAvatars } from "./placements"
import { sceneryMarkup } from "./scenery"
import { useReducedMotion } from "./useReducedMotion"

const DEFAULT_BUILDING = { min_floor: 0, max_floor: 10 }
const DOOR_MS = 500
const DIAL_SWEEP_DEG = 160

type Props = {
  state: SimulationState
  scenario: Scenario | null
  speed: Speed
  interactive: boolean
  onPress(kind: "call" | "cabin", floor: number): void
}

export function Building({ state, scenario, speed, interactive, onPress }: Props) {
  const { min_floor, max_floor } = scenario?.building ?? DEFAULT_BUILDING
  const geometry = useMemo(() => geometryFor(min_floor, max_floor), [min_floor, max_floor])
  const scenery = useMemo(() => ({ __html: sceneryMarkup(geometry) }), [geometry])
  const reducedMotion = useReducedMotion()
  const placements = placeAvatars(state, scenario, geometry)
  const riding = placements.filter((p) => p.status === "riding").length
  const { elevator } = state
  const shownFloor = t.floorLabel(Math.round(elevator.position))
  const arrow = t.directionArrow[elevator.direction ?? "none"]
  const follow = `transform ${TICK_MS / speed}ms linear`
  const cabinShift = { transform: `translateY(${-(elevator.position - min_floor) * FLOOR_H}px)`, transition: follow }
  const cabinTop = geometry.floorBase(min_floor) - CABIN_H
  const cableFull = Math.max(1, cabinTop - 14 - TOP)
  const cableNow = Math.max(0, cableFull - (elevator.position - min_floor) * FLOOR_H)
  const span = Math.max(1, max_floor - min_floor)
  const needle = -DIAL_SWEEP_DEG / 2 + ((elevator.position - min_floor) / span) * DIAL_SWEEP_DEG
  const doorMs = (reducedMotion ? 100 : DOOR_MS) / speed

  return (
    <div className="building" data-motion={reducedMotion ? "reduced" : "full"}>
      <div className="building-stage" style={{ aspectRatio: `${VIEW_W} / ${geometry.height}` }}>
        <svg viewBox={`0 0 ${VIEW_W} ${geometry.height}`} className="building-art" aria-hidden="false">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="sky-top" />
              <stop offset="1" className="sky-bottom" />
            </linearGradient>
            <linearGradient id="cabin-light" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" className="cabin-light-a" />
              <stop offset="1" className="cabin-light-b" />
            </linearGradient>
            <clipPath id="cabin-clip">
              <rect x={CABIN_X + 3} y={0} width={CABIN_W - 6} height={geometry.height} />
            </clipPath>
          </defs>
          <g aria-hidden="true" dangerouslySetInnerHTML={scenery} />
          <Dials geometry={geometry} needle={needle} speed={speed} />
          <rect
            x={CABIN_CX - 1}
            y={TOP}
            width={2}
            height={cableFull}
            className="cable"
            aria-hidden="true"
            style={{ transform: `scaleY(${cableNow / cableFull})`, transformOrigin: `0 ${TOP}px`, transition: follow }}
          />
          <g style={cabinShift} aria-hidden="true">
            <rect x={CABIN_X} y={cabinTop} width={CABIN_W} height={CABIN_H} rx={7} className="cabin-body" />
            <circle cx={CABIN_CX} cy={cabinTop + 18} r={3} fill="#fff8d0" />
          </g>
          <AvatarLayer placements={placements} speed={speed} reducedMotion={reducedMotion} />
          <g
            data-testid="cabin"
            data-position={elevator.position}
            data-doors={elevator.doors_open ? "open" : "closed"}
            className={`cabin${elevator.doors_open ? " doors-open" : ""}`}
            style={cabinShift}
          >
            <g clipPath="url(#cabin-clip)" style={{ ["--door-ms" as string]: `${doorMs}ms` }}>
              <rect className="door door-left" x={CABIN_X + 3} y={cabinTop + 6} width={CABIN_W / 2 - 3} height={CABIN_H - 8} rx={3} />
              <rect className="door door-right" x={CABIN_CX} y={cabinTop + 6} width={CABIN_W / 2 - 3} height={CABIN_H - 8} rx={3} />
            </g>
            <rect x={CABIN_X + 14} y={cabinTop - 14} width={CABIN_W - 28} height={12} rx={4} className="cabin-screen" />
            <text x={CABIN_CX} y={cabinTop - 5} textAnchor="middle" className="cabin-screen-text">
              {shownFloor} {arrow}
            </text>
            {riding > VISIBLE_RIDERS && (
              <g className="extra-riders">
                <circle cx={CABIN_X + CABIN_W - 4} cy={cabinTop + 6} r={8} />
                <text x={CABIN_X + CABIN_W - 4} y={cabinTop + 9} textAnchor="middle">
                  +{riding - VISIBLE_RIDERS}
                </text>
              </g>
            )}
          </g>
        </svg>
        {geometry.floors.map((floor) => {
          const lit = state.call_buttons.includes(floor)
          return (
            <button
              type="button"
              key={floor}
              className={`call-button${lit ? " lit" : ""}`}
              style={{ left: percentX(DIAL_X), top: percentY(geometry.floorBase(floor) - 26, geometry) }}
              aria-label={t.callButton(t.floorLabel(floor))}
              aria-pressed={lit}
              disabled={!interactive}
              onClick={() => onPress("call", floor)}
            />
          )
        })}
      </div>
      <CabinPanel
        floors={geometry.floors}
        lit={state.cabin_buttons}
        display={`${shownFloor} ${arrow}`}
        onBoard={riding}
        interactive={interactive}
        onPress={(floor) => onPress("cabin", floor)}
      />
    </div>
  )
}

function Dials({ geometry, needle, speed }: { geometry: Geometry; needle: number; speed: Speed }) {
  return (
    <g aria-hidden="true">
      {geometry.floors.map((floor) => {
        const cy = geometry.floorBase(floor) - FLOOR_H + 23
        return (
          <g key={floor}>
            <path d={`M${DIAL_X - 11} ${cy} A11 11 0 0 1 ${DIAL_X + 11} ${cy}Z`} className="dial" />
            <line
              x1={DIAL_X}
              y1={cy}
              x2={DIAL_X}
              y2={cy - 9}
              className="dial-needle"
              style={{
                transform: `rotate(${needle}deg)`,
                transformOrigin: `${DIAL_X}px ${cy}px`,
                transition: `transform ${TICK_MS / speed}ms linear`,
              }}
            />
            <circle cx={DIAL_X} cy={cy} r={1.8} className="dial-pin" />
          </g>
        )
      })}
    </g>
  )
}
