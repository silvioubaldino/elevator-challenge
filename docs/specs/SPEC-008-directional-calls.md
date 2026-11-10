---
id: SPEC-008
status: review
parents: [RF-13]
related: [SPEC-001, SPEC-002, SPEC-003, SPEC-004, RN-10, SPEC-009]
---

# SPEC-008: DirectionalCalls — botões subir e descer

**Escopo:** modo do `Building` com `CallButton` `up` e `down` por andar, embarque por `Direction` (RN-10) e interruptor na UI.
**Módulos:** `packages/engine`, `packages/runtime-python`, `apps/web`. **Fora:** "só desce" (RF-13), `Scenario` que guarda o modo no editor (RF-10).

- Contratos nas donas: `Event`, `SimulationState`, `press` (SPEC-001 §Contratos), `building.directional_calls` (SPEC-003 §Contratos), `on_call_button` (SPEC-002 §Contratos).
- O interruptor da UI vale para qualquer `Scenario` e para o `Sandbox`; sobrepõe `building.directional_calls`.
- `Direction` do `Passenger` deriva de `from→to`. Desligado, tudo se comporta como antes (`direction` = `null`).

## Critérios de aceite
```gherkin
# AC-1
Cenário: botões independentes por andar
  Dado DirectionalCalls ligado e um prédio de T a 10
  Quando A aparece no 3 indo ao 7 e B aparece no 3 indo ao 1
  Então o Runtime recebe call_button(3, up) e call_button(3, down) e os dois botões acendem

# AC-2
Cenário: extremos têm um botão só
  Dado DirectionalCalls ligado e um prédio de T a 10
  Quando se aperta down no T e up no 10
  Então nenhum botão acende e nenhum Event é enviado

# AC-3
Cenário: não embarca quem vai no sentido contrário
  Dado o Elevator subindo e B esperando no 5 para o 2
  Quando o aluno faz o Elevator parar no 5
  Então as portas abrem, B não embarca, o botão down do 5 continua aceso e o Elevator segue depois de fechar

# AC-4
Cenário: embarca quem vai no mesmo sentido
  Dado o Elevator subindo, A esperando no 5 para o 8 e B esperando no 5 para o 2
  Quando o Elevator para no 5
  Então só A embarca, o botão up do 5 apaga e o Runtime recebe cabin_button(8)

# AC-5
Cenário: parado atende qualquer sentido
  Dado o Elevator Idle no 5 e B esperando no 5 para o 2
  Quando o aluno chama move_to(5)
  Então B embarca e o botão down do 5 apaga

# AC-6
Cenário: nos extremos o sentido se inverte
  Dado o Elevator subindo e B esperando no 10 para o 4
  Quando o Elevator para no 10
  Então B embarca

# AC-7
Cenário: Handler recebe a direção
  Dado on_call_button com 3 parâmetros e outro código com 2 parâmetros
  Quando o Runtime recebe call_button(3, down)
  Então o primeiro vê "down" e o segundo roda sem erro

# AC-8
Cenário: interruptor na tela
  Dado a simulação parada
  Quando o aluno liga "Botões subir/descer"
  Então cada andar mostra os botões subir e descer (menos descer no T e subir no 10), a escolha sobrevive ao recarregar e o interruptor fica desabilitado durante a execução
```

## Plano
- [x] `packages/engine`: botões por `Direction`, embarque por sentido de chegada (AC-1..AC-6)
- [x] `packages/runtime-python`: `direction` por aridade do `Handler` (AC-7)
- [x] `apps/web`: interruptor, botões `up`/`down` no prédio, persistência (AC-8)
- [x] testes AC-1..AC-8

## Notas
- Sentido de chegada = sentido do movimento ao parar; no mais baixo vale `up`, no mais alto `down`; sem movimento, todos embarcam.
- Quem não embarcou fica com o botão aceso e sem novo `Event` (RN-06): o aluno precisa lembrar e voltar.
