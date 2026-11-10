import { TICK_MS } from "@elevator/engine"
import { useEffect, useRef } from "react"
import { t } from "../../i18n/pt-BR"
import { AvatarFigure } from "../avatar/AvatarFigure"
import { avatarFromId, lookKey } from "../avatar/look"
import type { AvatarPlacement, AvatarStatus } from "./placements"

export const WALK_MS = 900
export const REDUCED_WALK_MS = 150

type Props = { placements: AvatarPlacement[]; speed: number; reducedMotion: boolean }

export function AvatarLayer({ placements, speed, reducedMotion }: Props) {
  const previous = useRef(new Map<string, AvatarStatus>())
  useEffect(() => {
    previous.current = new Map(placements.map((p) => [p.id, p.status]))
  })
  const walkMs = (reducedMotion ? REDUCED_WALK_MS : WALK_MS) / speed

  return (
    <g className="avatars">
      {placements.map((p) => {
        const changed = previous.current.has(p.id) && previous.current.get(p.id) !== p.status
        const duration = changed ? walkMs : TICK_MS / speed
        return <Avatar key={p.id} placement={p} durationMs={duration} walkMs={walkMs} />
      })}
    </g>
  )
}

function accessibleName(p: AvatarPlacement) {
  const to = t.floorLabel(p.to)
  return p.status === "waiting" ? t.waiting(p.id, to) : t.riding(p.id, to)
}

function Avatar({ placement: p, durationMs, walkMs }: { placement: AvatarPlacement; durationMs: number; walkMs: number }) {
  const look = avatarFromId(p.id)
  const arrived = p.status === "arrived"
  const shown = p.visible && !arrived
  return (
    <g
      className={`avatar ${p.status} mood-${p.mood}`}
      data-testid={`avatar-${p.id}`}
      data-look={lookKey(look)}
      data-mood={p.mood}
      data-state={p.status}
      role={shown ? "img" : undefined}
      aria-label={shown ? accessibleName(p) : undefined}
      aria-hidden={shown ? undefined : true}
      opacity={p.visible ? 1 : 0}
      style={{
        transform: `translate(${p.x}px, ${p.y}px) scale(${p.scale})`,
        transition: `transform ${durationMs}ms ease-in-out`,
        ["--walk-ms" as string]: `${walkMs}ms`,
      }}
    >
      <g className="avatar-body">
        <AvatarFigure look={look} mood={p.mood} />
      </g>
      {p.status === "waiting" && <DestinationBubble to={t.floorLabel(p.to)} service={p.service} />}
    </g>
  )
}

function DestinationBubble({ to, service }: { to: string; service: boolean }) {
  return (
    <g className={`bubble${service ? " service" : ""}`} transform="translate(0,-62)" aria-hidden="true">
      <rect x={-16} y={-11} width={32} height={17} rx={8.5} />
      <path d="M-3 6 L0 11 L3 6Z" />
      <rect className="bubble-seam" x={-3.5} y={4.5} width={7} height={2.4} />
      <text x={0} y={2} textAnchor="middle">
        → {to}{service ? " S" : ""}
      </text>
    </g>
  )
}
