---
id: SPEC-006
status: draft
parents: [RF-10]
related: [SPEC-003, SPEC-004, SPEC-005, RNF-04]
---

# SPEC-006: Editor de Scenario — "Meu cenário"

**Escopo:** modo "Meu cenário" no seletor, com painel para montar a lista de `Passenger` de um `CustomScenario`. **Módulo:** `apps/web`.
**Fora:** prédio e `start_floor` configuráveis (RF-12); métricas (RF-11); importar/exportar e link compartilhado (Fase 5); reordenar arrastando.

## Comportamento
- Seletor: `Modo livre` · **`Meu cenário`** · cenários fixos. Usa o formato `Scenario` (SPEC-003 §Contratos), sem mudar o `Engine`.
- `CustomScenario` fixo: `id: "custom"`, prédio 0–10, `start_floor` 0; aluno edita `time_limit_s` e `passengers`.
- Em "Meu cenário" a aba **Enunciado** vira **Cenário** (o painel) e é selecionada ao entrar no modo.
- Primeira vez: 1 `Passenger` `A`, 0 s, T → 5; limite 120 s.

```
┌ Cenário ─────────────────────────────────────────────┐
│ Limite de tempo [ 120 ] s                            │
│ 🧍 A  Aparece em [ 0,0 ] s  De [ T ▾]  Para [ 5 ▾]  ✕ │
│ 🧍 B  Aparece em [ 2,0 ] s  De [ 3 ▾]  Para [ T ▾]  ✕ │
│ [ + Adicionar pessoa ]                               │
└──────────────────────────────────────────────────────┘
```
- **Linha:** `Avatar` gerado pelo `id` (o mesmo do prédio, SPEC-005 §Avatar), `id`, e 3 seletores:
  - **Aparece em (s):** número ≥ 0, passo 0,1; ao sair do campo arredonda para 0,1 e limita a `time_limit_s`.
  - **De / Para:** listas T…10 com `floorLabel`. "Para" não oferece o andar de "De"; mudar "De" para o andar de "Para" troca os dois.
- **Adicionar pessoa:** `id` = próxima letra livre (A…Z, máx. 26); `at_s` = maior `at_s` + 2 (limitado); T → 5.
- **✕ Remover:** some a linha; desabilitado quando resta 1.
- **Lista exibida na ordem de inclusão;** o `Engine` já ordena por `at_s`.
- **Congelamento:**
  - Painel desabilitado (`fieldset disabled`) com fase `running` ou `paused`.
  - Em `ready` e `finished`, editar chama `simulation.select(custom)`: volta o estado inicial.
  - `CallButton` e `CabinButton` do prédio desabilitados em "Meu cenário", como nos cenários fixos.
- **Validação:** `validateScenario` do `Engine`; mensagem em PT abaixo da lista e "Rodar" desabilitado se inválido.
- **Persistência:** `localStorage` (`elevator-challenge:custom-scenario`), com `try/catch`; dado salvo inválido → cenário inicial.

## Critérios de aceite
Testes com Testing Library.
```gherkin
# AC-1
Cenário: entrar em Meu cenário
  Dado um navegador sem dados salvos
  Quando o aluno escolhe "Meu cenário"
  Então a aba Cenário abre com uma linha: Avatar de A, 0,0 s, de T para 5, e limite 120 s

# AC-2
Cenário: adicionar pessoa
  Dado o painel com a pessoa A em 0,0 s
  Quando o aluno clica "Adicionar pessoa"
  Então aparece a linha B com Avatar próprio, 2,0 s, de T para 5

# AC-3
Cenário: remover pessoa
  Dado o painel com A e B
  Quando o aluno remove A
  Então só B fica na lista e o botão de remover dela fica desabilitado

# AC-4
Cenário: origem e destino nunca iguais
  Dado A de T para 5
  Quando o aluno muda "De" para 5
  Então A fica de 5 para T e "Para" não oferece o 5

# AC-5
Cenário: rodar o cenário montado
  Dado B aparecendo em 3,0 s no 6 indo para T
  Quando o aluno clica Rodar
  Então em 3,0 s o Avatar de B espera no 6 e a aba Eventos mostra call_button(6)

# AC-6
Cenário: painel congelado durante a execução
  Dado "Meu cenário" rodando ou pausado
  Quando o aluno olha o painel
  Então campos, "Adicionar pessoa" e remover estão desabilitados até Reiniciar ou terminar

# AC-7
Cenário: botões do prédio congelados
  Dado "Meu cenário" rodando
  Quando o aluno tenta clicar no CallButton do 6 ou no CabinButton do 2
  Então os botões estão desabilitados e nenhum Event novo aparece

# AC-8
Cenário: editar depois de terminar
  Dado "Meu cenário" terminado com "Tempo esgotado"
  Quando o aluno muda o destino de A
  Então o aviso some, o relógio volta a 0,0 s e o Elevator volta ao T

# AC-9
Cenário: cenário salvo no navegador
  Dado que o aluno montou A, B e C e limite 90 s
  Quando recarrega a página e escolhe "Meu cenário"
  Então a mesma lista e o mesmo limite voltam
```

## Plano
- [ ] glossário: `CustomScenario` em `docs/requirements.md`
- [ ] `src/customScenario.ts`: inicial, adicionar, remover, editar campo, troca De/Para, `toScenario` (AC-1..AC-4)
- [ ] `src/storage.ts`: `loadCustomScenario` / `saveCustomScenario` (AC-9)
- [ ] `components/ScenarioEditor.tsx` + linha com `AvatarFigure` (AC-1..AC-4, AC-6)
- [ ] `Controls.tsx`: opção `CUSTOM_MODE`; `App.tsx`: aba Cenário, congelamento, reset ao editar (AC-5..AC-8)
- [ ] textos em `i18n/pt-BR.ts`; estilos em `styles.css`
- [ ] `docs/architecture.md`: SPEC-006 na linha de `apps/web`
- [ ] testes AC-1..AC-9

## Notas
- Sem §Contratos: reusa `Scenario` (SPEC-003); `Engine` e `Runtime` não mudam.
- RNF-04: mesma lista = mesma execução; letra reaproveitada após remover = mesmo `Avatar`.
- Editar em `ready` recria o `Engine` a cada mudança; custo baixo (sem `Runtime.load`).
