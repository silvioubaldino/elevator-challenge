import { useEffect, useState } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

const matches = () => typeof window.matchMedia === "function" && window.matchMedia(QUERY).matches

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(matches)
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return
    const media = window.matchMedia(QUERY)
    const update = () => setReduced(media.matches)
    media.addEventListener?.("change", update)
    return () => media.removeEventListener?.("change", update)
  }, [])
  return reduced
}
