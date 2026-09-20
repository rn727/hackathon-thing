import { taskDetails } from './taskUtils.js'

// Tasks the kid has marked as done. The parent picks one of three outcomes:
//   Approve -> reward is added to the balance
//   Redo    -> task goes back to the kid to try again
//   Reject  -> task is closed for good, no reward
export default function SubmittedTasks({ tasks, onApprove, onRedo, onReject }) {
  return (
    <section className="p-card">
      <h2>Waiting for your approval</h2>
      {tasks.length === 0 && <p className="p-muted">Nothing to review right now.</p>}
      <ul className="p-list p-task-list">
        {tasks.map((t) => (
          <li key={t.id}>
            <div className="p-task-row">
              <span>
                {t.title} <span className="p-reward">${t.reward}</span>
                <span className="p-due">{taskDetails(t)}</span>
              </span>
            </div>
            <div className="p-actions">
              <button className="p-approve" onClick={() => onApprove(t.id)}>Approve</button>
              <button className="p-redo" onClick={() => onRedo(t.id)}>Redo</button>
              <button className="p-reject" onClick={() => onReject(t.id)}>Reject</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
