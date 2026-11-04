import { useEffect, useState } from "react"

export const COMPACT_QUERY = "(max-width: 899px)"

function matches(query: string) {
  return typeof window.matchMedia === "function" && window.matchMedia(query).matches
}

export function useCompactLayout() {
  const [compact, setCompact] = useState(() => matches(COMPACT_QUERY))

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return
    const media = window.matchMedia(COMPACT_QUERY)
    const update = () => setCompact(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return compact
}

const KEYBOARD_MIN_PX = 120

export function useVisibleViewportHeight() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement
    const clear = () => {
      root.style.removeProperty("--app-height")
      root.style.removeProperty("--app-top")
    }
    const update = () => {
      const keyboardOpen = window.innerHeight - viewport.height > KEYBOARD_MIN_PX
      if (!keyboardOpen || Math.abs(viewport.scale - 1) > 0.01) return clear()
      root.style.setProperty("--app-height", `${viewport.height}px`)
      root.style.setProperty("--app-top", `${viewport.offsetTop}px`)
    }
    update()
    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
      clear()
    }
  }, [])
}
