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

export function useVisibleViewportHeight() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement
    const update = () => {
      if (Math.abs(viewport.scale - 1) > 0.01) return
      root.style.setProperty("--app-height", `${viewport.height}px`)
      root.style.setProperty("--app-top", `${viewport.offsetTop}px`)
    }
    update()
    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
      root.style.removeProperty("--app-height")
      root.style.removeProperty("--app-top")
    }
  }, [])
}
