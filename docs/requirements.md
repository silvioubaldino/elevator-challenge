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
| RF-13 | Configurar `CallButton`: único, sobe/desce ou só desce | 3 |
| RF-14 | Múltiplos `Elevator` | 4 |
| RF-15 | Capacidade da cabine | 4 |
| RF-16 | Outras linguagens além de Python | 5 |

## Não-funcionais
| ID | Requisito (categoria: alvo) |
|----|-----------------------------|
| RNF-01 | Acesso: site público, sem login e sem backend |
| RNF-02 | Custo: R$ 0/mês (hospedagem estática gratuita) |
| RNF-03 | Isolamento: código do aluno roda fora da thread da UI; loop infinito não trava a página |
| RNF-04 | Determinismo: mesmo código + mesmo `Scenario` = mesma execução, em qualquer velocidade |
| RNF-05 | Idioma: UI em PT-BR; código, API, campos e enums em EN |
| RNF-06 | Layout: desktop-first (≥ 1280 px), legível em tablet |
| RNF-07 | Extensível: o `Engine` não conhece a linguagem do aluno; cada linguagem é um `Runtime` (prepara RF-16) |

## Regras do simulador
- RN-01: `Floor` 0 é o térreo, exibido `T`; `Basement` é negativo, exibido `S1`, `S2`…
- RN-02: o `Elevator` se move andar a andar e só inverte o sentido parado num andar.
- RN-03: o `Elevator` só para (abre portas) no `Target`; passa direto pelos demais andares. Vale também para o andar onde já está.
- RN-04: `move_to` substitui o `Target`. `Target` para trás do movimento → segue até o próximo andar e inverte.
- RN-05: ao parar: desembarca quem tem aquele destino; embarca quem espera no andar; o `CallButton` apaga; cada `Passenger` que embarcou aperta seu `CabinButton`.
- RN-06: botão já aceso não gera novo `Event`.
- RN-07: portas abrem e fecham sozinhas; o aluno não controla portas.
- RN-08: capacidade ilimitada até RF-15.
- RN-09: `Scenario` termina com sucesso quando todos os `Passenger` chegam; falha no `time_limit_s`.

## Fases
- **1 — MVP:** RF-01 a RF-09; só feedback visual, sem nota.
- **2 — Cenários abertos:** RF-10, RF-11.
- **3 — Prédio configurável:** RF-12, RF-13 (`on_call_button` ganha `direction`).
- **4 — Frota:** RF-14, RF-15.
- **5 — Plataforma:** RF-16; depois, avaliação, ranking e solução compartilhada por link.

## Glossário (GLO)
Termo novo entra aqui antes de ser usado em doc ou código. Termo em EN, definição em PT.

| Termo | Definição | Evitar |
|-------|-----------|--------|
| Building | Prédio: faixa de andares + elevadores | Prédio (no código) |
| Floor | Andar, inteiro; 0 = T | Level, andar (no código) |
| Basement | Andar negativo (subsolo) | Underground |
| Elevator | Cabine que o aluno controla | Lift, car |
| CallButton | Botão "chamar" no andar | Hall button |
| CabinButton | Botão de andar no painel da cabine | Destination button |
| Target | Andar onde o `Elevator` vai parar; definido por `move_to` | Destino (no código) |
| Direction | `up` \| `down` \| `None` (parado) | Sentido |
| Idle | Parado, portas fechadas, sem `Target` | Livre |
| DoorCycle | Abrir, embarcar/desembarcar e fechar | — |
| Passenger | Pessoa de um `Scenario`: instante, origem, destino | User, pessoa |
| Avatar | Bonequinho que representa um `Passenger` na UI | Sprite, boneco (no código) |
| Scenario | Prédio inicial + lista de `Passenger` + `time_limit_s` | Teste, caso |
| CustomScenario | `Scenario` montado pelo aluno no editor ("Meu cenário") | Cenário livre (confunde com `Sandbox`) |
| Sandbox | Modo livre: sem `Scenario`, botões clicados à mão | Playground |
| Tick | Passo de 100 ms de tempo simulado | Frame |
| Event | Fato que o `Engine` entrega ao aluno | Callback |
| Handler | Função do aluno que trata um `Event` (`on_*`) | Listener |
| Command | Ordem do aluno ao `Elevator` (`move_to`) | Ação |
| Engine | Simulador: dono do tempo e das regras RN-* | Motor |
| Runtime | Executa o código do aluno numa linguagem | Sandbox, VM |
