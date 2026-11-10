---
id: SPEC-010
status: draft
parents: [RF-17]
related: [SPEC-004, SPEC-008, SPEC-009]
---

# SPEC-010: Demo — desafio máximo resolvido

**Escopo:** botão `Demo` ao lado de Rodar/Pausar/Reiniciar; prepara o prédio mais complexo e roda uma solução oculta.
**Módulo:** `apps/web` (`src/demo/`). **Fora:** mostrar ou exportar a solução; novo contrato do `Engine`.

- Prédio: 0 a 10, `DirectionalCalls`, `Fleet` de 3 (`Elevator` 0 e 1 comuns, 2 de serviço).
- `Scenario` fixo próprio, fora de `SCENARIOS`: tráfego em paralelo, `Passenger` de serviço e subidas do mesmo andar (ex.: 5→8).
- A solução é uma string carregada sob demanda (`import()`); o editor, o código salvo e a aba API não a mostram.
- O site é estático (RNF-01): a solução viaja no bundle; não é sigilo, só não aparece na UI.
- Frota e `DirectionalCalls` do `Demo` não são persistidos; sair do `Demo` restaura a escolha do aluno.
- Enquanto no `Demo`, Rodar e Reiniciar usam a solução oculta, nunca o código do editor.

## Critérios de aceite
```gherkin
# AC-1
Cenário: Demo prepara o prédio máximo e roda
  Dado a simulação parada e o Runtime pronto
  Quando o aluno clica em Demo
  Então o prédio mostra 3 poços, botões subir/descer e botões de serviço, e a simulação começa a rodar

# AC-2
Cenário: a solução oculta conclui o Scenario
  Dado o Demo rodando
  Quando todos os Passenger chegam
  Então o status é success antes do limite de tempo

# AC-3
Cenário: o código do aluno fica intacto
  Dado código editado e salvo pelo aluno
  Quando o Demo roda
  Então o Runtime carrega a solução oculta, o editor e o código salvo continuam iguais e nenhuma aba mostra a solução

# AC-4
Cenário: sair do Demo restaura a escolha do aluno
  Dado o Demo ativo e a frota do aluno com 1 elevador
  Quando o aluno escolhe outro Scenario
  Então a frota e o DirectionalCalls voltam ao que o aluno tinha, e recarregar a página não mantém o Demo

# AC-5
Cenário: reiniciar no Demo roda a solução de novo
  Dado o Demo concluído
  Quando o aluno clica em Reiniciar e depois em Rodar
  Então o Runtime carrega a solução oculta de novo
```

## Plano
- [x] `src/demo/scenario.ts`, `solution.py`, `index.ts`
- [x] `Controls.tsx`, `App.tsx`, `pt-BR.ts`, `styles.css`
- [x] testes AC-1..AC-5 (solução com Pyodide real)
