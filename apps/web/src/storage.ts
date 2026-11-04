import { parseCustomScenario, type CustomScenario } from "./customScenario"

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

const CUSTOM_SCENARIO_KEY = "elevator-challenge:custom-scenario"

export function loadCustomScenario(): CustomScenario | null {
  try {
    const raw = localStorage.getItem(CUSTOM_SCENARIO_KEY)
    return raw === null ? null : parseCustomScenario(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveCustomScenario(custom: CustomScenario): void {
  try {
    localStorage.setItem(CUSTOM_SCENARIO_KEY, JSON.stringify(custom))
  } catch {
    return
  }
}
