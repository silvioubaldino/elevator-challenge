import type { SimulationState } from "@elevator/engine"
import { useState } from "react"
import { t } from "../i18n/pt-BR"

type Tab = "output" | "events"

const OUTPUT_KINDS = new Set(["print", "error"])

export function Console({ log }: { log: SimulationState["log"] }) {
  const [tab, setTab] = useState<Tab>("output")
  const lines = log.filter((entry) => OUTPUT_KINDS.has(entry.kind) === (tab === "output"))
  const empty = tab === "output" ? t.emptyOutput : t.emptyEvents

  return (
    <section className="console">
      <div role="tablist" className="tabs">
        {(["output", "events"] as const).map((id) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {t.consoleTabs[id]}
          </button>
        ))}
      </div>
      <ol className="log" role="tabpanel">
        {lines.length === 0 && <li className="muted">{empty}</li>}
        {lines.map((entry, index) => (
          <li key={index} className={entry.kind}>
            <span className="log-time">{t.seconds(entry.tick)} s</span> {entry.text}
          </li>
        ))}
      </ol>
    </section>
  )
}
