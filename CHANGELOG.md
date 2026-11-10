# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) + [SemVer](https://semver.org/).
Rules: newest on top · **one line per PR** (≤ 200 chars, PR link) · what was delivered, not how ·
on release, `## Unreleased` becomes `## [dd-MM-yyyy - vX.Y.Z]`.

## Unreleased

- `engine`, `runtime-python`, `apps/web`: 1 a 3 `Elevator` e `ServiceElevator`: `CallButton` por tipo, `Event` com `elevator`, `elevator.fleet()`/`id()`/`is_service()` e seletor na UI; um `Elevator` não muda (SPEC-009, AC-1..AC-11).

- `engine`, `runtime-python`, `apps/web`: interruptor "Botões subir/descer" (`DirectionalCalls`): `CallButton` `up`/`down` por andar, `on_call_button` com `direction` e embarque só no sentido do `Elevator` (SPEC-008, AC-1..AC-8).
- `apps/web`: corrige a rolagem no celular: cada seção rola por dentro e a página não quica nem recarrega ao arrastar o dedo (SPEC-007, AC-7).
- `apps/web`: layout para celular com uma seção por vez, navegação inferior, Rodar levando ao prédio, "Ver linha N" no erro e barra de atalhos no editor (SPEC-007, AC-1..AC-6).
- `apps/web`: autocomplete no editor para as funções do `elevator` e para os `Handler`, com descrição em PT (SPEC-004, AC-10).
- `apps/web`: editor de código com tema VS Code Dark+ (cores, realce de sintaxe, linha ativa e seleção).
- `apps/web`: modo "Meu cenário" com painel para montar a lista de `Passenger` (instante, origem, destino), congelado durante a execução (SPEC-006, AC-1..AC-9).
- Docs framework and Phase 1 (MVP) requirements, decisions and specs.
- `packages/engine`: simulador do `Elevator` e laço de `Tick` com `Runtime` (SPEC-001, AC-1..AC-11). [#1](https://github.com/silvioubaldino/elevator-challenge/pull/1)
- `packages/runtime-python`: `Runtime` em Python via Pyodide num Web Worker, com `template.py` e timeout (SPEC-002, AC-1..AC-9).
- `packages/engine`: formato de `Scenario`, validação, fim por sucesso/timeout e cenários `first-ride`, `on-the-way`, `zigzag` (SPEC-003, AC-1..AC-6).
- `apps/web`: editor, prédio animado, controles, console e persistência do código; deploy no GitHub Pages (SPEC-004, AC-1..AC-9).
- `apps/web`: prédio em estilo animação 3D com `Avatar` para cada `Passenger`, portas animadas e painel de latão (SPEC-005, AC-1..AC-8).
