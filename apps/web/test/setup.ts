import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"

Object.defineProperty(Range.prototype, "getClientRects", {
  value: () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }),
})
Object.defineProperty(Range.prototype, "getBoundingClientRect", {
  value: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
})

beforeEach(() => localStorage.clear())
afterEach(cleanup)
