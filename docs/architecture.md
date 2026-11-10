---
id: ARCH
status: draft
---

# Arquitetura (vigente)

Foto de hoje; o porquê mora nos ADR. Se divergir de um ADR, este doc vence.

```mermaid
flowchart LR
    student(["Aluno (navegador)"]) --> ui["apps/web<br/>UI React"]
    ui -->|step / click| engine["packages/engine<br/>simulador TS"]
    engine -->|Event batch + snapshot| rt["packages/runtime-python<br/>Web Worker + Pyodide"]
    rt -->|Command[]| engine
    engine -->|SimulationState| ui
```

Tudo roda no navegador; o site é estático (GitHub Pages, branch `gh-pages`: prod na raiz, staging em `/staging/`; ADR-004).

| Módulo | Papel | Spec |
|--------|-------|------|
| `packages/engine` | Tempo (`Tick`), regras RN-*, `Scenario`; sem DOM, sem linguagem | SPEC-001, SPEC-003, SPEC-009 |
| `packages/runtime-python` | Carrega Pyodide num Worker, expõe a API do aluno, aplica timeout | SPEC-002, SPEC-009 |
| `apps/web` | Editor, prédio animado, controles, console, editor de `Scenario`; persiste código e cenário | SPEC-004, SPEC-005, SPEC-006, SPEC-007, SPEC-009 |

Dependências só no sentido `web → engine` e `web → runtime-python → engine` (tipos). `engine` não importa ninguém.
