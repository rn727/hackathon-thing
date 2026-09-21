import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase.js'
import CreateTaskForm from './CreateTaskForm.jsx'
import SubmittedTasks from './SubmittedTasks.jsx'
import TaskList from './TaskList.jsx'
import SpendingList from './SpendingList.jsx'
import ConnectBank from './ConnectBank.jsx'
import './parent.css'

// The Express server does every create / update / delete. This page only reads from Supabase.
const API = 'http://localhost:8000/api/tasks'

// Supabase returns numeric columns (reward, balance) as strings like "5.00".
// Convert them to real numbers as soon as the data comes in.
const toTask = (row) => ({ ...row, reward: Number(row.reward) })
const toKid = (row) => ({ ...row, balance: Number(row.balance) })

// A transactions row with a negative amount is money the kid spent (Plaid sync saves purchases
// as negative numbers). Turn it into the shape SpendingList shows.
const toSpending = (row) => ({
  id: row.id,
  name: row.name || 'Unknown',
  amount: Math.abs(Number(row.amount)),
  date: String(row.created_at).slice(0, 10),
})

// Parent screen. Reads tasks and the kid's balance from Supabase; changes go through the server.
export default function ParentDashboard() {
  const [kid, setKid] = useState(null)   // the kid's row from the users table (null = none found)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('') // shown when Approve / Redo / Reject / Delete fails
  const [reloadKey, setReloadKey] = useState(0)     // change this number to load the data again
  const [busyId, setBusyId] = useState(null)         // id of the task being changed right now
  const [spending, setSpending] = useState([])   // the kid's purchases, from the transactions table

  // Load the kid and all tasks from Supabase. Runs on the first render, and again
  // whenever `reloadKey` changes (Try again button, or after a conflicting change).
  useEffect(() => {
    async function loadData() {
      const kidResult = await supabase
        .from('users').select('*').eq('role', 'kid').order('id').limit(1).maybeSingle()
      const taskResult = await supabase.from('tasks').select('*')
      const spendResult = await supabase
        .from('transactions').select('*').lt('amount', 0).order('created_at', { ascending: false }).limit(50)

      if (kidResult.error || taskResult.error || spendResult.error) {
        console.error('Could not load data:', kidResult.error || taskResult.error || spendResult.error)
        setLoadError('Could not load tasks. Please try again.')
      } else {
        setKid(kidResult.data ? toKid(kidResult.data) : null)
        setTasks(taskResult.data.map(toTask))
        setSpending(spendResult.data.map(toSpending))
        setLoadError('')
      }
      setLoading(false)
    }
    loadData()
  }, [reloadKey])

  const reload = () => setReloadKey((n) => n + 1)

  const retryLoad = () => {
    setLoading(true)
    reload()
  }

  // Small helper: change one task's fields in the list on screen.
  const updateTask = (id, changes) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)))

  // Send one request to the server and return its JSON answer.
  // If the server says no (or is not running), throw an error with a simple message.
  async function callServer(path, method, body) {
    let response
    try {
      response = await fetch(`${API}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (err) {
      console.error('Could not reach the server:', err)
      throw new Error('Could not reach the server. Is it running?', { cause: err })
    }

    const data = await response.json().catch(() => null)
    if (response.status === 409) {
      reload() // the task changed somewhere else (for example, the kid), so refresh the screen
      throw new Error('This task has already changed. The list was refreshed.')
    }
    if (!response.ok) {
      console.error('Server error:', response.status, data)
      throw new Error(data?.error || 'Something went wrong. Please try again.')
    }
    return data
  }

  // Run one action for one task: block double clicks and show an error if it fails.
  async function runAction(id, action) {
    if (busyId !== null) return
    setBusyId(id)
    setActionError('')
    try {
      await action()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  // Add a new task. If it fails, throw so CreateTaskForm shows "Could not create the task".
  const createTask = async ({ title, reward, type, duration_minutes }) => {
    const task = await callServer('', 'POST', { title, reward: Number(reward), type, duration_minutes })
    setTasks((prev) => [...prev, toTask(task)])
  }

  // Approve a submitted task. The server marks it approved, adds the reward to the
  // kid's balance and records the payment. A second click is refused by the server.
  const approveTask = (id) =>
    runAction(id, async () => {
      await callServer(`/${id}/approve`, 'POST')
      updateTask(id, { status: 'approved' })
      reload() // load the kid's new balance
    })

  // Ask for a redo: the task goes back to the kid as 'claimed'.
  const requestRedo = (id) =>
    runAction(id, async () => {
      await callServer(`/${id}/redo`, 'POST')
      updateTask(id, { status: 'claimed' })
    })

  // Reject a submitted task: it is closed for good and no reward is paid.
  const rejectTask = (id) =>
    runAction(id, async () => {
      await callServer(`/${id}/reject`, 'POST')
      updateTask(id, { status: 'rejected' })
    })

  // Delete a task nobody has claimed yet. The row is removed completely.
  const deleteTask = (id) =>
    runAction(id, async () => {
      await callServer(`/${id}`, 'DELETE')
      setTasks((prev) => prev.filter((t) => t.id !== id))
    })

  // Derived value: recomputed on every render, so it never gets out of date.
  const submitted = tasks.filter((t) => t.status === 'submitted')

  return (
    <div className="parent-page">
      <div className="dashboard-header">
        <Link to="/">
          <button className="logout-button">Log Out</button>
        </Link>

        <h1>Parent Dashboard</h1>
      </div>

      {loading && <p className="p-muted">Loading...</p>}

      {loadError && (
        <div className="p-alert" role="alert">
          {loadError}{' '}
          <button type="button" className="p-redo" onClick={retryLoad}>Try again</button>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {actionError && <div className="p-alert" role="alert">{actionError}</div>}

          <section className="p-card p-balance-card">
            {kid ? (
              <>
                <div className="p-label">{kid.name}'s balance</div>
                <div className="p-balance">${kid.balance.toFixed(2)}</div>
              </>
            ) : (
              <div className="p-label">No kid found in the users table yet.</div>
            )}
          </section>

          <CreateTaskForm onCreate={createTask} />

          <SubmittedTasks
            tasks={submitted}
            disabled={busyId !== null}
            onApprove={approveTask}
            onRedo={requestRedo}
            onReject={rejectTask}
          />

          <TaskList tasks={tasks} disabled={busyId !== null} onDelete={deleteTask} />

          <ConnectBank />

          <SpendingList spending={spending} />
        </>
      )}
    </div>
  )
}
