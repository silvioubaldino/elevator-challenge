---
id: SPEC-009
status: draft
parents: [RF-14]
related: [ADR-003, SPEC-001, SPEC-002, SPEC-003, SPEC-004, SPEC-006, RN-11]
---

# SPEC-009: Fleet — múltiplos Elevator e ServiceElevator

**Escopo:** `Fleet` de 1 a 3 `Elevator`, `ServiceElevator`, `CallButton` por tipo (RN-11) e seletor na UI.
**Módulos:** `packages/engine`, `packages/runtime-python`, `apps/web`. **Fora:** capacidade (RF-15), nota/ranking.

- Contratos nas donas: `Event`, `Command`, `EventBatch`, `SimulationState`, `press` (SPEC-001 §Contratos), `building.elevators` e `passengers[].service` (SPEC-003 §Contratos), `on_call_button`, `id`/`is_service`/`fleet` (SPEC-002 §Contratos).
- Frota = `building.elevators`; a UI sobrepõe por `createEngine({ fleet })`, como `directionalCalls` (SPEC-008).
- Compatível: um `Elevator` não muda código, `Scenario`, `Event` nem log; o código antigo (2 ou 3 parâmetros) roda sem mudar.
- Campos novos só aparecem quando valem (`service: true`, `elevator` em 2+ `Elevator`).
- `elevator.id()` = posição na frota; o 0 nunca é de serviço.
- Despacho é do aluno: o `Event` traz o tipo; qual `Elevator` atende (ex.: o mais próximo) é lógica dele.

## Critérios de aceite
```gherkin
# AC-1
Cenário: um elevador não muda
  Dado um Building com um Elevator
  Quando o Runtime recebe o primeiro batch
  Então events é [idle] sem campo elevator e elevators tem 1 item igual a elevator

# AC-2
Cenário: move_to escolhe o elevador
  Dado dois Elevator no T
  Quando o aluno emite move_to(3) para o elevator 1
  Então só o 1 chega ao 3

# AC-3
Cenário: Event traz quem o gerou
  Dado dois Elevator e o 1 parando no 2
  Quando o Elevator para
  Então o Runtime recebe stop(2) com elevator 1

# AC-4
Cenário: serviço e comum não se misturam
  Dado um Elevator comum e um de serviço parando no 4, com A comum e S de serviço esperando lá
  Quando os dois param no 4
  Então A embarca no comum e S no de serviço

# AC-5
Cenário: CallButton por tipo
  Dado um Building com Elevator de serviço
  Quando A comum e S de serviço aparecem no 4
  Então dois botões acendem e o Runtime recebe call_button(4) e call_button(4, service)

# AC-6
Cenário: Elevator comum parado não apaga o botão de serviço
  Dado o botão de serviço do T aceso e o Elevator comum parando no T
  Quando as portas abrem
  Então o botão de serviço continua aceso

# AC-7
Cenário: Handler recebe o tipo da chamada
  Dado on_call_button com 4 parâmetros e outro código com 2
  Quando o Runtime recebe call_button(4, service)
  Então o primeiro vê service verdadeiro com o Elevator de serviço e o segundo roda sem erro

# AC-8
Cenário: fleet lista todos
  Dado um Building com dois Elevator
  Quando o Handler chama elevator.fleet()
  Então vê id e is_service de cada um e fleet()[1].move_to(8) move o elevator 1

# AC-9
Cenário: Scenario inválido
  Dado 4 Elevator, ou o primeiro de serviço, ou Passenger de serviço sem Elevator de serviço
  Quando o Scenario é carregado
  Então é rejeitado com mensagem em PT

# AC-10
Cenário: seletor na tela
  Dado a simulação parada
  Quando o aluno escolhe 2 ou 3 elevadores e marca o segundo como de serviço
  Então o prédio mostra um poço por elevador, os botões de serviço aparecem, o painel da cabine tem uma aba por elevador, a escolha sobrevive ao recarregar e fica desabilitada durante a execução

# AC-11
Cenário: Passenger de serviço no editor
  Dado "Meu cenário" e nenhum elevador de serviço
  Quando o aluno marca um elevador de serviço
  Então cada Passenger ganha a opção "serviço"; desmarcar o elevador a esconde e a execução segue sem erro
```

## Plano
- [x] `packages/engine`: `Fleet`, tipo por botão, `elevator` nos `Event`/`Command`, validação (AC-1..AC-6, AC-9)
- [x] `packages/runtime-python`: `id`/`is_service`/`fleet`, `Handler` por aridade, template (AC-7, AC-8)
- [x] `apps/web`: seletor, poços, botões de serviço, abas do painel, editor de `Scenario` (AC-10, AC-11)
- [x] testes AC-1..AC-11

## Notas
- Dois `Elevator` do mesmo tipo no mesmo andar: embarca o de menor `id` (RN-11).
- `Passenger` de serviço de `Scenario` fixo não existe: os três `Scenario` fixos rodam com qualquer frota.
- Desligar o `ServiceElevator` mantém os `Passenger` marcados no editor, mas eles viram comuns na execução.
- Dials de andar só aparecem com 1 `Elevator`; com 2+, a tela da cabine mostra o andar.
