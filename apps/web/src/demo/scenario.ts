import type { FleetSpec, Scenario } from "@elevator/engine"

export const DEMO_FLEET: FleetSpec = [{ service: false }, { service: false }, { service: true }]

export const DEMO_SCENARIO: Scenario = {
  id: "demo",
  title: "Demo",
  description:
    "Três elevadores, um deles de serviço, com botões de subir e descer. Quatro pessoas saem do térreo, três esperam no 5º para ir ao 8º, outras descem do topo, cruzam o prédio, e mais cinco pedem o elevador de serviço, tudo ao mesmo tempo.",
  building: { min_floor: 0, max_floor: 10, directional_calls: true, elevators: DEMO_FLEET },
  start_floor: 0,
  time_limit_s: 72,
  passengers: [
    { id: "A", at_s: 0, from: 0, to: 3 },
    { id: "B", at_s: 0.5, from: 0, to: 5 },
    { id: "C", at_s: 1, from: 0, to: 7 },
    { id: "D", at_s: 1.5, from: 0, to: 10 },
    { id: "E", at_s: 1, from: 5, to: 8 },
    { id: "F", at_s: 1.5, from: 5, to: 8 },
    { id: "G", at_s: 6, from: 5, to: 8 },
    { id: "H", at_s: 3, from: 10, to: 0 },
    { id: "I", at_s: 4, from: 9, to: 2 },
    { id: "J", at_s: 5, from: 8, to: 1 },
    { id: "K", at_s: 7, from: 3, to: 6 },
    { id: "L", at_s: 9, from: 6, to: 4 },
    { id: "M", at_s: 14, from: 2, to: 9 },
    { id: "N", at_s: 16, from: 7, to: 0 },
    { id: "O", at_s: 0, from: 0, to: 9, service: true },
    { id: "P", at_s: 3, from: 6, to: 0, service: true },
    { id: "Q", at_s: 8, from: 2, to: 7, service: true },
    { id: "R", at_s: 12, from: 5, to: 8, service: true },
    { id: "S", at_s: 20, from: 9, to: 1, service: true },
  ],
}
