export const TICK_MS = 100
export const FLOOR_TRAVEL_TICKS = 10
export const DOOR_CYCLE_TICKS = 20

export type Direction = "up" | "down" | null
export const MAX_ELEVATORS = 3

export type FleetSpec = { service: boolean }[]
export type Event =
  | { type: "call_button"; floor: number; direction: Direction; service?: true }
  | { type: "cabin_button" | "stop"; floor: number; elevator?: number }
  | { type: "idle"; elevator?: number }
export type Command = { type: "move_to"; floor: number; elevator?: number }
export type ElevatorSnapshot = {
  id: number
  service: boolean
  current_floor: number
  target_floor: number | null
  direction: Direction
  idle: boolean
  min_floor: number
  max_floor: number
}
export type EventBatch = {
  tick: number
  elevator: ElevatorSnapshot
  elevators: ElevatorSnapshot[]
  events: Event[]
}
export type RuntimeError = {
  kind: "syntax" | "exception" | "timeout"
  message: string
  line?: number
}
export interface Runtime {
  load(code: string): Promise<RuntimeError | null>
  handle(
    batch: EventBatch,
  ): Promise<{ commands: Command[]; logs: string[] } | { error: RuntimeError }>
  dispose(): void
}
export type PressOptions = { service?: boolean; elevator?: number }
export interface Engine {
  step(): Promise<SimulationState>
  press(kind: "call" | "cabin", floor: number, direction?: "up" | "down", opts?: PressOptions): void
  state(): SimulationState
}
export type ElevatorView = {
  position: number
  direction: Direction
  target_floor: number | null
  doors_open: boolean
}
export type SimulationState = {
  tick: number
  status: "running" | "success" | "timeout" | "error"
  elevator: ElevatorView
  elevators?: (ElevatorView & { id: number; service: boolean; cabin_buttons: number[] })[]
  call_buttons: { floor: number; direction: Direction; service?: true }[]
  cabin_buttons: number[]
  passengers: {
    id: string
    from: number
    to: number
    state: "waiting" | "riding" | "arrived"
    service?: true
    elevator?: number | null
  }[]
  log: { tick: number; kind: "event" | "command" | "print" | "error"; text: string }[]
  error?: RuntimeError
}
