// Fake data for the parent screen (Day 1).
// Day 2: replace with real data from Supabase / Plaid.
//
// task.status: 'available' -> 'claimed' -> 'submitted' -> 'approved'
//   (the UI shows 'approved' as "Done"; the stored value stays 'approved')
//   - Parent asks for a redo on a submitted task: back to 'claimed'.
//   - Parent rejects a submitted task (no reward): 'rejected'.
//   - Parent deletes an unclaimed ('available') or overdue task: it is removed entirely.
// The UI shows 'approved' as "Done"; the stored value stays 'approved'.
// task.dueDate: 'YYYY-MM-DD' string, or null if there is no due date.
// task.type: 'completion' or 'time'.
// task.durationMinutes: minutes the kid should spend (time-based tasks), else null.

export const sampleKid = { id: 1, name: 'Sota', balance: 10 }

export const sampleTasks = [
  { id: 1, title: 'Finish Algebra Homework', reward: 5, type: 'completion', durationMinutes: null, status: 'available', dueDate: '2026-09-25' },
  { id: 2, title: 'Read for 30 minutes', reward: 3, type: 'time', durationMinutes: 30, status: 'claimed', dueDate: '2026-09-22' },
  { id: 3, title: 'Clean your desk', reward: 2, type: 'completion', durationMinutes: null, status: 'submitted', dueDate: '2026-09-19' },
  { id: 4, title: 'Practice piano', reward: 4, type: 'time', durationMinutes: 45, status: 'submitted', dueDate: '2026-09-21' },
  { id: 5, title: 'Water the plants', reward: 1, type: 'completion', durationMinutes: null, status: 'approved', dueDate: '2026-09-18' },
  { id: 6, title: 'Take out the trash', reward: 2, type: 'completion', durationMinutes: null, status: 'available', dueDate: '2026-09-15' },
  { id: 7, title: 'Math worksheet', reward: 3, type: 'completion', durationMinutes: null, status: 'claimed', dueDate: '2026-09-16' },
  { id: 8, title: 'Set the dinner table', reward: 1, type: 'completion', durationMinutes: null, status: 'available', dueDate: '2026-09-27' },
  { id: 9, title: 'Practice soccer drills', reward: 3, type: 'time', durationMinutes: 60, status: 'claimed', dueDate: '2026-09-26' },
  { id: 10, title: 'Fold the laundry', reward: 2, type: 'completion', durationMinutes: null, status: 'approved', dueDate: '2026-09-17' },
]

// Placeholder spending until Plaid Sandbox transactions are connected.
export const sampleSpending = [
  { id: 1, name: 'Blue Bottle Coffee', amount: 4.5, date: '2026-09-18', category: 'Food' },
  { id: 2, name: 'Steam Games', amount: 9.99, date: '2026-09-17', category: 'Entertainment' },
  { id: 3, name: 'Target', amount: 12.3, date: '2026-09-15', category: 'Shopping' },
  { id: 4, name: 'Spotify', amount: 5.99, date: '2026-09-14', category: 'Entertainment' },
  { id: 5, name: 'Chipotle', amount: 9.25, date: '2026-09-13', category: 'Food' },
  { id: 6, name: 'Uniqlo', amount: 24.9, date: '2026-09-12', category: 'Shopping' },
  { id: 7, name: 'Boba Tea', amount: 6.5, date: '2026-09-11', category: 'Food' },
  { id: 8, name: 'Movie tickets', amount: 14.0, date: '2026-09-10', category: 'Entertainment' },
  { id: 9, name: 'Bookstore', amount: 11.4, date: '2026-09-09', category: 'Shopping' },
  { id: 10, name: 'Bus pass', amount: 20.0, date: '2026-09-08', category: 'Transport' },
  { id: 11, name: 'Ice cream', amount: 3.75, date: '2026-09-07', category: 'Food' },
]
