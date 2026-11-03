# Elevator Challenge — monorepo

Desafio estilo LeetCode: o aluno escreve em Python a lógica de um elevador; o simulador e a UI já existem.
Docs e código no mesmo repo; `docs/` é a fonte da verdade.

## Comece por aqui
- @docs/requirements.md — requisitos, fases e glossário (use SEMPRE estes termos)
- @docs/architecture.md — módulos e dependências

## Mapa
| Prefixo | Doc | Onde | Ciclo |
|---------|-----|------|-------|
| RF / RNF / RN / GLO | Requisitos, regras, fases, glossário | `docs/requirements.md` | vivo |
| ARCH | Módulos e dependências | `docs/architecture.md` | vivo |
| ADR | Decisão de produto ou técnica | `docs/decisions/` | append-only |
| SPEC | Feature: contrato + aceite + plano | `docs/specs/` | congela o "o quê" ao aprovar |
| — | 1 linha por PR | `CHANGELOG.md` | vivo |

Fluxo: `RF → SPEC → código`. Decisões (ADR) penduram em `related`.

## Regras de escrita (valem para TODO doc)
- **Bullets > prosa.** Frase curta. Sem introdução nem resumo final.
- **Não repita.** Referencie por ID (`SPEC-001 §Contratos`), nunca copie.
- **Sem seção vazia** e **sem texto de template** (`<...>` sai do doc final).
- **Diagrama pequeno** (mermaid ou ASCII, ≤ ~15 linhas) quando substitui parágrafos.
- **Profundidade só onde decide algo:** contrato, critério de aceite, trade-off.
- **Edite no lugar** com o menor diff possível.
- **Tamanho máximo** (`TOO_LONG`): ADR 40 linhas · SPEC 120. Passou? Corte ou divida.
- Idioma: prosa em PT; termos do glossário, contratos, campos e enums em EN.

## Frontmatter
```yaml
---
id: SPEC-007           # PREFIXO-NNN, estável
status: draft          # draft | review | approved | done | superseded | deprecated
parents: [RF-03]       # SPEC: RF que ela entrega (obrigatório)
related: [ADR-002]     # opcional
superseded_by: ADR-009 # só ADR, só quando substituído
---
```
Título = o `# H1`. Novo doc: copie o `*-000-template.md` da pasta e use o próximo número.

## Regras do ciclo
- **Cada contrato tem uma SPEC dona** (§Contratos). As outras referenciam; não redefinem.
- **Gate ALIGN:** criar/alterar §Contratos, ADR ou RN exige "aprovado" explícito do humano antes de
  escrever. Apresente só o diff e os IDs afetados.
- Mudou um contrato aprovado? Marque as SPECs que o citam (`grep -r "SPEC-NNN"`) como `status: review`.
- Mudou módulo ou dependência? Atualize `docs/architecture.md` no mesmo PR.
- ADR: nunca reescreva; decisão nova = ADR novo + `superseded_by` no antigo.
- Critérios de aceite em **Gherkin** (`Dado/Quando/Então`), 1 cenário por comportamento,
  `# AC-N` na linha acima, resultado observável.
- Todo teste cita `SPEC-NNN/AC-N`. SPEC só vira `approved` com todos os AC cobertos.
- Termo novo entra no glossário antes de ir para doc ou código.

## Antes do PR
```sh
python3 docs/scripts/validate.py
```
Mais 1 linha no `CHANGELOG.md` (`## Unreleased`).
