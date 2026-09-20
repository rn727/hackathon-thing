import { useState } from 'react'

export default function CreateTaskForm({ onCreate }) {
  const [title, setTitle] = useState('')
  const [reward, setReward] = useState('')
  const [type, setType] = useState('completion')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !(Number(reward) > 0)) return
    onCreate({ title: title.trim(), reward, type, dueDate: dueDate || null })
    setTitle('')
    setReward('')
    setDueDate('')
  }

  return (
    <form className="p-card" onSubmit={handleSubmit}>
      <h2>Create a task</h2>
      <input
        placeholder="e.g. Finish Algebra Homework"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="p-form-row">
        <input
          type="number"
          min="0"
          step="0.5"
          placeholder="Reward ($)"
          value={reward}
          onChange={(e) => setReward(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="completion">Completion-based</option>
          <option value="time">Time-based</option>
        </select>
      </div>
      <label className="p-field-label">
        Due date (optional)
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </label>
      <button type="submit" className="p-primary">Add task</button>
    </form>
  )
}
