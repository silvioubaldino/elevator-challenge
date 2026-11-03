export type Scenario = {
  id: string
  title: string
  description: string
  building: { min_floor: number; max_floor: number }
  start_floor: number
  time_limit_s: number
  passengers: { id: string; at_s: number; from: number; to: number }[]
}

export type ScenarioRules = Pick<Scenario, "building" | "start_floor" | "passengers"> & {
  time_limit_s?: number
}

export class ScenarioError extends Error {}

const isMultipleOfTick = (seconds: number) => Math.abs(seconds * 10 - Math.round(seconds * 10)) < 1e-9

export function validateScenario(scenario: ScenarioRules): string | null {
  const { min_floor, max_floor } = scenario.building
  const inBuilding = (floor: number) => Number.isInteger(floor) && floor >= min_floor && floor <= max_floor

  if (min_floor > max_floor) return "Prédio inválido: andar mínimo maior que o máximo"
  if (!inBuilding(scenario.start_floor)) return `Andar inicial ${scenario.start_floor} fora do prédio`
  if (scenario.time_limit_s !== undefined && !(scenario.time_limit_s > 0)) {
    return "Limite de tempo deve ser maior que zero"
  }

  const seen = new Set<string>()
  for (const p of scenario.passengers) {
    if (seen.has(p.id)) return `Passenger ${p.id}: id repetido`
    seen.add(p.id)
    if (!inBuilding(p.from)) return `Passenger ${p.id}: origem ${p.from} fora do prédio`
    if (!inBuilding(p.to)) return `Passenger ${p.id}: destino ${p.to} fora do prédio`
    if (p.from === p.to) return `Passenger ${p.id}: origem e destino iguais`
    if (!(p.at_s >= 0) || !isMultipleOfTick(p.at_s)) {
      return `Passenger ${p.id}: instante ${p.at_s} deve ser múltiplo de 0,1 s`
    }
  }
  return null
}

export function assertValidScenario(scenario: ScenarioRules): void {
  const message = validateScenario(scenario)
  if (message) throw new ScenarioError(message)
}
