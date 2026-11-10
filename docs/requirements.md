---
id: REQ
status: draft
---

# Requisitos — Elevator Challenge

**Produto:** site aberto onde o aluno escreve, em Python, a lógica de um elevador. O simulador já sabe se mover, abrir portas e embarcar pessoas; o aluno só decide **para onde ir** a cada evento e vê o resultado animado.

## Funcionais
| ID | Requisito | Fase |
|----|-----------|------|
| RF-01 | Exibir o `Building`: 1 `Elevator`, `Floor` 0 (T) a 10, um `CallButton` por andar e o painel de `CabinButton` | 1 |
| RF-02 | Editor Python com o template de `Handler` vazios e a API documentada | 1 |
| RF-03 | Executar o código do aluno reagindo aos `Event` do `Engine` | 1 |
| RF-04 | `Sandbox`: clicar em `CallButton` e `CabinButton` com a simulação rodando | 1 |
| RF-05 | Rodar um `Scenario` pré-carregado e ver `Passenger` esperando, embarcando e desembarcando | 1 |
| RF-06 | Controles: rodar, pausar, reiniciar e velocidade (1×, 2×, 4×) | 1 |
| RF-07 | Exibir log de `Event`, saída de `print()` e erro do aluno com a linha | 1 |
| RF-08 | Exibir resultado do `Scenario`: concluído (tempo total) ou tempo esgotado (quem não chegou) | 1 |
| RF-09 | Salvar o código no navegador e restaurar o template | 1 |
| RF-10 | Editar `Scenario`: lista de `Passenger` (instante, origem, destino) | 2 |
| RF-11 | Métricas por `Passenger` e agregadas: espera e viagem | 2 |
| RF-12 | Configurar o `Building`: quantidade de andares e de `Basement` | 3 |
| RF-13 | Configurar `CallButton`: único, sobe/desce ou só desce (único e sobe/desce: SPEC-008) | 3 |
| RF-14 | Múltiplos `Elevator` (1 a 3) e `ServiceElevator` a partir de 2 (SPEC-009) | 4 |
| RF-15 | Capacidade da cabine | 4 |
| RF-17 | `Demo`: um clique prepara o prédio mais complexo e roda uma solução de referência oculta (SPEC-010) | 4 |
| RF-16 | Outras linguagens além de Python | 5 |

## Não-funcionais
| ID | Requisito (categoria: alvo) |
|----|-----------------------------|
| RNF-01 | Acesso: site público, sem login e sem backend |
| RNF-02 | Custo: R$ 0/mês (hospedagem estática gratuita) |
| RNF-03 | Isolamento: código do aluno roda fora da thread da UI; loop infinito não trava a página |
| RNF-04 | Determinismo: mesmo código + mesmo `Scenario` = mesma execução, em qualquer velocidade |
| RNF-05 | Idioma: UI em PT-BR; código, API, campos e enums em EN |
| RNF-06 | Layout: desktop-first (≥ 1280 px), legível em tablet, usável em celular (≥ 360 px) |
| RNF-07 | Extensível: o `Engine` não conhece a linguagem do aluno; cada linguagem é um `Runtime` (prepara RF-16) |

## Regras do simulador
- RN-01: `Floor` 0 é o térreo, exibido `T`; `Basement` é negativo, exibido `S1`, `S2`…
- RN-02: o `Elevator` se move andar a andar e só inverte o sentido parado num andar.
- RN-03: o `Elevator` só para (abre portas) no `Target`; passa direto pelos demais andares. Vale também para o andar onde já está.
- RN-04: `move_to` substitui o `Target`. `Target` para trás do movimento → segue até o próximo andar e inverte.
- RN-05: ao parar: desembarca quem tem aquele destino; embarca quem espera no andar; o `CallButton` apaga; cada `Passenger` que embarcou aperta seu `CabinButton`. Com `DirectionalCalls`, só apaga o `CallButton` da `Direction` atendida (RN-10).
- RN-06: botão já aceso não gera novo `Event` (vale por andar e `Direction`).
- RN-07: portas abrem e fecham sozinhas; o aluno não controla portas.
- RN-08: capacidade ilimitada até RF-15.
- RN-09: `Scenario` termina com sucesso quando todos os `Passenger` chegam; falha no `time_limit_s`.
- RN-10: com `DirectionalCalls`, o andar mais baixo só tem `up` e o mais alto só tem `down`; o `Passenger` aperta o botão da `Direction` de `from→to`. Ao parar, só embarca quem vai na `Direction` em que o `Elevator` chegou (no mais baixo conta `up`, no mais alto `down`); quem chega sem movimento (`move_to` do andar atual) embarca todos. Quem não embarcou mantém o botão aceso.

- RN-11: cada `Passenger` aperta o `CallButton` do seu tipo (comum ou serviço). Um `Elevator` só embarca `Passenger` do seu tipo e só apaga `CallButton` do seu tipo; RN-05, RN-06 e RN-10 valem por `Elevator`. Com dois do mesmo tipo no andar, embarca o de menor `id`.

## Fases
- **1 — MVP:** RF-01 a RF-09; só feedback visual, sem nota.
- **2 — Cenários abertos:** RF-10, RF-11.
- **3 — Prédio configurável:** RF-12, RF-13 (`on_call_button` ganha `direction`).
- **4 — Frota:** RF-14, RF-15, RF-17.
- **5 — Plataforma:** RF-16; depois, avaliação, ranking e solução compartilhada por link.

## Glossário (GLO)
Termo novo entra aqui antes de ser usado em doc ou código. Termo em EN, definição em PT.

| Termo | Definição | Evitar |
|-------|-----------|--------|
| Building | Prédio: faixa de andares + elevadores | Prédio (no código) |
| Floor | Andar, inteiro; 0 = T | Level, andar (no código) |
| Basement | Andar negativo (subsolo) | Underground |
| Elevator | Cabine que o aluno controla | Lift, car |
| Fleet | Conjunto de `Elevator` do `Building` (1 a 3), identificados por `id` | Frota (no código) |
| ServiceElevator | `Elevator` que só atende `Passenger` e `CallButton` de serviço; o `id` 0 nunca é | Freight |
| CallButton | Botão "chamar" no andar; com `DirectionalCalls` há um `up` e um `down` | Hall button |
| DirectionalCalls | Modo do `Building` em que cada andar tem `CallButton` `up` e `down` (menos `up` no mais alto e `down` no mais baixo) | Botão duplo |
| CabinButton | Botão de andar no painel da cabine | Destination button |
| Target | Andar onde o `Elevator` vai parar; definido por `move_to` | Destino (no código) |
| Direction | `up` \| `down` \| `None` (parado) | Sentido |
| Idle | Parado, portas fechadas, sem `Target` | Livre |
| DoorCycle | Abrir, embarcar/desembarcar e fechar | — |
| Passenger | Pessoa de um `Scenario`: instante, origem, destino | User, pessoa |
| Avatar | Bonequinho que representa um `Passenger` na UI | Sprite, boneco (no código) |
| Scenario | Prédio inicial + lista de `Passenger` + `time_limit_s` | Teste, caso |
| CustomScenario | `Scenario` montado pelo aluno no editor ("Meu cenário") | Cenário livre (confunde com `Sandbox`) |
| Demo | Modo em que o `Engine` roda um `Scenario` fixo e complexo (`Fleet` de 3, `ServiceElevator`, `DirectionalCalls`) com uma solução de referência oculta | Exemplo, Solução |
| Sandbox | Modo livre: sem `Scenario`, botões clicados à mão | Playground |
| Tick | Passo de 100 ms de tempo simulado | Frame |
| Event | Fato que o `Engine` entrega ao aluno | Callback |
| Handler | Função do aluno que trata um `Event` (`on_*`) | Listener |
| Command | Ordem do aluno ao `Elevator` (`move_to`) | Ação |
| Engine | Simulador: dono do tempo e das regras RN-* | Motor |
| Runtime | Executa o código do aluno numa linguagem | Sandbox, VM |
