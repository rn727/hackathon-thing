import { useState } from 'react'
import { sampleKid, sampleTasks, sampleSpending } from '../parent/parentSampleData.js'
import '../parent/parent.css'
import { Link } from 'react-router-dom'
export default function ChildDashboard() {
  const [kid] = useState(sampleKid)
  const [tasks, setTasks] = useState(sampleTasks)
  const spending = sampleSpending

  const claimTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, status: 'claimed' }
          : task
      )
    )
  }

  const submitTask = (id) => {
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

                {task.dueDate && (
                  <p>Due: {task.dueDate}</p>
                )}
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

                {task.dueDate && (
                  <p>Due: {task.dueDate}</p>
                )}
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