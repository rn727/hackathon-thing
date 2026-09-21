// Small helpers shared by the parent components.

// 45 -> "45 min", 90 -> "1 h 30 min", 120 -> "2 h"
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// Short text shown under a task title, e.g. "30 min". Empty for completion-based tasks.
export function taskDetails(task) {
  if (task.type === 'time' && task.duration_minutes) {
    return formatDuration(task.duration_minutes)
  }
  return ''
}

// A parent can delete a task only while nobody has claimed it yet.
export function canDeleteTask(task) {
  return task.status === 'available'
}

// Label shown to the user. The stored status stays 'approved'; the UI calls it "Done".
export function statusLabel(status) {
  return status === 'approved' ? 'done' : status
}

// Display order for the task list:
//   available, claimed, submitted, then approved (done), then rejected.
const STATUS_ORDER = { available: 0, claimed: 1, submitted: 2, approved: 3, rejected: 4 }

// Sort a copy of the tasks: by status group first, then by id
// (oldest first for active tasks, newest first for finished ones).
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    const finished = a.status === 'approved' || a.status === 'rejected'
    return finished ? b.id - a.id : a.id - b.id
  })
}

// How many rows a list shows before the "Show more" button appears.
export const PAGE_SIZE = 8
