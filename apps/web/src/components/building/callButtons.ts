import type { Direction } from "@elevator/engine"
import { t } from "../../i18n/pt-BR"
import type { Geometry } from "./geometry"

const SINGLE_OFFSET = 26
const PAIR_OFFSET = 16

export type CallButtonSpec = {
  floor: number
  direction: Direction
  y: number
  label: string
}

export function callButtonSpecs(geometry: Geometry, directional: boolean): CallButtonSpec[] {
  return geometry.floors.flatMap((floor) => {
    const base = geometry.floorBase(floor)
    const name = t.floorLabel(floor)
    if (!directional) return [{ floor, direction: null, y: base - SINGLE_OFFSET, label: t.callButton(name) }]
    const specs: CallButtonSpec[] = []
    if (floor < geometry.max) {
      specs.push({ floor, direction: "up", y: base - PAIR_OFFSET, label: t.callButtonUp(name) })
    }
    if (floor > geometry.min) {
      specs.push({ floor, direction: "down", y: base - PAIR_OFFSET, label: t.callButtonDown(name) })
    }
    return specs
  })
}
