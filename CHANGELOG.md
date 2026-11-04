# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) + [SemVer](https://semver.org/).
Rules: newest on top · **one line per PR** (≤ 200 chars, PR link) · what was delivered, not how ·
on release, `## Unreleased` becomes `## [dd-MM-yyyy - vX.Y.Z]`.

## Unreleased

- Docs framework and Phase 1 (MVP) requirements, decisions and specs.
- `packages/engine`: simulador do `Elevator` e laço de `Tick` com `Runtime` (SPEC-001, AC-1..AC-11). [#1](https://github.com/silvioubaldino/elevator-challenge/pull/1)
- `packages/runtime-python`: `Runtime` em Python via Pyodide num Web Worker, com `template.py` e timeout (SPEC-002, AC-1..AC-9).
- `packages/engine`: formato de `Scenario`, validação, fim por sucesso/timeout e cenários `first-ride`, `on-the-way`, `zigzag` (SPEC-003, AC-1..AC-6).
- `apps/web`: editor, prédio animado, controles, console e persistência do código; deploy no GitHub Pages (SPEC-004, AC-1..AC-9).
