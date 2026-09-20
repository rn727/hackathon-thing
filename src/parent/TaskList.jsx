import { useState } from 'react'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'available', label: 'Available' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

// 今日の日付を 'YYYY-MM-DD' で返す(ローカル時間)
function todayString() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// 期限切れ = 期限が過ぎていて、まだ子が提出していない(available / claimed)タスク
function isOverdue(task, today) {
  return !!task.dueDate && task.dueDate < today &&
    (task.status === 'available' || task.status === 'claimed')
}

function OverdueActions({ task, today, onExtend, onReject }) {
  const [newDate, setNewDate] = useState('')
  const valid = newDate >= today && newDate !== ''

  return (
    <div className="p-overdue-actions">
      <input type="date" value={newDate} min={today} onChange={(e) => setNewDate(e.target.value)} />
      <button type="button" className="p-extend" disabled={!valid}
        onClick={() => { onExtend(task.id, newDate); setNewDate('') }}>
        Extend
      </button>
      <button type="button" className="p-reject" onClick={() => onReject(task.id)}>
        Reject
      </button>
    </div>
  )
}

export default function TaskList({ tasks, onExtend, onReject }) {
  const [filter, setFilter] = useState('all')
  const today = todayString()

  const matches = (t, key) => {
    if (key === 'all') return true
    if (key === 'overdue') return isOverdue(t, today)
    return t.status === key
  }
  const count = (key) => tasks.filter((t) => matches(t, key)).length
  const visible = tasks.filter((t) => matches(t, filter))

  return (
    <section className="p-card">
      <h2>Tasks</h2>

      <div className="p-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`p-tab ${filter === f.key ? 'active' : ''} ${f.key === 'overdue' && count('overdue') > 0 ? 'alert' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} <span className="p-tab-count">{count(f.key)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 && <p className="p-muted">No tasks here.</p>}
      <ul className="p-list p-task-list">
        {visible.map((t) => {
          const overdue = isOverdue(t, today)
          return (
            <li key={t.id}>
              <div className="p-task-row">
                <span>
                  {t.title}
                  <span className={`p-due ${overdue ? 'overdue' : ''}`}>
                    {t.dueDate ? `Due ${t.dueDate}${overdue ? ' (overdue)' : ''}` : 'No due date'}
                  </span>
                </span>
                <span className="p-row-right">
                  <span className="p-reward">${t.reward}</span>
                  <span className={`p-badge ${t.status}`}>{t.status}</span>
                </span>
              </div>
              {overdue && (
                <OverdueActions task={t} today={today} onExtend={onExtend} onReject={onReject} />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
