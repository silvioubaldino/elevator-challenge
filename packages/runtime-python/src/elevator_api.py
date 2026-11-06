import builtins
import contextlib
import inspect
import io
import json
import traceback

STUDENT_FILE = "<aluno>"

_namespace = {}


class Elevator:
    def __init__(self, snapshot, commands):
        self._snapshot = snapshot
        self._commands = commands
        self._target = snapshot["target_floor"]

    def move_to(self, floor):
        low, high = self._snapshot["min_floor"], self._snapshot["max_floor"]
        if isinstance(floor, bool) or not isinstance(floor, int):
            raise ValueError(f"move_to espera um andar inteiro, recebeu {floor!r}")
        if not low <= floor <= high:
            raise ValueError(f"move_to({floor}): andar fora do prédio (de {low} a {high})")
        self._commands.append({"type": "move_to", "floor": floor})
        self._target = floor

    def current_floor(self):
        return self._snapshot["current_floor"]

    def target_floor(self):
        return self._target

    def direction(self):
        return self._snapshot["direction"]

    def is_idle(self):
        return self._snapshot["idle"]

    def min_floor(self):
        return self._snapshot["min_floor"]

    def max_floor(self):
        return self._snapshot["max_floor"]

    def __repr__(self):
        return f"<Elevator andar={self.current_floor()} target={self.target_floor()}>"


def _accepts_direction(handler):
    try:
        parameters = inspect.signature(handler).parameters.values()
    except (TypeError, ValueError):
        return False
    positional = (inspect.Parameter.POSITIONAL_ONLY, inspect.Parameter.POSITIONAL_OR_KEYWORD)
    if any(p.kind == inspect.Parameter.VAR_POSITIONAL for p in parameters):
        return True
    return sum(1 for p in parameters if p.kind in positional) >= 3


def _dispatch(handler, elevator, event):
    if event["type"] == "idle":
        handler(elevator)
    elif event["type"] == "call_button" and _accepts_direction(handler):
        handler(elevator, event["floor"], event.get("direction"))
    else:
        handler(elevator, event["floor"])


def _student_line(error):
    frames = [f for f in traceback.extract_tb(error.__traceback__) if f.filename == STUDENT_FILE]
    return frames[-1].lineno if frames else None


def _exception(error):
    result = {"kind": "exception", "message": f"{type(error).__name__}: {error}"}
    line = _student_line(error)
    if line is not None:
        result["line"] = line
    return result


def _syntax(error):
    result = {"kind": "syntax", "message": f"Erro de sintaxe: {error.msg}"}
    if error.lineno is not None:
        result["line"] = error.lineno
    return result


def load(code):
    global _namespace
    _namespace = {"__name__": "__aluno__", "__builtins__": builtins}
    try:
        compiled = compile(code, STUDENT_FILE, "exec")
    except SyntaxError as error:
        return json.dumps(_syntax(error))
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            exec(compiled, _namespace)
    except Exception as error:
        _namespace = {}
        return json.dumps(_exception(error))
    return json.dumps(None)


def handle(batch_json):
    batch = json.loads(batch_json)
    commands = []
    elevator = Elevator(batch["elevator"], commands)
    output = io.StringIO()
    try:
        with contextlib.redirect_stdout(output):
            for event in batch["events"]:
                handler = _namespace.get("on_" + event["type"])
                if not callable(handler):
                    continue
                _dispatch(handler, elevator, event)
    except Exception as error:
        return json.dumps({"error": _exception(error)})
    return json.dumps({"commands": commands, "logs": output.getvalue().splitlines()})
