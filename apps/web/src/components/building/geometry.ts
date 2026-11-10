export const VIEW_W = 560
export const FLOOR_H = 62
export const TOP = 70
export const GROUND_H = 60
export const WALL_L = 18
export const SHAFT_X = 374
export const SHAFT_W = 78
export const CABIN_W = 64
export const CABIN_H = 50
export const CABIN_X = SHAFT_X + (SHAFT_W - CABIN_W) / 2
export const CABIN_CX = CABIN_X + CABIN_W / 2
export const DIAL_X = SHAFT_X - 22
export const VISIBLE_RIDERS = 4
export const SERVICE_COLUMN_SHIFT = 18

const RIDER_OFFSETS = [-22, -7.5, 7.5, 22]

export type Geometry = {
  min: number
  max: number
  floors: number[]
  height: number
  width: number
  elevators: number
  hasServiceCalls: boolean
  floorBase(floor: number): number
  shaftX(elevator: number): number
  cabinX(elevator: number): number
  cabinCx(elevator: number): number
  serviceCallX: number
  queueX(index: number): number
  riderX(elevator: number, slot: number): number
}

export function geometryFor(min: number, max: number, elevators = 1, hasServiceCalls = false): Geometry {
  const count = max - min + 1
  const shaftX = (elevator: number) => SHAFT_X + elevator * SHAFT_W
  const cabinX = (elevator: number) => shaftX(elevator) + (SHAFT_W - CABIN_W) / 2
  const cabinCx = (elevator: number) => cabinX(elevator) + CABIN_W / 2
  const queueShift = hasServiceCalls ? SERVICE_COLUMN_SHIFT : 0
  return {
    min,
    max,
    floors: Array.from({ length: count }, (_, i) => max - i),
    height: TOP + count * FLOOR_H + GROUND_H,
    width: VIEW_W + (elevators - 1) * SHAFT_W,
    elevators,
    hasServiceCalls,
    floorBase: (floor) => TOP + (max - floor) * FLOOR_H + FLOOR_H - 8,
    shaftX,
    cabinX,
    cabinCx,
    serviceCallX: DIAL_X - SERVICE_COLUMN_SHIFT,
    queueX: (index) => SHAFT_X - 50 - queueShift - index * 27,
    riderX: (elevator, slot) => cabinCx(elevator) + RIDER_OFFSETS[Math.min(slot, VISIBLE_RIDERS - 1)]!,
  }
}
export const exitX = (id: string) => 150 + (id.charCodeAt(0) % 5) * 22
export const percentX = (x: number, geometry: Geometry) => `${(x / geometry.width) * 100}%`
export const percentY = (y: number, geometry: Geometry) => `${(y / geometry.height) * 100}%`
