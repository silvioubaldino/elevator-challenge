const n=`pending = {}
cabin = {}
sweep = {}
issued = {}


def other(direction):
    return "down" if direction == "up" else "up"


def demand(car):
    k = car.id()
    items = [(f, "cabin") for f in cabin.get(k, ())]
    items += [(f, d) for (f, d, s), owner in pending.items() if owner == k]
    return items


def ahead(items, floor, direction, kinds):
    if direction == "up":
        return [f for f, kind in items if kind in kinds and f > floor]
    return [f for f, kind in items if kind in kinds and f < floor]


def nearest(floors, direction):
    return min(floors) if direction == "up" else max(floors)


def farthest(floors, direction):
    return max(floors) if direction == "up" else min(floors)


def choose_target(car):
    items = demand(car)
    if not items:
        return None
    floor = car.current_floor()
    moving = car.direction() is not None
    here = any(f == floor and kind != "cabin" for f, kind in items)
    if here and car.is_idle():
        return floor
    if here and not moving:
        return None
    direction = car.direction() if moving else sweep.get(car.id(), "up")
    for current in (direction, other(direction)):
        if moving and current != direction:
            break
        on_the_way = ahead(items, floor, current, ("cabin", current))
        if on_the_way:
            return nearest(on_the_way, current)
        any_kind = ahead(items, floor, current, ("cabin", "up", "down"))
        if any_kind:
            return farthest(any_kind, current)
    return None


def direction_of_trip(floor, target):
    if target > floor:
        return "up"
    if target < floor:
        return "down"
    return None


def replan(fleet):
    for car in fleet:
        target = choose_target(car)
        if target is None or target == car.target_floor():
            continue
        floor = car.current_floor()
        trip = direction_of_trip(floor, target)
        issued[car.id()] = trip
        if trip is not None and car.direction() is None:
            sweep[car.id()] = trip
        car.move_to(target)


def cost(car, floor, direction):
    here = car.current_floor()
    distance = abs(here - floor)
    items = demand(car)
    if not items:
        return distance
    going = car.direction() or sweep.get(car.id(), "up")
    compatible = (going == "up" and floor >= here and direction == "up") or (
        going == "down" and floor <= here and direction == "down"
    )
    return distance + 3 * len(items) + (0 if compatible else 8)


def on_call_button(elevator, floor, direction, service):
    key = (floor, direction, service)
    if key not in pending or pending[key] is None:
        cars = [c for c in elevator.fleet() if c.is_service() == service]
        best = min(cars, key=lambda c: (cost(c, floor, direction), c.id()))
        pending[key] = best.id()
    replan(elevator.fleet())


def on_cabin_button(elevator, floor):
    cabin.setdefault(elevator.id(), set()).add(floor)
    replan(elevator.fleet())


def serving_direction(elevator, floor):
    if floor == elevator.max_floor():
        return "down"
    if floor == elevator.min_floor():
        return "up"
    return issued.get(elevator.id())


def on_stop(elevator, floor):
    k = elevator.id()
    cabin.get(k, set()).discard(floor)
    serving = serving_direction(elevator, floor)
    service = elevator.is_service()
    for key in [key for key in pending if key[0] == floor and key[2] == service]:
        if serving is None or key[1] == serving:
            del pending[key]
    if serving is not None:
        sweep[k] = serving
    items = demand(elevator)
    if items and not ahead(items, floor, sweep.get(k, "up"), ("cabin", "up", "down")):
        sweep[k] = other(sweep.get(k, "up"))
    issued[k] = None
    replan(elevator.fleet())


def on_idle(elevator):
    replan(elevator.fleet())
`;export{n as default};
