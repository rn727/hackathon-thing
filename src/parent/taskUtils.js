// Small helpers shared by the parent components.

// Today's date as 'YYYY-MM-DD' (local time), matching the dueDate format.
export function todayString() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// 45 -> "45 min", 90 -> "1 h 30 min", 120 -> "2 h"
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// One-line summary shown under a task title, e.g. "Due 2026-09-25 · 30 min".
export function taskDetails(task) {
  const parts = [task.dueDate ? `Due ${task.dueDate}` : 'No due date']
  if (task.type === 'time' && task.durationMinutes) {
    parts.push(formatDuration(task.durationMinutes))
  }
  return parts.join(' · ')
}

// Overdue = past its due date and the kid has not submitted it yet (available or claimed).
export function isOverdue(task, today) {
  return !!task.dueDate && task.dueDate < today &&
    (task.status === 'available' || task.status === 'claimed')
}

// A parent can delete a task nobody has claimed yet, or a claimed task that is overdue.
export function canDeleteTask(task, today) {
  return task.status === 'available' || isOverdue(task, today)
}

// Label shown to the user. The stored status stays 'approved'; the UI calls it "Done".
export function statusLabel(status) {
  return status === 'approved' ? 'done' : status
}

// Display order for the task list:
//   available, claimed, submitted, then approved (done), then rejected.
const STATUS_ORDER = { available: 0, claimed: 1, submitted: 2, approved: 3, rejected: 4 }

// Sort a copy of the tasks: by status group first, then by due date.
//   - active tasks (available / claimed / submitted): soonest due date first
//   - finished tasks (approved / rejected): most recent due date first
//   - tasks with no due date go to the bottom of their group
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    const finished = a.status === 'approved' || a.status === 'rejected'
    return finished ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate)
  })
}

// How many rows a list shows before the "Show more" button appears.
export const PAGE_SIZE = 8
