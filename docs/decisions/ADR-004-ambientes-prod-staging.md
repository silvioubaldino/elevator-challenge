---
id: ADR-004
status: draft
related: [ADR-001, RNF-01, RNF-02]
---

# ADR-004: Prod e staging na branch `gh-pages`

- **Contexto:** o Pages serve um site por repositório; publicar um preview por artefato derrubava prod ou o preview anterior. Custo segue R$ 0 (RNF-02) e sem backend (RNF-01).
- **Decisão:**
  - Fonte do Pages: branch `gh-pages`. Prod na raiz, staging em `/staging/`.
  - Push na `main` publica só a raiz; comentário `/preview` num PR do repo publica só `/staging/`.
  - Staging é um só: o último `/preview`. Os dois workflows usam `.github/scripts/publish-pages.sh` e a mesma fila de concorrência.
- **Alternativas:**
  - Segundo repositório — URL própria, mas exige PAT e outro Pages.
  - Cloudflare Pages ou Netlify — previews nativos, mas troca de hospedagem e conta nova.
  - Artefato único (main + PR) — um preview derruba o anterior.
- **Consequências:** + prod nunca é tocado por staging · + R$ 0 e mesmo repo · − prod e staging dividem origem (`localStorage`) · − só um staging por vez.
