// Contrato de SPEC-003 §Contratos (dona do formato); aqui só o tipo que o Engine consome.
export type Scenario = {
  id: string
  title: string
  description: string
  building: { min_floor: number; max_floor: number }
  start_floor: number
  time_limit_s: number
  passengers: { id: string; at_s: number; from: number; to: number }[]
}
