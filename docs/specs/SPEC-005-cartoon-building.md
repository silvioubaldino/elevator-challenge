---
id: SPEC-005
status: draft
parents: [RF-01, RF-05]
related: [SPEC-004, RNF-04, RNF-06]
---

# SPEC-005: Prédio em estilo animação 3D com Avatar

**Escopo:** redesenho visual do `Building` em estilo de longa de animação 3D (formas redondas, luz quente, sombra suave), com cada `Passenger` como um `Avatar`. **Módulo:** `apps/web`.
**Fora:** editor, console e layout geral (SPEC-004 §Layout); métricas (RF-11); som; personagens ou marcas de filmes existentes — tudo original.

## Direção de arte
- **Prédio em corte** (dollhouse): cada `Floor` é um cômodo com fundo próprio — T = lobby com porta giratória, demais andares alternam escritório, café, biblioteca, academia; `Basement` = garagem.
- **Look 3D falso em SVG:** gradientes radiais, sombra de contato sob objetos, contorno escuro suave, cantos arredondados. Paleta quente (pêssego, mostarda, turquesa); modo escuro = "noite no prédio" com janelas acesas.
- **Poço e cabine:** poço com trilhos e cabo visível; cabine com janela, luz interna, portas de correr animadas a cada `DoorCycle`; mostrador de ponteiro (estilo antigo) acima da porta de cada andar.
- **`CallButton`:** botão redondo na parede ao lado da porta; aceso = brilho pulsando. **`CabinButton`:** painel de latão com botões redondos.

## Avatar
- Gerado de forma **determinística** pelo `id` do `Passenger` (hash → tipo de corpo, tom de pele, cabelo, roupa, acessório); mesmo `id` = mesmo `Avatar` (RNF-04).
- Cabeça grande, olhos grandes, corpo pequeno (proporção ~1:1,5). Partes em SVG combináveis, sem imagens externas.
- Balão sobre a cabeça com o destino (`→ 9`) enquanto espera.
- Estados visuais derivados de `SimulationState` (nada novo no `Engine`):

```
waiting ──(DoorCycle no from)──▶ entrando ──▶ riding ──(DoorCycle no to)──▶ saindo ──▶ some
   │ humor: 🙂 → 😐 → 😠 conforme a espera
```
- `waiting`: respira/balança parado; humor muda com o tempo de espera (limiares em `Tick`, ver Notas).
- **entrando/saindo:** anda da porta do andar até a cabine (e o inverso) durante o `DoorCycle`.
- `riding`: aparece pela janela da cabine; mais de 4 a bordo → 4 visíveis + `+N`.
- Chegou: pulinho de comemoração ao sair e some ao cruzar a porta do andar.
- Animações escalam com a velocidade (1×, 2×, 4×); `prefers-reduced-motion` troca movimento por transição curta.

## Critérios de aceite
Testes com Testing Library (estado/DOM), não por pixel.
```gherkin
# AC-1
Cenário: Avatar estável por id
  Dado o Scenario on-the-way
  Quando a simulação é reiniciada e roda de novo
  Então cada Passenger tem o mesmo Avatar (mesmas partes) nas duas execuções

# AC-2
Cenário: Avatar esperando com destino
  Dado o Scenario on-the-way rodando
  Quando B aparece no 5
  Então há um Avatar de B no 5 com o balão "→ 9" e nome acessível "B esperando, vai para 9"

# AC-3
Cenário: humor pela espera
  Dado um Passenger esperando
  Quando a espera passa do primeiro e do segundo limiar
  Então o Avatar fica neutro e depois impaciente

# AC-4
Cenário: embarque e desembarque animados
  Dado o Elevator parando no andar de um Passenger esperando
  Quando as portas abrem
  Então o Avatar vai do andar para a cabine e, ao chegar no destino, sai e some

# AC-5
Cenário: lotação visível
  Dado 6 Passenger a bordo
  Quando o aluno olha a cabine
  Então 4 Avatar aparecem na janela e o selo "+2"

# AC-6
Cenário: portas animadas
  Dado o Elevator parado num Target
  Quando o DoorCycle acontece
  Então as portas da cabine e do andar abrem e fecham

# AC-7
Cenário: movimento reduzido
  Dado prefers-reduced-motion ativo
  Quando um Passenger embarca
  Então não há caminhada; o Avatar troca de lugar com transição curta

# AC-8
Cenário: comportamento de SPEC-004 preservado
  Dado a suíte de testes de SPEC-004
  Quando roda após o redesenho
  Então todos os testes passam (botões, contagem a bordo, T no térreo)
```

## Plano
- [ ] tokens de tema em `styles.css` (claro + noite) e fonte arredondada (AC-6)
- [ ] `components/building/` quebrado em `Shaft`, `Cabin`, `FloorRoom`, `CallButton`, `CabinPanel` (AC-6, AC-8)
- [ ] `components/avatar/`: partes SVG + `avatarFromId(id)` puro (AC-1)
- [ ] `useAvatarTransitions`: detecta `waiting→riding` e `riding→arrived` entre snapshots e anima (AC-4, AC-7)
- [ ] humor por tempo de espera (`time` − instante do `Passenger`) (AC-3)
- [ ] janela da cabine com até 4 `Avatar` + selo (AC-5)
- [ ] testes AC-1..AC-8

## Notas
- Tudo em SVG + CSS, sem lib 3D (three.js) nem assets externos: bundle leve, testável em jsdom, sem custo (RNF-02). Se quiser 3D real depois → ADR.
- Limiares de humor sugeridos: neutro ≥ 15 s, impaciente ≥ 30 s; só visual, não é nota.
- `Modo livre` não tem `Passenger`, logo não tem `Avatar`.
- Ilustração dos cômodos é decorativa: `aria-hidden`; só botões e `Avatar` têm nome acessível.
