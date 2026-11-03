const CODE_KEY = "elevator-challenge:code"

export function loadSavedCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY)
  } catch {
    return null
  }
}

export function saveCode(code: string): void {
  try {
    localStorage.setItem(CODE_KEY, code)
  } catch {
    return
  }
}
