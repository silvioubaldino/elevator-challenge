---
id: SPEC-003
status: draft
parents: [RF-05, RF-08]
related: [SPEC-001, SPEC-008, RN-09]
---

# SPEC-003: Scenario — formato e cenários fixos do MVP

**Escopo:** formato do `Scenario`, chegada de `Passenger`, fim (RN-09) e 3 cenários com conflito.
**Módulo:** `packages/engine` (`src/scenario.ts`, `scenarios/*.json`). **Fora:** editor de cenário (RF-10).

## Contratos
```ts
type Scenario = {
  id: string; title: string; description: string        // title/description em PT (UI)
  building: { min_floor: number; max_floor: number; directional_calls?: boolean }   // default false (SPEC-008)
  start_floor: number; time_limit_s: number
  passengers: { id: string; at_s: number; from: number; to: number }[]   // at_s múltiplo de 0,1
}
```
- Em `at_s` o `Passenger` aparece em `from` e aperta o `CallButton` (RN-06). Portas abertas no andar → embarca direto, sem `Event`.
- A "ação" (subir/descer) deriva de `from`/`to`; vira `direction` na Fase 3 (RF-13).
- `Sandbox` = `Scenario` implícito: prédio 0–10, `start_floor` 0, sem `Passenger`, sem `time_limit_s`.

## Cenários fixos
Tempos com SPEC-001 (1 s/andar, portas 2 s). "Ótimo" = referência que atende no caminho.

| id | Título | Início | Passenger (`at_s`: from→to) | Limite | Conflito |
|----|--------|--------|----------------------------|--------|----------|
| `first-ride` | Primeira viagem | T | A 0: 0→7 | 30 s | Chamada no andar atual exige `move_to(0)` (RN-03) |
| `on-the-way` | Parada no caminho | T | A 0: 0→10 · B 4: 5→9 | 60 s | "Último `move_to` vence" esquece A; fila FIFO passa por B e volta |
| `zigzag` | Zigue-zague | 5 | A 0: 1→0 · B 0,5: 9→10 · C 1: 2→0 | 90 s | FIFO faz 5→1→9→2→0→10; ótimo desce tudo e depois sobe |

## Critérios de aceite
```gherkin
# AC-1
Cenário: chegada de Passenger
  Dado um Scenario com A em at_s 2 no andar 4
  Quando o Tick 20 roda
  Então A aparece esperando no 4 e o Runtime recebe call_button(4)

# AC-2
Cenário: chegada com portas abertas
  Dado o Elevator de portas abertas no 4
  Quando um Passenger aparece no 4
  Então ele embarca sem call_button e o Runtime recebe cabin_button do seu destino

# AC-3
Cenário: sucesso
  Dado um Scenario em andamento
  Quando o último Passenger chega
  Então status vira success com o tempo de chegada dele

# AC-4
Cenário: tempo esgotado
  Dado um Scenario com time_limit_s 30
  Quando o Tick 300 roda com Passenger sem chegar
  Então status vira timeout e os Passenger pendentes aparecem no estado

# AC-5
Cenário: Scenario inválido
  Dado um Scenario com from igual a to, andar fora do building ou id repetido
  Quando ele é carregado
  Então é rejeitado com mensagem em PT indicando o Passenger

# AC-6
Cenário: cenários fixos geram conflito
  Dado os controladores de referência FIFO, último-vence e ótimo (fakes em TS)
  Quando cada um roda on-the-way e zigzag
  Então ótimo termina antes de FIFO e último-vence dá timeout em on-the-way
```

## Plano
- [x] `src/scenario.ts`: tipo, validação e injeção de `Passenger` no `Tick` (AC-1, AC-2, AC-5)
- [x] fim do `Scenario` no laço do `Engine` (AC-3, AC-4)
- [x] `scenarios/first-ride.json`, `on-the-way.json`, `zigzag.json`
- [x] controladores de referência em `test/controllers/` (AC-6)
- [x] testes AC-1..AC-6

## Notas
- Fim do `Scenario`: `tick` para no instante da chegada (success) ou do limite (timeout); tempo = `tick` × 0,1 s.
- Em timeout, `Passenger` que nem apareceu entra em `passengers` como `waiting`.
- Validação roda em `createEngine`; erro é `ScenarioError`.
