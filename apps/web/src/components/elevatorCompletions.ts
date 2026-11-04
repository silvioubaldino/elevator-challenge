import {
  snippet,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSource,
} from "@codemirror/autocomplete"
import { t } from "../i18n/pt-BR"

const HANDLER_INDENT = "    "
const ELEVATOR_VARIABLE = "elevator"

type ApiRow = readonly [signature: string, description: string]

function nameOf(signature: string) {
  return signature.slice(0, signature.indexOf("("))
}

function argumentsOf(signature: string) {
  return signature.slice(signature.indexOf("(") + 1, signature.lastIndexOf(")"))
}

function handlerCompletions(rows: readonly ApiRow[]) {
  return rows.map(([signature, description]) => ({
    name: nameOf(signature),
    signature,
    description,
  }))
}

function methodCompletions(rows: readonly ApiRow[]): Completion[] {
  return rows
    .flatMap(([signature, description]) =>
      signature.split(" / ").map((single) => ({ single, description })),
    )
    .map(({ single, description }) => {
      const args = argumentsOf(single)
      return {
        label: nameOf(single),
        type: "method",
        detail: `(${args})`,
        info: description,
        apply: snippet(`${nameOf(single)}(${args ? `\${${args}}` : ""})`),
      }
    })
}

const handlers = handlerCompletions(t.api.handlers)
const methods = methodCompletions(t.api.functions)

function handlerBody(signature: string) {
  return `${signature}:\n${HANDLER_INDENT}\${pass}`
}

function handlerOption(
  handler: (typeof handlers)[number],
  prefix: string,
): Completion {
  return {
    label: handler.name,
    type: "function",
    detail: `(${argumentsOf(handler.signature)})`,
    info: handler.description,
    boost: 99,
    apply: snippet(`${prefix}${handlerBody(handler.signature)}`),
  }
}

function handlerSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\bon_\w*/)
  if (!word) return null
  const line = context.state.doc.lineAt(word.from)
  const before = line.text.slice(0, word.from - line.from)
  const afterDef = /^\s*def\s+$/.test(before)
  if (!afterDef && !/^\s*$/.test(before)) return null
  const prefix = afterDef ? "" : "def "
  return {
    from: word.from,
    options: handlers.map((handler) => handlerOption(handler, prefix)),
    validFor: /^\w*$/,
  }
}

function methodSource(context: CompletionContext): CompletionResult | null {
  const member = context.matchBefore(new RegExp(`\\b${ELEVATOR_VARIABLE}\\.\\w*`))
  if (!member) return null
  return {
    from: member.from + ELEVATOR_VARIABLE.length + 1,
    options: methods,
    validFor: /^\w*$/,
  }
}

export const elevatorCompletions: CompletionSource = (context) =>
  methodSource(context) ?? handlerSource(context)
