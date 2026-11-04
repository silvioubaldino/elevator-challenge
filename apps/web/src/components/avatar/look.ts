export type HairStyle = "swoop" | "bun" | "curly" | "pigtails" | "bald"
export type Accessory = "none" | "glasses" | "cap" | "bowtie" | "scarf"
export type BodyShape = "slim" | "round" | "tall"

export type AvatarLook = {
  skin: string
  hair: string
  hairStyle: HairStyle
  outfit: string
  pants: string
  accessory: Accessory
  body: BodyShape
}

const SKINS = ["#ffdcc0", "#f3bf96", "#dc9a6c", "#b0714a", "#7d4b2d", "#5b3520"]
const HAIRS = ["#2b1d14", "#6b3e1f", "#c9772e", "#ecc75e", "#a0a0a0", "#43306b", "#c2412d"]
const OUTFITS = ["#f2994a", "#22a99a", "#e85d75", "#5b8def", "#f2c94c", "#8e6cd8", "#4caf72"]
const PANTS = ["#3d4a6b", "#5a3e2b", "#2f5d50", "#4a4458"]
const HAIR_STYLES: HairStyle[] = ["swoop", "bun", "curly", "pigtails", "bald"]
const ACCESSORIES: Accessory[] = ["none", "glasses", "cap", "bowtie", "scarf"]
const BODIES: BodyShape[] = ["slim", "round", "tall"]

function seededPicker(id: string) {
  let h = 2166136261
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  return <T,>(options: readonly T[]): T => {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0
    return options[(h >>> 8) % options.length]!
  }
}

export function avatarFromId(id: string): AvatarLook {
  const pick = seededPicker(id)
  return {
    skin: pick(SKINS),
    hair: pick(HAIRS),
    hairStyle: pick(HAIR_STYLES),
    outfit: pick(OUTFITS),
    pants: pick(PANTS),
    accessory: pick(ACCESSORIES),
    body: pick(BODIES),
  }
}

export const lookKey = (look: AvatarLook) =>
  [look.skin, look.hair, look.hairStyle, look.outfit, look.pants, look.accessory, look.body].join("|")
