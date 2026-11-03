export const TICK_MS = 100
export const FLOOR_TRAVEL_TICKS = 10
export const DOOR_CYCLE_TICKS = 20

export type Direction = "up" | "down" | null
export type Event =
  | { type: "call_button" | "cabin_button" | "stop"; floor: number }
  | { type: "idle" }
export type Command = { type: "move_to"; floor: number }
export type ElevatorSnapshot = {
  current_floor: number
  target_floor: number | null
  direction: Direction
  idle: boolean
  min_floor: number
  max_floor: number
}
export type EventBatch = { tick: number; elevator: ElevatorSnapshot; events: Event[] }
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
export interface Engine {
  step(): Promise<SimulationState>
  press(kind: "call" | "cabin", floor: number): void
  state(): SimulationState
}
export type SimulationState = {
  tick: number
  status: "running" | "success" | "timeout" | "error"
  elevator: {
    position: number
    direction: Direction
    target_floor: number | null
    doors_open: boolean
  }
  call_buttons: number[]
  cabin_buttons: number[]
  passengers: { id: string; from: number; to: number; state: "waiting" | "riding" | "arrived" }[]
  log: { tick: number; kind: "event" | "command" | "print" | "error"; text: string }[]
  error?: RuntimeError
}
