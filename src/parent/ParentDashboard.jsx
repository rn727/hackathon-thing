import { useEffect, useState } from 'react'
import CreateTaskForm from './CreateTaskForm.jsx'
import SubmittedTasks from './SubmittedTasks.jsx'
import TaskList from './TaskList.jsx'
import { Link } from 'react-router-dom'
import SpendingList from './SpendingList.jsx'
import { sampleKid, sampleTasks, sampleSpending } from './parentSampleData.js'
import { todayString, canDeleteTask } from './taskUtils.js'
import './parent.css'

// Parent screen. On Day 1 it runs on fake data held in useState.
// Day 2: replace the TODO(Day 2) spots below with Supabase / Plaid calls.
export default function ParentDashboard() {
  const [kid, setKid] = useState(sampleKid)           // TODO(Day 2): Supabaseから取得
  const [tasks, setTasks] = useState([])
  const spending = sampleSpending                     // TODO(Day 2): Plaid Sandboxから取得

  // Small helper: change one task's fields by id.
  const updateTask = (id, changes) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)))

  const createTask = ({ title, reward, type, durationMinutes, dueDate }) => {
    // TODO(Day 2): insert into the Supabase tasks table. If it fails, throw an error
    // so CreateTaskForm can show "Could not create the task".
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(), // temporary id; Supabase will generate a real one
        title,
        reward: Number(reward),
        type,
        durationMinutes,
        status: 'available',
        dueDate,
      },
    ])
  }

  // Approve a submitted task: mark it approved and add the reward to the balance.
  const approveTask = (id) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    // TODO(Day 2): update status to 'approved' and the balance in Supabase
    updateTask(id, { status: 'approved' })
    setKid((k) => ({ ...k, balance: k.balance + task.reward }))
  }

  // Ask for a redo: the task goes back to the kid as 'claimed'.
  const requestRedo = (id) => {
    // TODO(Day 2): update status to 'claimed' in Supabase
    updateTask(id, { status: 'claimed' })
  }

  // Reject a submitted task: it is closed for good and no reward is paid.
  const rejectTask = (id) => {
    // TODO(Day 2): update status to 'rejected' in Supabase
    updateTask(id, { status: 'rejected' })
  }

  // Delete a task that is unclaimed, or claimed but overdue. It is removed completely
  // (no record is kept).
  const deleteTask = (id) => {
    const task = tasks.find((t) => t.id === id)
    if (!task || !canDeleteTask(task, todayString())) return
    // TODO(Day 2): delete the row in Supabase
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const extendTask = (id, newDate) => {
    // TODO(Day 2): update dueDate in Supabase
    updateTask(id, { dueDate: newDate })
  }

  // Derived value: recomputed on every render, so it never gets out of date.
  const submitted = tasks.filter((t) => t.status === 'submitted')

  useEffect(() => {
  fetch('http://localhost:8000/api/tasks')
    .then((response) => response.json())
    .then((data) => {
      setTasks(data)
    })
    .catch((error) => {
      console.error('Error loading tasks:', error)
    })
}, [])

  return (
    <div className="parent-page">
      <div className="dashboard-header">
  <Link to="/">
    <button className="logout-button">Log Out</button>
  </Link>

  <h1>Parent Dashboard</h1>
</div>

      <section className="p-card p-balance-card">
        <div className="p-label">{kid.name}'s balance</div>
        <div className="p-balance">${kid.balance.toFixed(2)}</div>
      </section>

      <CreateTaskForm onCreate={createTask} />

      <SubmittedTasks
        tasks={submitted}
        onApprove={approveTask}
        onRedo={requestRedo}
        onReject={rejectTask}
      />

      <TaskList tasks={tasks} onExtend={extendTask} onDelete={deleteTask} />

      <SpendingList spending={spending} />
    </div>
  )
}
