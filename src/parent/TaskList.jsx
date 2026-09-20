import { useState } from 'react'
import ShowMoreButton from './ShowMoreButton.jsx'
import { todayString, taskDetails, isOverdue, canDeleteTask, statusLabel, sortTasks, PAGE_SIZE } from './taskUtils.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'available', label: 'Available' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Done' }, // stored status is 'approved'
  { key: 'rejected', label: 'Rejected' },
]

// Buttons shown under a task row:
//   - overdue tasks: pick a new due date and Extend
//   - deletable tasks (unclaimed, or overdue): red X button to delete the task
function TaskActions({ task, overdue, deletable, today, onExtend, onDelete }) {
  const [newDate, setNewDate] = useState('')
  const valid = newDate !== '' && newDate >= today

  const handleDelete = () => {
    const message = task.status === 'claimed'
      ? `"${task.title}" is already claimed by the kid. Delete it anyway? This cannot be undone.`
      : `Delete "${task.title}"? This cannot be undone.`
    if (window.confirm(message)) onDelete(task.id)
  }

  return (
    <div className="p-overdue-actions">
      {overdue && (
        <>
          <input type="date" value={newDate} min={today} onChange={(e) => setNewDate(e.target.value)} />
          <button type="button" className="p-extend" disabled={!valid}
            onClick={() => { onExtend(task.id, newDate); setNewDate('') }}>
            Extend
          </button>
        </>
      )}
      {deletable && (
        <button type="button" className="p-delete p-icon" onClick={handleDelete}
          aria-label="Delete task" title="Delete task">
          &#10005;
        </button>
      )}
    </div>
  )
}

export default function TaskList({ tasks, onExtend, onDelete }) {
  const [filter, setFilter] = useState('all')
  const [shown, setShown] = useState(PAGE_SIZE) // how many rows are visible
  const today = todayString()

  const matches = (t, key) => {
    if (key === 'all') return true
    if (key === 'overdue') return isOverdue(t, today)
    return t.status === key
  }
  const count = (key) => tasks.filter((t) => matches(t, key)).length
  const visible = sortTasks(tasks.filter((t) => matches(t, filter)))

  return (
    <section className="p-card">
      <h2>Tasks</h2>

      <div className="p-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`p-tab ${filter === f.key ? 'active' : ''} ${f.key === 'overdue' && count('overdue') > 0 ? 'alert' : ''}`}
            onClick={() => { setFilter(f.key); setShown(PAGE_SIZE) }} // back to the first page
          >
            {f.label} <span className="p-tab-count">{count(f.key)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 && <p className="p-muted">No tasks here.</p>}
      <ul className="p-list p-task-list">
        {visible.slice(0, shown).map((t) => {
          const overdue = isOverdue(t, today)
          const deletable = canDeleteTask(t, today)
          return (
            <li key={t.id}>
              <div className="p-task-row">
                <span>
                  {t.title}
                  <span className={`p-due ${overdue ? 'overdue' : ''}`}>
                    {taskDetails(t)}{overdue ? ' (overdue)' : ''}
                  </span>
                </span>
                <span className="p-row-right">
                  <span className="p-reward">${t.reward}</span>
                  <span className={`p-badge ${t.status}`}>{statusLabel(t.status)}</span>
                </span>
              </div>
              {(overdue || deletable) && (
                <TaskActions
                  task={t}
                  overdue={overdue}
                  deletable={deletable}
                  today={today}
                  onExtend={onExtend}
                  onDelete={onDelete}
                />
              )}
            </li>
          )
        })}
      </ul>
      <ShowMoreButton
        remaining={visible.length - shown}
        onClick={() => setShown((n) => n + PAGE_SIZE)}
      />
    </section>
  )
}
