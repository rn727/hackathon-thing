import { useEffect, useState } from 'react'
import { sampleSpending } from '../parent/parentSampleData.js'
import '../parent/parent.css'
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
  const spending = sampleSpending

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
        return
      }

      setKid({ balance: Number(user.balance) })
      setTasks(taskRows.map((task) => ({ ...task, reward: Number(task.reward) })))
    }

    loadData()
  }, [])

  const claimTask = async (id) => {
    // The server only claims the task if it is still 'available'.
    const ok = await callServer(id, 'claim')
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
    const ok = await callServer(id, 'submit')
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

  return (
    <div className="parent-page">
       <div className="dashboard-header">
  <Link to="/">
    <button className="logout-button">Log Out</button>
  </Link>

  <h1>Kid Dashboard</h1>
</div>
      {error && <p>{error}</p>}

      <section className="p-card p-balance-card">
        <div className="p-label">Your balance</div>
        <div className="p-balance">
          ${kid.balance.toFixed(2)}
        </div>
      </section>

      <section className="p-card">
        <h2>Available Tasks</h2>

        {availableTasks.length === 0 ? (
          <p>No available tasks right now.</p>
        ) : (
          availableTasks.map((task) => (
            <div key={task.id} className="p-task-row">
              <div>
                <h3>{task.title}</h3>
                <p>Reward: ${task.reward.toFixed(2)}</p>
              </div>

              <button
                onClick={() => claimTask(task.id)}
              >
                Claim Task
              </button>
            </div>
          ))
        )}
      </section>

      <section className="p-card">
        <h2>My Tasks</h2>

        {claimedTasks.length === 0 ? (
          <p>You have no claimed tasks.</p>
        ) : (
          claimedTasks.map((task) => (
            <div key={task.id} className="p-task-row">
              <div>
                <h3>{task.title}</h3>
                <p>Reward: ${task.reward.toFixed(2)}</p>
              </div>

              <button
                onClick={() => submitTask(task.id)}
              >
                Mark Complete
              </button>
            </div>
          ))
        )}
      </section>

      <section className="p-card">
        <h2>Recent Spending</h2>

        {spending.map((item) => (
          <div key={item.id} className="p-task-row">
            <span>{item.description}</span>
            <span>${item.amount.toFixed(2)}</span>
          </div>
        ))}
      </section>
    </div>
  )
}