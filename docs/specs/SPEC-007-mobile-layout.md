---
id: SPEC-007
status: draft
parents: [RF-01, RF-02, RF-04, RF-06]
related: [SPEC-004, SPEC-006, RNF-06]
---

# SPEC-007: Layout para celular

**Escopo:** tela única da SPEC-004 usável no celular (≥ 360 px), retrato e paisagem. **Módulo:** `apps/web`.
**Fora:** PWA/offline; gestos (swipe entre seções); teclado próprio para o editor.

## Comportamento
- **Corte:** largura < 900 px → layout compacto; ≥ 900 px → duas colunas da SPEC-004 (tablet em paisagem incluso).
- **Uma seção por vez**, escolhida na navegação inferior: `Prédio` · `Código` · `Enunciado`/`Cenário` · `API`.

```
┌ [Modo livre ▾]           12,3 s ┐   topo: cenário + relógio
│                                 │
│  seção ativa (rola sozinha)     │
│                                 │
├ [▶ Rodar     ] [⟲ Reiniciar] 1× 2× 4× ┤   ao alcance do polegar
├ Prédio │ Código │ Enunciado │ API ┤
└─────────────────────────────────┘
```
- **Prédio:** prédio dimensionado para caber com o painel de `CabinButton` (6 por linha) sem rolar; console abaixo.
  Em paisagem, painel ao lado do prédio e controles + navegação numa linha só.
- **Rodar/Pausar:** um único botão principal que alterna; **Rodar leva ao Prédio**.
- **Erro do aluno:** aviso fixo no topo do Prédio com **"Ver linha N"** → abre Código com o cursor na linha (vale no desktop).
- **Escolher "Meu cenário"** abre a seção Cenário (SPEC-006).
- **Código:**
  - quebra de linha com recuo das continuações; fonte 16 px (evita zoom do iOS); sem coluna de dobra;
  - com o editor focado, controles e navegação somem e aparece a **barra de atalhos**: `⇥` `⇤` `:` `(` `)` `_` `.` `=` `"` `[` `]` `,` `#` e **Pronto** (fecha o teclado);
  - tocar num atalho não tira o foco do editor; indentação de 4 espaços (igual ao template).
- **Toque:** alvos ≥ 40 px; `CallButton` com área de toque maior que o desenho; sem zoom por toque duplo.
- **Teclado virtual:** a altura do app segue a área visível (`visualViewport`); respeita áreas seguras do aparelho.

## Critérios de aceite
Testes com Testing Library (`matchMedia` simulado); visual conferido com Playwright em 360, 390 e paisagem.
```gherkin
# AC-1
Cenário: uma seção por vez
  Dado o site aberto num celular
  Quando o aluno toca em Código e depois em API
  Então só o editor aparece e depois só a referência da API, com a aba tocada selecionada

# AC-2
Cenário: Meu cenário abre o painel
  Dado o site aberto num celular
  Quando o aluno escolhe "Meu cenário"
  Então a seção Cenário fica selecionada e mostra o limite de tempo

# AC-3
Cenário: rodar leva ao prédio
  Dado o Runtime pronto e a seção Código aberta num celular
  Quando o aluno toca em Rodar
  Então a seção Prédio aparece e o botão principal vira Pausar

# AC-4
Cenário: do erro para a linha
  Dado um erro do aluno na linha 3
  Quando o aluno toca em "Ver linha 3"
  Então a seção Código abre com o cursor na linha 3

# AC-5
Cenário: barra de atalhos
  Dado o editor focado num celular com o cursor depois de "x"
  Quando o aluno toca em ":" e depois em ⇥
  Então o código vira "    x:" e o editor continua focado

# AC-6
Cenário: computador sem mudanças
  Dado o site aberto numa tela com 900 px ou mais
  Quando o aluno o vê
  Então código e prédio aparecem lado a lado, sem navegação inferior nem barra de atalhos
```

## Plano
- [x] `src/viewport.ts`: `useCompactLayout` (`matchMedia`) e altura visível (`visualViewport`)
- [x] `components/SectionNav.tsx` e `App.tsx`: seção ativa, Rodar → Prédio, "Ver linha N" (AC-1..AC-4)
- [x] `components/Controls.tsx`: topo, controles e relógio em áreas separadas do grid; Rodar/Pausar alternado (AC-3)
- [x] `components/CodeEditor.tsx`: barra de atalhos, quebra de linha, `reveal(line)`, indentação 4 (AC-4, AC-5)
- [x] `styles.css`: grid por áreas, `@media (max-width: 899px)` e paisagem; `index.html`: `viewport-fit`, `interactive-widget`
- [x] testes AC-1..AC-6

## Notas
- Sem §Contratos: só UI; `Engine` e `Runtime` não mudam.
- Abas do desktop e navegação inferior não coexistem no DOM: a escolha é por `matchMedia`, não só CSS.
- iOS não encolhe o layout com o teclado; por isso `--app-height` vem do `visualViewport` (ignorado com zoom de pinça).
