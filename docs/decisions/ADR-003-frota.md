---
id: ADR-003
status: draft
related: [RF-14, ADR-002, SPEC-009]
---

# ADR-003: Frota sem quebrar a API de um elevador

- **Contexto:** RF-14 pede vários `Elevator`; o ADR-002 previa nova assinatura dos `Handler`. O código
  de um `Elevator` deve continuar valendo sem edição.
- **Decisão:**
  - `elevator` continua o 1º parâmetro de todo `Handler`; é o que gerou o `Event` (em `on_call_button`, o 1º do tipo do botão).
  - `elevator.fleet()` devolve todos; `move_to` vale para o `Elevator` em que foi chamado.
  - `service` entra em `on_call_button` por aridade, como `direction` (SPEC-008).
  - `CallButton` é por tipo (comum ou serviço), não por `Elevator`: o aluno despacha.
  - Campos novos de `Event`/`SimulationState` só aparecem quando valem.
- **Alternativas:**
  - Novo `Handler` com `building` — dois formatos para o aluno aprender.
  - Engine despacha sozinho — tira o desafio central.
  - Botão por `Elevator` — não existe em prédio real e esconde o despacho.
- **Consequências:** + código de 1 `Elevator` e testes antigos intactos · − `elevator` em `on_call_button` é só um ponto de partida; o aluno precisa usar `fleet()`.
