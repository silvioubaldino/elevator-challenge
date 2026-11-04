import type { AvatarLook } from "./look"
import type { Mood } from "./mood"

const INK = "#241a2e"
const MOUTH = "#5a2a2a"
const SHOE = "#2a2230"

type Props = { look: AvatarLook; mood: Mood }

export function AvatarFigure({ look, mood }: Props) {
  const halfWidth = look.body === "round" ? 11 : 9
  const torso = look.body === "tall" ? 18 : 15
  const bodyTop = -10 - torso
  const head = bodyTop - 11
  const armLift = mood === "joy" ? -14 : 0
  const browColor = look.hair === "#ecc75e" ? "#a0782a" : look.hair

  return (
    <g className="avatar-figure">
      <ellipse cx={0} cy={0} rx={12} ry={3} fill="rgba(0,0,0,.18)" />
      <rect x={-6} y={-11} width={4.6} height={11} rx={2.3} fill={look.pants} />
      <rect x={1.4} y={-11} width={4.6} height={11} rx={2.3} fill={look.pants} />
      <ellipse cx={-4} cy={-0.5} rx={3.6} ry={2} fill={SHOE} />
      <ellipse cx={4} cy={-0.5} rx={3.6} ry={2} fill={SHOE} />
      <rect x={-halfWidth - 3.5} y={bodyTop + 3 + armLift} width={4.5} height={11} rx={2.2} fill={look.skin} />
      <rect x={halfWidth - 1} y={bodyTop + 3 + armLift} width={4.5} height={11} rx={2.2} fill={look.skin} />
      <rect x={-halfWidth} y={bodyTop} width={halfWidth * 2} height={torso + 2} rx={halfWidth * 0.75} fill={look.outfit} />
      <rect x={-halfWidth + 2} y={bodyTop + 2} width={halfWidth * 0.6} height={torso - 4} rx={3} fill="#fff" opacity={0.18} />
      <Neckwear look={look} bodyTop={bodyTop} halfWidth={halfWidth} />
      <HairBack look={look} head={head} />
      <circle cx={0} cy={head + 1} r={12} fill={look.skin} />
      <ellipse cx={-12} cy={head + 2} rx={2.2} ry={3} fill={look.skin} />
      <ellipse cx={12} cy={head + 2} rx={2.2} ry={3} fill={look.skin} />
      <HairFront look={look} head={head} />
      <ellipse cx={-7.5} cy={head + 5} rx={2.6} ry={1.6} fill="#ff8fa3" opacity={0.55} />
      <ellipse cx={7.5} cy={head + 5} rx={2.6} ry={1.6} fill="#ff8fa3" opacity={0.55} />
      <Eyes mood={mood} eyes={head + 0.5} browColor={browColor} />
      <Mouth mood={mood} y={head + 7} />
      <Headwear look={look} head={head} />
    </g>
  )
}

function Neckwear({ look, bodyTop, halfWidth }: { look: AvatarLook; bodyTop: number; halfWidth: number }) {
  if (look.accessory === "bowtie") {
    const y = bodyTop
    return <path d={`M-4 ${y + 1} L0 ${y + 3} L4 ${y + 1} L4 ${y + 5} L0 ${y + 3} L-4 ${y + 5}Z`} fill="#e63946" />
  }
  if (look.accessory === "scarf") {
    return (
      <>
        <rect x={-halfWidth + 1} y={bodyTop - 1} width={halfWidth * 2 - 2} height={4} rx={2} fill="#e63946" />
        <rect x={halfWidth - 6} y={bodyTop + 1} width={3.5} height={9} rx={1.5} fill="#e63946" />
      </>
    )
  }
  return null
}

function HairBack({ look, head }: { look: AvatarLook; head: number }) {
  if (look.hairStyle === "bald") return null
  return (
    <>
      <circle cx={0} cy={head - 1.5} r={13} fill={look.hair} />
      {look.hairStyle === "pigtails" && (
        <>
          <circle cx={-13} cy={head + 3} r={4.5} fill={look.hair} />
          <circle cx={13} cy={head + 3} r={4.5} fill={look.hair} />
        </>
      )}
    </>
  )
}

const CURLS: [number, number][] = [[-9, -5], [-4, -10], [2, -11], [8, -7], [11, -1], [-11, 0]]

function HairFront({ look, head }: { look: AvatarLook; head: number }) {
  const h = head
  switch (look.hairStyle) {
    case "swoop":
    case "pigtails":
      return <path d={`M-12 ${h - 1} Q-2 ${h - 17} 12 ${h - 3} Q3 ${h - 7} -12 ${h - 1}Z`} fill={look.hair} />
    case "bun":
      return (
        <>
          <path d={`M-12 ${h - 2} Q0 ${h - 15} 12 ${h - 2} Q0 ${h - 8} -12 ${h - 2}Z`} fill={look.hair} />
          <circle cx={0} cy={h - 14} r={5.5} fill={look.hair} />
        </>
      )
    case "curly":
      return (
        <>
          {CURLS.map(([x, y]) => (
            <circle key={`${x},${y}`} cx={x} cy={h + y} r={4.2} fill={look.hair} />
          ))}
        </>
      )
    case "bald":
      return (
        <>
          <ellipse cx={-11} cy={h - 1} rx={2.5} ry={4} fill={look.hair} />
          <ellipse cx={11} cy={h - 1} rx={2.5} ry={4} fill={look.hair} />
        </>
      )
  }
}

const BROW_TILT: Record<Mood, number> = { happy: -1, neutral: 0, angry: 2.2, joy: -1.5 }

function Eyes({ mood, eyes, browColor }: { mood: Mood; eyes: number; browColor: string }) {
  const tilt = BROW_TILT[mood]
  const look = mood === "neutral" ? 0.8 : 0.3
  return (
    <>
      {[-4.6, 4.6].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={eyes} rx={3.4} ry={mood === "angry" ? 2.8 : 4} fill="#fff" />
          <circle cx={x + look} cy={eyes + 0.6} r={2} fill={INK} />
          <circle cx={x + 1} cy={eyes - 0.6} r={0.8} fill="#fff" />
        </g>
      ))}
      <path d={`M-7.5 ${eyes - 5.5} L-2 ${eyes - 5.5 + tilt}`} stroke={browColor} strokeWidth={1.6} strokeLinecap="round" />
      <path d={`M2 ${eyes - 5.5 + tilt} L7.5 ${eyes - 5.5}`} stroke={browColor} strokeWidth={1.6} strokeLinecap="round" />
    </>
  )
}

function Mouth({ mood, y }: { mood: Mood; y: number }) {
  const line = { stroke: MOUTH, strokeWidth: 1.5, fill: "none", strokeLinecap: "round" as const }
  switch (mood) {
    case "happy":
      return <path d={`M-4 ${y - 1} Q0 ${y + 3} 4 ${y - 1}`} {...line} />
    case "neutral":
      return <path d={`M-3 ${y} L3 ${y}`} {...line} />
    case "angry":
      return <path d={`M-4 ${y + 1.5} Q0 ${y - 2} 4 ${y + 1.5}`} {...line} />
    case "joy":
      return <path d={`M-4.5 ${y - 1.5} Q0 ${y + 5} 4.5 ${y - 1.5}Z`} fill="#7a2e2e" />
  }
}

function Headwear({ look, head }: { look: AvatarLook; head: number }) {
  if (look.accessory === "glasses") {
    const y = head + 0.5
    return (
      <g fill="none" stroke={SHOE} strokeWidth={1.2}>
        <circle cx={-4.6} cy={y} r={4.4} />
        <circle cx={4.6} cy={y} r={4.4} />
      </g>
    )
  }
  if (look.accessory === "cap") {
    return (
      <>
        <path d={`M-11 ${head - 6} Q0 ${head - 20} 11 ${head - 6}Z`} fill={look.outfit} />
        <rect x={2} y={head - 7.5} width={13} height={3} rx={1.5} fill={look.outfit} />
      </>
    )
  }
  return null
}
