import type { ReactNode } from "react"
import type { LeftTab } from "../App"
import { t } from "../i18n/pt-BR"

type Props = {
  showBuilding: boolean
  leftTab: LeftTab
  statementLabel: string
  onBuilding(): void
  onLeftTab(tab: LeftTab): void
}

const ICONS: Record<"building" | LeftTab, ReactNode> = {
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4" />
    </>
  ),
  code: <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />,
  statement: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 11h7M9 15h7" />
    </>
  ),
  api: (
    <>
      <path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z" />
    </>
  ),
}

export function SectionNav({ showBuilding, leftTab, statementLabel, onBuilding, onLeftTab }: Props) {
  const items = [
    { id: "building", label: t.tabs.building, selected: showBuilding, select: onBuilding },
    ...(["code", "statement", "api"] as const).map((id) => ({
      id,
      label: id === "statement" ? statementLabel : t.tabs[id],
      selected: !showBuilding && leftTab === id,
      select: () => onLeftTab(id),
    })),
  ] as const

  return (
    <nav className="section-nav" aria-label={t.sectionsLabel}>
      <div role="tablist">
        {items.map((item) => (
          <button key={item.id} role="tab" type="button" aria-selected={item.selected} onClick={item.select}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {ICONS[item.id]}
            </svg>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
