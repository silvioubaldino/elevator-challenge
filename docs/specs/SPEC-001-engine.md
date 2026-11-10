---
id: SPEC-001
status: review
parents: [RF-01, RF-03, RF-04]
related: [ADR-002, SPEC-008, SPEC-009, RNF-04, RNF-07]
---

# SPEC-001: Engine — simulação e contrato com o Runtime

**Escopo:** relógio em `Tick`, regras RN-01 a RN-08 e troca de `Event`/`Command` com o `Runtime`.
**Módulo:** `packages/engine`. **Fora:** UI, linguagem do aluno, formato de `Scenario` (SPEC-003).

## Contratos
```ts
const TICK_MS = 100, FLOOR_TRAVEL_TICKS = 10, DOOR_CYCLE_TICKS = 20  // 1 s/andar · portas 2 s
type Direction = "up" | "down" | null
type Event = { type: "call_button"; floor: number; direction: Direction; service?: true }
  | { type: "cabin_button" | "stop"; floor: number; elevator?: number } | { type: "idle"; elevator?: number }
type Command = { type: "move_to"; floor: number; elevator?: number }   // elevator omitido = 0
type ElevatorSnapshot = { id: number; service: boolean; current_floor: number; target_floor: number | null; direction: Direction; idle: boolean; min_floor: number; max_floor: number }
type EventBatch = { tick: number; elevator: ElevatorSnapshot /* = elevators[0] */; elevators: ElevatorSnapshot[]; events: Event[] }
type RuntimeError = { kind: "syntax" | "exception" | "timeout"; message: string; line?: number }
interface Runtime {                       // implementado por SPEC-002 (e futuras linguagens)
  load(code: string): Promise<RuntimeError | null>
  handle(batch: EventBatch): Promise<{ commands: Command[]; logs: string[] } | { error: RuntimeError }>
  dispose(): void
}
interface Engine {
  step(): Promise<SimulationState>        // avança 1 Tick
  press(kind: "call" | "cabin", floor: number, direction?: "up" | "down", opts?: { service?: boolean; elevator?: number }): void  // Sandbox; próximo Tick
  state(): SimulationState
}
type SimulationState = { tick: number; status: "running" | "success" | "timeout" | "error";
  elevator: { position: number; direction: Direction; target_floor: number | null; doors_open: boolean };
  elevators?: (SimulationState["elevator"] & { id: number; service: boolean; cabin_buttons: number[] })[]   // [0] = elevator
  call_buttons: { floor: number; direction: Direction; service?: true }[]; cabin_buttons: number[];   // acesos
  passengers: { id: string; from: number; to: number; state: "waiting" | "riding" | "arrived"; service?: true; elevator?: number | null }[];
  log: { tick: number; kind: "event" | "command" | "print" | "error"; text: string }[]; error?: RuntimeError }
```
- Frota (SPEC-009): `service` e `elevator` só aparecem quando valem (`service: true`; 2+ elevadores); com 1 o formato é o de antes.
- `direction` do `call_button` e de `call_buttons` é `null` sem `DirectionalCalls` (botão único). Payloads que cruzam linguagens usam `snake_case`. `position` é contínuo (ex.: `3.4`) para a animação; `current_floor` = último andar alcançado.
- Ordem de um `Tick`: entradas (`Scenario`/`press`) → movimento → `DoorCycle` → `handle` do batch → aplica `Command` na ordem (último `move_to` vence) → fim do `Scenario`.
- `step()` só resolve depois do `Runtime` responder: o relógio fica parado enquanto o aluno pensa.
## Critérios de aceite
Cada teste usa um `Runtime` fake em TS.
```gherkin
# AC-1
Cenário: início parado
  Dado o Elevator no T
  Quando o primeiro Tick roda
  Então o Runtime recebe o Event idle

# AC-2
Cenário: move_to leva ao andar e abre as portas
  Dado o Elevator Idle no T
  Quando o aluno chama move_to(3)
  Então o Elevator chega ao 3 em 30 Tick, abre as portas e o Runtime recebe stop(3)

# AC-3
Cenário: passa direto por andar que não é Target
  Dado o Elevator indo do T ao 6 e o CallButton do 3 aceso
  Quando o Elevator alcança o 3
  Então ele não para e o CallButton do 3 continua aceso

# AC-4
Cenário: novo Target à frente substitui o anterior
  Dado o Elevator subindo para o 10, entre o 2 e o 3
  Quando o aluno chama move_to(5)
  Então o Elevator para no 5, não no 10

# AC-5
Cenário: Target para trás inverte no próximo andar
  Dado o Elevator subindo, entre o 4 e o 5
  Quando o aluno chama move_to(2)
  Então o Elevator alcança o 5 sem abrir as portas, inverte e para no 2

# AC-6
Cenário: chamada no andar atual exige move_to
  Dado o Elevator Idle no T
  Quando alguém aperta o CallButton do T e o aluno não emite Command
  Então as portas continuam fechadas e o CallButton do T continua aceso

# AC-7
Cenário: embarque e desembarque ao parar
  Dado o Passenger A esperando no 4 para o 8 e B a bordo para o 4
  Quando o Elevator para no 4
  Então B chega, A embarca, o CallButton do 4 apaga e o Runtime recebe stop(4) e depois cabin_button(8)

# AC-8
Cenário: botão já aceso não gera Event
  Dado o CabinButton do 8 aceso
  Quando outro Passenger embarca para o 8
  Então nenhum cabin_button(8) novo é enviado

# AC-9
Cenário: fim do DoorCycle
  Dado o Elevator parado no 4 sem Target
  Quando passam 20 Tick
  Então as portas fecham e o Runtime recebe idle

# AC-10
Cenário: determinismo independente do Runtime
  Dado o mesmo Scenario e o mesmo controlador fake
  Quando o Runtime responde em 0 ms numa execução e em 50 ms na outra
  Então a sequência de SimulationState por Tick é idêntica

# AC-11
Cenário: erro do aluno para a simulação
  Dado um Runtime que devolve error
  Quando o Tick roda
  Então status vira error, o erro entra no log e step() não avança mais o tick
```

## Plano
- [x] `packages/engine` com Vitest: tipos em `src/types.ts`, `Elevator`, botões, embarque e laço do `Tick` (AC-1..AC-11)

## Notas
- `move_to` fora do prédio (ou `elevator` inexistente): barrado no `Runtime` (SPEC-002); o `Engine` ignora e registra no log.
- `move_to(current_floor)` com portas abertas no andar: `Target` some, sem novo `DoorCycle`.
