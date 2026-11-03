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

Tudo roda no navegador; o site é estático (GitHub Pages).

| Módulo | Papel | Spec |
|--------|-------|------|
| `packages/engine` | Tempo (`Tick`), regras RN-*, `Scenario`; sem DOM, sem linguagem | SPEC-001, SPEC-003 |
| `packages/runtime-python` | Carrega Pyodide num Worker, expõe a API do aluno, aplica timeout | SPEC-002 |
| `apps/web` | Editor, prédio animado, controles, console; persiste o código | SPEC-004 |

Dependências só no sentido `web → engine` e `web → runtime-python → engine` (tipos). `engine` não importa ninguém.
