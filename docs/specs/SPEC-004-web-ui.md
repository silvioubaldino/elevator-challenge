---
id: SPEC-004
status: review
parents: [RF-01, RF-02, RF-04, RF-05, RF-06, RF-07, RF-08, RF-09]
related: [SPEC-001, SPEC-002, SPEC-003, RNF-05, RNF-06, SPEC-009]
---

# SPEC-004: Web UI — editor, prédio animado e controles

**Escopo:** tela única que liga editor, `Engine` e `Runtime`. **Módulo:** `apps/web`.
**Fora:** editor de `Scenario` (RF-10), métricas (RF-11), celular (SPEC-007).

## Layout
```
┌ Elevator Challenge · [Modo livre ▾] · ▶ Rodar ⏸ Pausar ⟲ Reiniciar · 1× 2× 4× · 12,3 s ┐
├─────────────────────────────────┬──────────────────────────────────────────────────┤
│ [Código | Enunciado | API]      │  10 (○)   │   │        ┌ Painel ┐               │
│                                 │   9 (○)   │   │        │ 9   10 │               │
│  editor Python (CodeMirror)     │   …       │▓▓▓│ ↑ 3    │ …   …  │               │
│                                 │   T (●) 🧍│   │        └ T   1  ┘               │
│                                 ├──────────────────────────────────────────────────┤
│ [Restaurar template]            │ [Saída | Eventos]                                │
└─────────────────────────────────┴──────────────────────────────────────────────────┘
```
- Esquerda: abas com o código, o enunciado do `Scenario` e a referência da API (SPEC-002 §Contratos).
- Direita: poço com andares, `CallButton` por andar, `Passenger` esperando; cabine com portas, display de andar/sentido e contagem a bordo; painel de `CabinButton` ao lado; console embaixo.
- Tema claro/escuro pelo sistema; botões acesos com cor de destaque.

## Critérios de aceite
Testes com Playwright ou Testing Library.
```gherkin
# AC-1
Cenário: primeira visita
  Dado um navegador sem dados salvos
  Quando o site abre
  Então o editor mostra o template, "Modo livre" está selecionado, o Elevator está no T
  E "Rodar" fica desabilitado com "Carregando Python…" até o Runtime ficar pronto

# AC-2
Cenário: rodar, pausar e reiniciar
  Dado um Scenario selecionado e o Runtime pronto
  Quando o aluno clica Rodar, depois Pausar, depois Reiniciar
  Então a simulação anda, congela no tick atual e volta ao estado inicial com o código atual

# AC-3
Cenário: velocidade
  Dado a simulação rodando
  Quando o aluno escolhe 4×
  Então o relógio simulado avança 4 s por segundo real e o resultado final é o mesmo que em 1×

# AC-4
Cenário: Modo livre
  Dado "Modo livre" rodando
  Quando o aluno clica no CallButton do 6 e no CabinButton do 2
  Então os dois acendem e a aba Eventos mostra call_button(6) e cabin_button(2)

# AC-5
Cenário: Passenger visíveis
  Dado o Scenario on-the-way rodando
  Quando B aparece no 5
  Então há um ícone esperando no 5, que entra na cabine na parada e some ao chegar no 9

# AC-6
Cenário: erro do aluno
  Dado código que lança exceção na linha 7
  Quando a simulação roda
  Então ela para, um aviso mostra a mensagem e a linha 7 fica destacada no editor

# AC-7
Cenário: resultado
  Dado um Scenario rodando
  Quando ele termina
  Então aparece "Concluído em 14,0 s" ou "Tempo esgotado" com os Passenger que não chegaram

# AC-8
Cenário: código salvo no navegador
  Dado que o aluno editou o código
  Quando recarrega a página
  Então o código editado volta; "Restaurar template" pede confirmação e volta ao template

# AC-9
Cenário: textos em PT
  Dado qualquer tela
  Quando o aluno a vê
  Então rótulos, avisos e enunciados estão em PT-BR e o térreo aparece como T

# AC-10
Cenário: autocomplete da API
  Dado o editor com o código do aluno
  Quando o aluno digita "elevator." ou "on_" no início de uma linha
  Então o editor sugere as funções do elevator ou os Handler da API, com descrição em PT
  E escolher um Handler insere "def" com a assinatura e o corpo
```

## Plano
- [x] `apps/web` (Vite + React), layout em duas colunas redimensionáveis
- [x] `Building` em SVG/CSS animado a partir de `SimulationState` (AC-4, AC-5)
- [x] laço de execução: `step()` por `requestAnimationFrame` × velocidade (AC-2, AC-3)
- [x] editor CodeMirror + persistência em `localStorage` com `try/catch` (AC-1, AC-8)
- [x] console, aviso de erro e de resultado (AC-6, AC-7)
- [x] textos em `src/i18n/pt-BR.ts` (AC-9)
- [x] autocomplete das funções do `elevator` e dos `Handler` no editor (AC-10)
- [x] testes AC-1..AC-10

## Notas
- O laço de execução deve ser não-bloqueante (`step()` é assíncrono): a animação interpola `position`.
- Deploy no GitHub Pages: `.github/workflows/deploy.yml` (ADR-001).
