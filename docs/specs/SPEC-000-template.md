---
id: SPEC-NNN
status: draft
parents: [RF-NN]
related: []
---

# SPEC-NNN: <feature>

**Escopo:** <o que entrega, 1 linha>. **Módulo:** `<apps/... | packages/...>`.
**Fora:** <...>

## Contratos
Só se esta SPEC for dona de um contrato. Quem consome referencia `SPEC-NNN §Contratos`.
```ts
<tipos, assinaturas, formato de dados>
```

## Critérios de aceite
Cada teste cita `SPEC-NNN/AC-N` (nome, tag ou comentário).
```gherkin
# AC-1
Cenário: <comportamento>
  Dado <contexto>
  Quando <ação>
  Então <resultado observável>
```

## Plano
- [ ] <passo — arquivo/módulo> (AC-1)
- [ ] testes AC-1..N

## Notas
- <borda, risco, decisão local → ADR-NNN>
