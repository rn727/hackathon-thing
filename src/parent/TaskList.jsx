import { useState } from 'react'
import ShowMoreButton from './ShowMoreButton.jsx'
import { taskDetails, canDeleteTask, statusLabel, sortTasks, PAGE_SIZE } from './taskUtils.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Done' }, // stored status is 'approved'
  { key: 'rejected', label: 'Rejected' },
]

// Red X button at the end of a task row. Only tasks nobody has claimed yet can be deleted.
function DeleteButton({ task, disabled, onDelete }) {
  const handleDelete = () => {
    if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) onDelete(task.id)
  }

  return (
    <button type="button" className="p-delete p-icon" disabled={disabled} onClick={handleDelete}
      aria-label="Delete task" title="Delete task">
      &#10005;
    </button>
  )
}

export default function TaskList({ tasks, disabled, onDelete }) {
  const [filter, setFilter] = useState('all')
  const [shown, setShown] = useState(PAGE_SIZE) // how many rows are visible

  const matches = (t, key) => key === 'all' || t.status === key
  const count = (key) => tasks.filter((t) => matches(t, key)).length
  const visible = sortTasks(tasks.filter((t) => matches(t, filter)))

  return (
    <section className="p-card">
      <div className="p-card-head">
        <h2>Tasks</h2>
        <select
          aria-label="Filter tasks by status"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setShown(PAGE_SIZE) }} // back to the first page
        >
          {FILTERS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label} ({count(f.key)})
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 && <p className="p-muted">No tasks here.</p>}
      <ul className="p-list p-task-list">
        {visible.slice(0, shown).map((t) => (
          <li key={t.id}>
            <div className="p-task-row">
              <span>
                {t.title}
                {taskDetails(t) && <span className="p-due">{taskDetails(t)}</span>}
              </span>
              <span className="p-row-right">
                <span className="p-reward">${t.reward.toFixed(2)}</span>
                <span className={`p-badge ${t.status}`}>{statusLabel(t.status)}</span>
                {canDeleteTask(t) && <DeleteButton task={t} disabled={disabled} onDelete={onDelete} />}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <ShowMoreButton
        remaining={visible.length - shown}
        canCollapse={shown > PAGE_SIZE}
        onMore={() => setShown((n) => n + PAGE_SIZE)}
        onLess={() => setShown(PAGE_SIZE)}
      />
    </section>
  )
}
