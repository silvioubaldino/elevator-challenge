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
