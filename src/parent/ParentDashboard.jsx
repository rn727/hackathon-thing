import { useState } from 'react'
import CreateTaskForm from './CreateTaskForm.jsx'
import SubmittedTasks from './SubmittedTasks.jsx'
import TaskList from './TaskList.jsx'
import SpendingList from './SpendingList.jsx'
import { sampleKid, sampleTasks, sampleSpending } from './parentSampleData.js'
import './parent.css'

// 親画面。Day 1はこのファイルの中のuseStateで動く(ダミーデータ)。
// Day 2: 下の「TODO(Day 2)」の3か所をSupabase / Plaidの呼び出しに置き換える。
export default function ParentDashboard() {
  const [kid, setKid] = useState(sampleKid)           // TODO(Day 2): Supabaseから取得
  const [tasks, setTasks] = useState(sampleTasks)     // TODO(Day 2): Supabaseから取得
  const spending = sampleSpending                     // TODO(Day 2): Plaid Sandboxから取得

  const createTask = ({ title, reward, type, dueDate }) => {
    // TODO(Day 2): Supabaseのtasksにinsert
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), title, reward: Number(reward), type, status: 'available', dueDate },
    ])
  }

  const approveTask = (id) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    // TODO(Day 2): statusを'approved'に更新 + 残高を増やす(Supabase)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'approved' } : t)))
    setKid((k) => ({ ...k, balance: k.balance + task.reward }))
  }

  const rejectTask = (id) => {
    // TODO(Day 2): statusを'claimed'に戻す(Supabase)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'claimed' } : t)))
  }

  const extendTask = (id, newDate) => {
    // TODO(Day 2): dueDateを更新(Supabase)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, dueDate: newDate } : t)))
  }

  const closeOverdueTask = (id) => {
    // TODO(Day 2): statusを'rejected'に更新(Supabase)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'rejected' } : t)))
  }

  const submitted = tasks.filter((t) => t.status === 'submitted')

  return (
    <div className="parent-page">
      <h1>Parent Dashboard</h1>

      <section className="p-card p-balance-card">
        <div className="p-label">{kid.name}'s balance</div>
        <div className="p-balance">${kid.balance.toFixed(2)}</div>
      </section>

      <CreateTaskForm onCreate={createTask} />

      <SubmittedTasks tasks={submitted} onApprove={approveTask} onReject={rejectTask} />

      <TaskList tasks={tasks} onExtend={extendTask} onReject={closeOverdueTask} />

      <SpendingList spending={spending} />
    </div>
  )
}
