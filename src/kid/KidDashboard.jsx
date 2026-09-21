import { useEffect, useState } from 'react'
import SpendingList from '../parent/SpendingList.jsx'
import '../parent/parent.css'
import './KidDashboard.css'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'

// No login yet: the kid screen always acts as this kid (users.id in Supabase).
const KID_ID = 2
const API = 'http://localhost:8000/api/tasks'

// Ask the server to move a task ('claim' or 'submit'). Returns true if it worked.
async function callServer(id, action) {
  try {
    const response = await fetch(`${API}/${id}/${action}`, { method: 'POST' })
    if (!response.ok) console.error(`Could not ${action} task:`, await response.text())
    return response.ok
  } catch (err) {
    console.error(`Could not ${action} task:`, err)
    return false
  }
}

export default function ChildDashboard() {
  const [kid, setKid] = useState({ balance: 0 })
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null) // task being saved, so a double click does nothing

  // Load the kid's balance and tasks (available ones + this kid's own) from Supabase.
  useEffect(() => {
    const loadData = async () => {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', KID_ID)
        .single()

      const { data: taskRows, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or(`status.eq.available,kid_id.eq.${KID_ID}`)

      if (userError || tasksError) {
        console.error('Could not load kid data:', userError || tasksError)
        setError('Could not load your data')
        setLoading(false)
        return
      }

      setKid({ balance: Number(user.balance) })
      setTasks(taskRows.map((task) => ({ ...task, reward: Number(task.reward) })))
      setLoading(false)
    }

    loadData()
  }, [])

  const claimTask = async (id) => {
    // The server only claims the task if it is still 'available'.
    if (busyId) return
    setBusyId(id)
    const ok = await callServer(id, 'claim')
    setBusyId(null)
    if (!ok) {
      setError('Could not claim the task')
      return
    }

    setError('')
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, status: 'claimed' }
          : task
      )
    )
  }

  const submitTask = async (id) => {
    // The server only submits the task if it is still 'claimed'.
    if (busyId) return
    setBusyId(id)
    const ok = await callServer(id, 'submit')
    setBusyId(null)
    if (!ok) {
      setError('Could not submit the task')
      return
    }

    setError('')
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, status: 'submitted' }
          : task
      )
    )
  }

  const availableTasks = tasks.filter(
    (task) => task.status === 'available'
  )

  const claimedTasks = tasks.filter(
    (task) => task.status === 'claimed'
  )

  const taskMeta = (task) => (
    <p className="p-muted p-small">
      {task.duration_minutes ? `${task.duration_minutes} min` : 'Any time'}
    </p>
  )

  return (
    <div className="parent-page kid-page">
      <div className="dashboard-header">
        <Link to="/">
          <button className="logout-button">Log Out</button>
        </Link>

        <h1>TaskPay · Child</h1>
      </div>

      {error && <div className="p-alert">{error}</div>}

      <section className="p-card p-balance-card">
        <div className="p-label">Your balance</div>
        <div className="p-balance">
          ${kid.balance.toFixed(2)}
        </div>
      </section>

      <section className="p-card">
        <h2>
          Available Tasks <span className="p-badge available">{availableTasks.length}</span>
        </h2>

        {loading ? (
          <p className="p-muted">Loading...</p>
        ) : availableTasks.length === 0 ? (
          <p className="p-muted">No available tasks right now. Check back soon!</p>
        ) : (
          <ul className="p-list">
            {availableTasks.map((task) => (
              <li key={task.id} className="p-task-row">
                <div>
                  <h3 className="kid-task-title">{task.title}</h3>
                  <span className="p-reward">${task.reward.toFixed(2)}</span>
                  {taskMeta(task)}
                </div>

                <button
                  className="kid-action kid-claim"
                  disabled={busyId === task.id}
                  onClick={() => claimTask(task.id)}
                >
                  {busyId === task.id ? 'Claiming...' : 'Claim Task'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="p-card">
        <h2>
          My Tasks <span className="p-badge claimed">{claimedTasks.length}</span>
        </h2>

        {loading ? (
          <p className="p-muted">Loading...</p>
        ) : claimedTasks.length === 0 ? (
          <p className="p-muted">You have no claimed tasks. Claim one above to get started!</p>
        ) : (
          <ul className="p-list">
            {claimedTasks.map((task) => (
              <li key={task.id} className="p-task-row">
                <div>
                  <h3 className="kid-task-title">{task.title}</h3>
                  <span className="p-reward">${task.reward.toFixed(2)}</span>
                  {taskMeta(task)}
                </div>

                <button
                  className="kid-action kid-done"
                  disabled={busyId === task.id}
                  onClick={() => submitTask(task.id)}
                >
                  {busyId === task.id ? 'Sending...' : 'Mark Complete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SpendingList />
    </div>
  )
}
