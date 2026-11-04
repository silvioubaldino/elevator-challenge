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

const RIDER_OFFSETS = [-22, -7.5, 7.5, 22]

export type Geometry = {
  min: number
  max: number
  floors: number[]
  height: number
  floorBase(floor: number): number
}

export function geometryFor(min: number, max: number): Geometry {
  const count = max - min + 1
  return {
    min,
    max,
    floors: Array.from({ length: count }, (_, i) => max - i),
    height: TOP + count * FLOOR_H + GROUND_H,
    floorBase: (floor) => TOP + (max - floor) * FLOOR_H + FLOOR_H - 8,
  }
}

export const queueX = (index: number) => SHAFT_X - 50 - index * 27
export const riderX = (slot: number) => CABIN_CX + RIDER_OFFSETS[Math.min(slot, VISIBLE_RIDERS - 1)]!
export const exitX = (id: string) => 150 + (id.charCodeAt(0) % 5) * 22
export const percentX = (x: number) => `${(x / VIEW_W) * 100}%`
export const percentY = (y: number, geometry: Geometry) => `${(y / geometry.height) * 100}%`
