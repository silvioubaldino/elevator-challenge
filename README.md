# Elevator Challenge

Desafio de programação estilo LeetCode, com interface visual: você escreve em Python a lógica de um
elevador e vê o resultado animado. Mover, abrir portas e embarcar pessoas já está pronto; o desafio é
decidir **para onde ir** a cada botão apertado.

```python
def on_call_button(elevator, floor):
    elevator.move_to(floor)   # e se ele já estiver indo para outro andar?
```

## Status
Fase 1 (MVP) em especificação: 1 elevador, T ao 10, botão "chamar" por andar, 3 cenários.
Roadmap em [`docs/requirements.md`](docs/requirements.md#fases).

## Estrutura
```
apps/web/                 UI (React + Vite)                 — SPEC-004
packages/engine/          simulador + cenários (TS puro)    — SPEC-001, SPEC-003
packages/runtime-python/  Python no navegador (Pyodide)     — SPEC-002
docs/
  requirements.md         RF, RNF, RN, fases, glossário
  architecture.md         módulos e dependências
  decisions/              ADR (append-only)
  specs/                  SPEC: contrato + aceite + plano
  scripts/validate.py     valida frontmatter, refs, AC ↔ teste e tamanho
CHANGELOG.md
```

Regras de escrita e ciclo dos docs: [`CLAUDE.md`](CLAUDE.md).

Validar os docs (Python 3, sem deps):
```sh
python3 docs/scripts/validate.py
```
