import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase.js'
import CreateTaskForm from './CreateTaskForm.jsx'
import SubmittedTasks from './SubmittedTasks.jsx'
import TaskList from './TaskList.jsx'
import SpendingList from './SpendingList.jsx'
import { sampleSpending } from './parentSampleData.js'
import './parent.css'

// Supabase returns numeric columns (reward, balance) as strings like "5.00".
// Convert them to real numbers as soon as the data comes in.
const toTask = (row) => ({ ...row, reward: Number(row.reward) })
const toKid = (row) => ({ ...row, balance: Number(row.balance) })

// Parent screen. Tasks and the kid's balance live in Supabase.
export default function ParentDashboard() {
  const [kid, setKid] = useState(null)   // the kid's row from the users table (null = none found)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('') // shown when Approve / Redo / Reject / Delete fails
  const [reloadKey, setReloadKey] = useState(0)     // change this number to load the data again
  const [busyId, setBusyId] = useState(null)         // id of the task being changed right now
  const spending = sampleSpending                    // TODO: load from the Plaid endpoint on the Express server

  // Load the kid and all tasks from Supabase. Runs on the first render, and again
  // whenever `reloadKey` changes (Try again button, or after a conflicting change).
  useEffect(() => {
    async function loadData() {
      const kidResult = await supabase
        .from('users').select('*').eq('role', 'kid').order('id').limit(1).maybeSingle()
      const taskResult = await supabase.from('tasks').select('*')

      if (kidResult.error || taskResult.error) {
        console.error('Could not load data:', kidResult.error || taskResult.error)
        setLoadError('Could not load tasks. Please try again.')
      } else {
        setKid(kidResult.data ? toKid(kidResult.data) : null)
        setTasks(taskResult.data.map(toTask))
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

  // If Supabase returned an error, log the details and throw a simple message.
  const check = (error, message) => {
    if (error) {
      console.error(message, error)
      throw new Error(message, { cause: error })
    }
  }

  // Change a task's status, but only if it currently has the status `from`.
  // This stops the same task from being approved twice.
  async function setStatus(id, from, to) {
    const { data, error } = await supabase
      .from('tasks').update({ status: to }).eq('id', id).eq('status', from).select()
    check(error, 'Could not update the task. Please try again.')
    if (data.length === 0) {
      reload() // the task changed somewhere else, so refresh the screen
      throw new Error('This task has already changed. The list was refreshed.')
    }
    updateTask(id, { status: to })
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
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title, reward: Number(reward), type, duration_minutes, status: 'available' })
      .select()
      .single()
    if (error) {
      console.error('Could not create the task:', error)
      throw error
    }
    setTasks((prev) => [...prev, toTask(data)])
  }

  // Approve a submitted task, in this order:
  //   1. mark the task approved (only if it is still 'submitted')
  //   2. add the reward to the kid's balance
  //   3. record the payment in the transactions table
  const approveTask = (id) =>
    runAction(id, async () => {
      const task = tasks.find((t) => t.id === id)
      const kidId = task?.kid_id ?? kid?.id
      if (!task || !kidId) throw new Error('Could not find the kid for this task.')

      await setStatus(id, 'submitted', 'approved')

      try {
        // Read the newest balance first, so we never add to an old number.
        const { data: row, error: readError } = await supabase
          .from('users').select('balance').eq('id', kidId).single()
        check(readError, 'Could not update the balance.')
        const newBalance = Number(row.balance) + task.reward

        const { error: balanceError } = await supabase
          .from('users').update({ balance: newBalance }).eq('id', kidId)
        check(balanceError, 'Could not update the balance.')

        const { error: transactionError } = await supabase
          .from('transactions').insert({ amount: task.reward, kid_id: kidId })
        check(transactionError, 'Could not record the payment.')

        if (kid && kid.id === kidId) setKid({ ...kid, balance: newBalance })
      } catch (err) {
        // Put the task back so the parent can try again (best effort).
        await supabase.from('tasks').update({ status: 'submitted' }).eq('id', id)
        updateTask(id, { status: 'submitted' })
        throw new Error(`${err.message} The task was not approved.`, { cause: err })
      }
    })

  // Ask for a redo: the task goes back to the kid as 'claimed'.
  const requestRedo = (id) => runAction(id, () => setStatus(id, 'submitted', 'claimed'))

  // Reject a submitted task: it is closed for good and no reward is paid.
  const rejectTask = (id) => runAction(id, () => setStatus(id, 'submitted', 'rejected'))

  // Delete a task nobody has claimed yet. The row is removed completely.
  const deleteTask = (id) =>
    runAction(id, async () => {
      const { data, error } = await supabase
        .from('tasks').delete().eq('id', id).eq('status', 'available').select()
      check(error, 'Could not delete the task. Please try again.')
      if (data.length === 0) {
        reload() // someone claimed it in the meantime, so refresh the screen
        throw new Error('This task was just claimed, so it was not deleted.')
      }
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

          <SpendingList spending={spending} />
        </>
      )}
    </div>
  )
}
