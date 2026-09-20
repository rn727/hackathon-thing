// 親画面用のダミーデータ(Day 1)。
// Day 2でSupabase / Plaidの実データに置き換える。
// task.status: 'available' -> 'claimed' -> 'submitted' -> 'approved'
// (提出物を却下したら 'claimed' に戻す)
// 期限切れのタスクを親が打ち切ると 'rejected'(報酬なしで終了)
// task.dueDate: 'YYYY-MM-DD' の文字列。期限なしなら null。

export const sampleKid = { id: 1, name: 'Sota', balance: 10 }

export const sampleTasks = [
  { id: 1, title: 'Finish Algebra Homework', reward: 5, type: 'completion', status: 'available', dueDate: '2026-09-25' },
  { id: 2, title: 'Read for 30 minutes', reward: 3, type: 'time', status: 'claimed', dueDate: '2026-09-22' },
  { id: 3, title: 'Clean your desk', reward: 2, type: 'completion', status: 'submitted', dueDate: '2026-09-19' },
  { id: 4, title: 'Practice piano', reward: 4, type: 'time', status: 'submitted', dueDate: '2026-09-21' },
  { id: 5, title: 'Water the plants', reward: 1, type: 'completion', status: 'approved', dueDate: '2026-09-18' },
  { id: 6, title: 'Take out the trash', reward: 2, type: 'completion', status: 'available', dueDate: '2026-09-15' },
  { id: 7, title: 'Math worksheet', reward: 3, type: 'completion', status: 'claimed', dueDate: '2026-09-16' },
]

// Plaid Sandboxの取引が来るまでのダミー支出
export const sampleSpending = [
  { id: 1, name: 'Blue Bottle Coffee', amount: 4.5, date: '2026-09-18', category: 'Food' },
  { id: 2, name: 'Steam Games', amount: 9.99, date: '2026-09-17', category: 'Entertainment' },
  { id: 3, name: 'Target', amount: 12.3, date: '2026-09-15', category: 'Shopping' },
]
