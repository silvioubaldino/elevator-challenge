import { t } from "../i18n/pt-BR"

function Table({ title, rows }: { title: string; rows: readonly (readonly string[])[] }) {
  return (
    <section>
      <h3>{title}</h3>
      <dl>
        {rows.map(([signature, description]) => (
          <div key={signature}>
            <dt>
              <code>{signature}</code>
            </dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function ApiReference() {
  return (
    <div className="doc">
      <p>{t.apiIntro}</p>
      <Table title={t.apiHandlers} rows={t.api.handlers} />
      <Table title={t.apiFunctions} rows={t.api.functions} />
    </div>
  )
}
