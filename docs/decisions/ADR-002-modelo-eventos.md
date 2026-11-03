---
id: ADR-002
status: draft
related: [RF-03, RNF-04, RNF-07]
---

# ADR-002: Aluno reage a eventos; o Engine é dono do tempo

- **Contexto:** o desafio é decidir o movimento a cada estímulo, sem lidar com física, portas
  ou relógio. Precisa ser determinístico (RNF-04) e independente de linguagem (RNF-07).
- **Decisão:**
  - O aluno escreve `Handler` (`on_call_button`, `on_cabin_button`, `on_stop`, `on_idle`) e só
    emite `Command` (`move_to`); o `Engine` aplica RN-01 a RN-09.
  - `move_to` define um único `Target` (não é fila): guardar pendências é parte do desafio.
  - O `Engine` pausa o relógio enquanto o `Runtime` responde: o tempo simulado não depende da
    velocidade do código nem da máquina.
  - Estado do aluno vive em variáveis globais do módulo, preservadas entre `Event`.
- **Alternativas:**
  - Função `tick(state) -> action` chamada a cada `Tick` — mais simples de traduzir, mas obriga o
    aluno a lidar com tempo e é pouco natural para iniciante.
  - `move_to` com fila interna — resolve metade do desafio pelo aluno.
  - Código bloqueante (`elevator.move_to(5)` espera chegar) — exige threads/async e quebra o determinismo.
- **Consequências:** + contrato pequeno, vira JSON entre linguagens · − multi-elevador (RF-14) muda a
  assinatura dos `Handler` (nova versão da API).
