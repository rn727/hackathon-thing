import { useState } from 'react'
import ShowMoreButton from './ShowMoreButton.jsx'
import { PAGE_SIZE } from './taskUtils.js'

// Rows look like { id, name, amount, date }, with amount as a positive number. category is optional.
export default function SpendingList({ spending }) {
  const [shown, setShown] = useState(PAGE_SIZE) // how many rows are visible

  // Newest first, since this is "recent" spending.
  const sorted = [...spending].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section className="p-card">
      <h2>Recent spending</h2>
      {sorted.length === 0 && <p className="p-muted">No spending yet.</p>}
      <ul className="p-list">
        {sorted.slice(0, shown).map((s) => (
          <li key={s.id}>
            <span>
              {s.name}
              <span className="p-muted p-small"> · {s.category ? `${s.category} · ` : ''}{s.date}</span>
            </span>
            <span className="p-spend">-${s.amount.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <ShowMoreButton
        remaining={sorted.length - shown}
        canCollapse={shown > PAGE_SIZE}
        onMore={() => setShown((n) => n + PAGE_SIZE)}
        onLess={() => setShown(PAGE_SIZE)}
      />
    </section>
  )
}
