export type Mood = "happy" | "neutral" | "angry" | "joy"

export const NEUTRAL_AFTER_S = 15
export const ANGRY_AFTER_S = 30

export function moodForWait(waitedSeconds: number): Mood {
  if (waitedSeconds >= ANGRY_AFTER_S) return "angry"
  if (waitedSeconds >= NEUTRAL_AFTER_S) return "neutral"
  return "happy"
}
