import { TICK_MS, type FleetSpec, type PressOptions, type Scenario, type SimulationState } from "@elevator/engine"
import { useMemo } from "react"
import { t } from "../../i18n/pt-BR"
import type { Speed } from "../../simulation"
import { AvatarLayer } from "./AvatarLayer"
import { CabinPanel } from "./CabinPanel"
import { callButtonSpecs } from "./callButtons"
import {
  CABIN_H,
  CABIN_W,
  DIAL_X,
  FLOOR_H,
  geometryFor,
  percentX,
  percentY,
  TOP,
  VISIBLE_RIDERS,
  type Geometry,
} from "./geometry"
import { placeAvatars } from "./placements"
import { sceneryMarkup } from "./scenery"
import { useReducedMotion } from "./useReducedMotion"

const SINGLE_FLEET: FleetSpec = [{ service: false }]
const DEFAULT_BUILDING = { min_floor: 0, max_floor: 10 }
const DOOR_MS = 500
const DIAL_SWEEP_DEG = 160

type Props = {
  state: SimulationState
  scenario: Scenario | null
  speed: Speed
  interactive: boolean
  directionalCalls: boolean
  fleet?: FleetSpec
  onPress(kind: "call" | "cabin", floor: number, direction?: "up" | "down", opts?: PressOptions): void
}

export function Building({ state, scenario, speed, interactive, directionalCalls, fleet = SINGLE_FLEET, onPress }: Props) {
  const { min_floor, max_floor } = scenario?.building ?? DEFAULT_BUILDING
  const count = fleet.length
  const hasServiceCalls = fleet.some((e) => e.service)
  const geometry = useMemo(
    () => geometryFor(min_floor, max_floor, count, hasServiceCalls),
    [min_floor, max_floor, count, hasServiceCalls],
  )
  const scenery = useMemo(() => ({ __html: sceneryMarkup(geometry) }), [geometry])
  const reducedMotion = useReducedMotion()
  const placements = placeAvatars(state, scenario, geometry)
  const { elevator } = state
  const follow = `transform ${TICK_MS / speed}ms linear`
  const cabinTop = geometry.floorBase(min_floor) - CABIN_H
  const cableFull = Math.max(1, cabinTop - 14 - TOP)
  const span = Math.max(1, max_floor - min_floor)
  const doorMs = (reducedMotion ? 100 : DOOR_MS) / speed
  const needle = -DIAL_SWEEP_DEG / 2 + ((elevator.position - min_floor) / span) * DIAL_SWEEP_DEG
  const fleetState = state.elevators ?? [
    { ...state.elevator, id: 0, service: false, cabin_buttons: state.cabin_buttons },
  ]
  const cars = fleetState.map((car) => ({
    ...car,
    riding: placements.filter((p) => p.status === "riding" && p.elevator === car.id).length,
    floorLabel: t.floorLabel(Math.round(car.position)),
    arrow: t.directionArrow[car.direction ?? "none"],
  }))

  return (
    <div className="building" data-motion={reducedMotion ? "reduced" : "full"}>
      <div className="building-stage" style={{ aspectRatio: `${geometry.width} / ${geometry.height}`, ["--stage-ratio" as string]: geometry.width / geometry.height }}>
        <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} className="building-art" aria-hidden="false">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="sky-top" />
              <stop offset="1" className="sky-bottom" />
            </linearGradient>
            <linearGradient id="cabin-light" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" className="cabin-light-a" />
              <stop offset="1" className="cabin-light-b" />
            </linearGradient>
            {cars.map((car) => (
              <clipPath id={`cabin-clip-${car.id}`} key={car.id}>
                <rect x={geometry.cabinX(car.id) + 3} y={0} width={CABIN_W - 6} height={geometry.height} />
              </clipPath>
            ))}
          </defs>
          <g aria-hidden="true" dangerouslySetInnerHTML={scenery} />
          {count === 1 && <Dials geometry={geometry} needle={needle} speed={speed} />}
          {cars.map((car) => {
            const shift = { transform: `translateY(${-(car.position - min_floor) * FLOOR_H}px)`, transition: follow }
            const cableNow = Math.max(0, cableFull - (car.position - min_floor) * FLOOR_H)
            const cx = geometry.cabinCx(car.id)
            return (
              <g key={car.id} aria-hidden="true">
                <rect
                  x={cx - 1}
                  y={TOP}
                  width={2}
                  height={cableFull}
                  className="cable"
                  style={{ transform: `scaleY(${cableNow / cableFull})`, transformOrigin: `0 ${TOP}px`, transition: follow }}
                />
                <g style={shift}>
                  <rect
                    x={geometry.cabinX(car.id)}
                    y={cabinTop}
                    width={CABIN_W}
                    height={CABIN_H}
                    rx={7}
                    className={`cabin-body${car.service ? " service" : ""}`}
                  />
                  <circle cx={cx} cy={cabinTop + 18} r={3} fill="#fff8d0" />
                </g>
              </g>
            )
          })}
          <AvatarLayer placements={placements} speed={speed} reducedMotion={reducedMotion} />
          {cars.map((car) => {
            const shift = { transform: `translateY(${-(car.position - min_floor) * FLOOR_H}px)`, transition: follow }
            const x = geometry.cabinX(car.id)
            const cx = geometry.cabinCx(car.id)
            return (
              <g
                key={car.id}
                data-testid={car.id === 0 ? "cabin" : `cabin-${car.id}`}
                data-position={car.position}
                data-doors={car.doors_open ? "open" : "closed"}
                data-service={car.service}
                className={`cabin${car.doors_open ? " doors-open" : ""}`}
                style={shift}
              >
                <g clipPath={`url(#cabin-clip-${car.id})`} style={{ ["--door-ms" as string]: `${doorMs}ms` }}>
                  <rect className="door door-left" x={x + 3} y={cabinTop + 6} width={CABIN_W / 2 - 3} height={CABIN_H - 8} rx={3} />
                  <rect className="door door-right" x={cx} y={cabinTop + 6} width={CABIN_W / 2 - 3} height={CABIN_H - 8} rx={3} />
                </g>
                <rect x={x + 14} y={cabinTop - 14} width={CABIN_W - 28} height={12} rx={4} className="cabin-screen" />
                <text x={cx} y={cabinTop - 5} textAnchor="middle" className="cabin-screen-text">
                  {car.service ? "S " : ""}
                  {car.floorLabel} {car.arrow}
                </text>
                {car.riding > VISIBLE_RIDERS && (
                  <g className="extra-riders">
                    <circle cx={x + CABIN_W - 4} cy={cabinTop + 6} r={8} />
                    <text x={x + CABIN_W - 4} y={cabinTop + 9} textAnchor="middle">
                      +{car.riding - VISIBLE_RIDERS}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
        {callButtonSpecs(geometry, directionalCalls).map(({ floor, direction, service, y, label }) => {
          const lit = state.call_buttons.some(
            (b) => b.floor === floor && b.direction === direction && (b.service === true) === service,
          )
          return (
            <button
              type="button"
              key={`${floor}-${direction}-${service}`}
              className={`call-button${direction ? ` ${direction}` : ""}${service ? " service" : ""}${lit ? " lit" : ""}`}
              style={{ left: percentX(service ? geometry.serviceCallX : DIAL_X, geometry), top: percentY(y, geometry) }}
              aria-label={label}
              aria-pressed={lit}
              disabled={!interactive}
              onClick={() => onPress("call", floor, direction ?? undefined, service ? { service: true } : undefined)}
            />
          )
        })}
      </div>
      <CabinPanel
        floors={geometry.floors}
        cars={cars.map((car) => ({
          id: car.id,
          service: car.service,
          lit: car.cabin_buttons,
          display: `${car.floorLabel} ${car.arrow}`,
          onBoard: car.riding,
        }))}
        interactive={interactive}
        onPress={(floor, elevator) => onPress("cabin", floor, undefined, elevator ? { elevator } : undefined)}
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
