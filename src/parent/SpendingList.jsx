// Day 1はダミー。Day 2でPlaidの取引データを同じ形(id, name, amount, date, category)で渡せばOK。
export default function SpendingList({ spending }) {
  return (
    <section className="p-card">
      <h2>Recent spending</h2>
      <ul className="p-list">
        {spending.map((s) => (
          <li key={s.id}>
            <span>
              {s.name}
              <span className="p-muted p-small"> · {s.category} · {s.date}</span>
            </span>
            <span className="p-spend">-${s.amount.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
