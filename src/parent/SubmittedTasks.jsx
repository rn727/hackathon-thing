export default function SubmittedTasks({ tasks, onApprove, onReject }) {
  return (
    <section className="p-card">
      <h2>Waiting for your approval</h2>
      {tasks.length === 0 && <p className="p-muted">Nothing to review right now.</p>}
      <ul className="p-list">
        {tasks.map((t) => (
          <li key={t.id}>
            <span>
              {t.title} <span className="p-reward">${t.reward}</span>
              {t.dueDate && <span className="p-due">Due {t.dueDate}</span>}
            </span>
            <span className="p-row-right">
              <button className="p-approve" onClick={() => onApprove(t.id)}>Approve</button>
              <button className="p-reject" onClick={() => onReject(t.id)}>Reject</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
