---
id: SPEC-002
status: review
parents: [RF-02, RF-03, RF-07]
related: [ADR-001, ADR-002, SPEC-008, SPEC-009, RNF-03]
---

# SPEC-002: Runtime Python — API do aluno

**Escopo:** implementa `Runtime` (SPEC-001 §Contratos) com Pyodide num Web Worker e expõe a API do aluno.
**Módulo:** `packages/runtime-python`. **Fora:** editor e exibição de erro (SPEC-004).

## Contratos
Template que o aluno recebe (`template.py`):
```python
def on_call_button(elevator, floor, direction, service):
    """Alguém apertou "chamar" no andar `floor`; `direction` é "up", "down" ou None (botão único); `service` é True no botão de serviço. `elevator` é o primeiro elevador do tipo do botão; veja elevator.fleet() para os demais."""
    pass

def on_cabin_button(elevator, floor):
    """Alguém dentro da cabine apertou o andar `floor`."""
    pass

def on_stop(elevator, floor):
    """O elevador parou no andar `floor` e abriu as portas."""
    pass

def on_idle(elevator):
    """O elevador está parado, de portas fechadas e sem destino."""
    pass
```
API do `elevator`:
| Função | Retorno | Comportamento |
|--------|---------|---------------|
| `move_to(floor)` | `None` | Emite `Command`; substitui o `Target` (RN-04). `ValueError` se fora do prédio ou não `int` |
| `current_floor()` | `int` | Último andar alcançado |
| `target_floor()` | `int \| None` | `Target` atual; reflete `move_to` feito no mesmo batch |
| `direction()` | `"up" \| "down" \| None` | Sentido no início do batch |
| `is_idle()` | `bool` | `Idle` no início do batch |
| `min_floor()` / `max_floor()` | `int` | Limites do `Building` |
| `id()` | `int` | Número do `Elevator` (0, 1, 2) |
| `is_service()` | `bool` | `ServiceElevator` (SPEC-009) |
| `fleet()` | `list` | Todos os `Elevator`, por `id()`; `move_to` vale para o escolhido |

- `print()` vai para o console da UI.
- `on_call_button` com 2 ou 3 parâmetros continua válido: `direction` só é passado se o `Handler` aceitar 3 e `service` se aceitar 4.
- Em `on_stop`, `on_cabin_button` e `on_idle`, `elevator` é quem gerou o `Event`.
- `Handler` ausente = `Event` ignorado. Ordem das chamadas = ordem dos `Event` no batch.
- Variáveis globais persistem entre batches; `load` começa um namespace limpo.
- Timeout de `handle`: 1000 ms → o Worker é encerrado e recriado no próximo `load`.

## Critérios de aceite
Testes rodam o Pyodide em Node.
```gherkin
# AC-1
Cenário: template não faz nada
  Dado o template sem alteração
  Quando o Runtime recebe qualquer batch
  Então devolve zero Command e nenhum erro

# AC-2
Cenário: move_to vira Command
  Dado on_call_button chamando elevator.move_to(floor)
  Quando o Runtime recebe call_button(7)
  Então devolve [move_to(7)]

# AC-3
Cenário: Handler na ordem do batch
  Dado Handler que fazem print do Event recebido
  Quando o batch traz stop(4) e cabin_button(8)
  Então os logs saem nessa ordem

# AC-4
Cenário: estado do aluno persiste
  Dado uma lista global onde on_call_button faz append
  Quando chegam dois batches com call_button(3) e call_button(5)
  Então o segundo Handler enxerga [3, 5]

# AC-5
Cenário: target_floor reflete o move_to do batch
  Dado um Handler que chama move_to(6) e depois print(elevator.target_floor())
  Quando o Handler roda
  Então o log mostra 6

# AC-6
Cenário: move_to fora do prédio
  Dado um Handler que chama move_to(11) num Building de 0 a 10
  Quando o Handler roda
  Então o Runtime devolve error exception com a linha da chamada e mensagem em PT

# AC-7
Cenário: erro de sintaxe
  Dado código com erro de sintaxe na linha 3
  Quando load roda
  Então devolve error syntax com line 3

# AC-8
Cenário: loop infinito
  Dado um Handler com while True
  Quando o Runtime recebe o batch
  Então devolve error timeout em até 1,5 s, a UI segue responsiva e um novo load funciona

# AC-9
Cenário: Handler ausente
  Dado código sem on_idle
  Quando o Runtime recebe idle
  Então nada acontece e nenhum erro é devolvido
```

## Plano
- [x] `src/worker.ts`: carrega Pyodide (versão fixa, CDN) e responde `load`/`handle` (AC-7)
- [x] `src/elevator_api.py`: objeto `elevator`, despacho de `Handler`, captura de `print` (AC-1..AC-6, AC-9)
- [x] `src/runtime.ts`: implementa `Runtime`, timeout e recriação do Worker (AC-8)
- [x] `src/template.py` exportado para a UI
- [x] testes AC-1..AC-9

## Notas
- Identificadores em EN (RNF-05); docstrings do template e mensagens de erro em PT (texto para o aluno).
- Traceback filtrado: só linhas do código do aluno.
- Pyodide carrega em segundo plano ao abrir o site; a UI só habilita "Rodar" quando ele estiver pronto.
