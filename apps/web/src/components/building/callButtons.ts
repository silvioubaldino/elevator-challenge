import type { Direction } from "@elevator/engine"
import { t } from "../../i18n/pt-BR"
import type { Geometry } from "./geometry"

const SINGLE_OFFSET = 26
const PAIR_OFFSET = 16

export type CallButtonSpec = {
  floor: number
  direction: Direction
  service: boolean
  y: number
  label: string
}

function columnSpecs(geometry: Geometry, directional: boolean, service: boolean): CallButtonSpec[] {
  const suffix = service ? ` ${t.serviceSuffix}` : ""
  return geometry.floors.flatMap((floor) => {
    const base = geometry.floorBase(floor)
    const name = t.floorLabel(floor)
    if (!directional) {
      return [{ floor, direction: null, service, y: base - SINGLE_OFFSET, label: t.callButton(name) + suffix }]
    }
    const specs: CallButtonSpec[] = []
    if (floor < geometry.max) {
      specs.push({ floor, direction: "up", service, y: base - PAIR_OFFSET, label: t.callButtonUp(name) + suffix })
    }
    if (floor > geometry.min) {
      specs.push({ floor, direction: "down", service, y: base - PAIR_OFFSET, label: t.callButtonDown(name) + suffix })
    }
    return specs
  })
}

export function callButtonSpecs(geometry: Geometry, directional: boolean): CallButtonSpec[] {
  const social = columnSpecs(geometry, directional, false)
  return geometry.hasServiceCalls ? [...social, ...columnSpecs(geometry, directional, true)] : social
}
