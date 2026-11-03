---
id: ADR-001
status: draft
related: [RNF-01, RNF-02, RNF-03, RNF-07]
---

# ADR-001: Site estático com Python no navegador

- **Contexto:** site público, sem login e custo zero (RNF-01, RNF-02); código do aluno não pode
  travar a página (RNF-03); outras linguagens virão (RNF-07).
- **Decisão:**
  - Monorepo com npm workspaces: `apps/web`, `packages/engine`, `packages/runtime-python`.
  - TypeScript em tudo; UI em React + Vite; editor CodeMirror 6.
  - Python via Pyodide (WebAssembly, CDN) dentro de um Web Worker.
  - `Engine` em TS puro, testado com Vitest; o `Runtime` é uma interface (SPEC-001 §Contratos).
  - Deploy no GitHub Pages via GitHub Actions.
- **Alternativas:**
  - Backend executando código (Judge0/Piston) — sandbox, fila e servidor pagos antes de validar a ideia.
  - App local (pygame/Tkinter) — exige instalação, sem cara de LeetCode, difícil ter várias linguagens.
  - `Engine` em Python dentro do Pyodide — prenderia o simulador a uma linguagem (RNF-07).
  - Monaco — ~2 MB a mais que CodeMirror, sem ganho para o MVP.
- **Consequências:** + R$ 0, sem servidor para proteger, `Engine` testável em Node · − primeira carga
  do Pyodide (~10 MB, cacheada); cada `Event` batch cruza o Worker (assíncrono).
