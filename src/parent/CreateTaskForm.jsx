import { useState } from 'react'

export default function CreateTaskForm({ onCreate }) {
  const [title, setTitle] = useState('')
  const [reward, setReward] = useState('')
  const [type, setType] = useState('completion')
  const [duration, setDuration] = useState('') // minutes, only used for time-based tasks

  const [errors, setErrors] = useState({})       // per-field validation messages
  const [submitError, setSubmitError] = useState('') // set if onCreate itself fails
  const [success, setSuccess] = useState(false)

  const hasErrors = Object.values(errors).some(Boolean)

  // Returns an object like { title: 'message', reward: 'message' }; empty means valid.
  const validate = () => {
    const found = {}
    if (!title.trim()) found.title = 'Enter a task title.'
    if (!(Number(reward) > 0)) found.reward = 'Enter a reward greater than $0.'
    if (type === 'time' && !(Number(duration) > 0)) {
      found.duration = 'Enter how many minutes the kid should spend on this task.'
    }
    return found
  }

  // Clears the message for one field (and any old success/failure banner) once the user edits it.
  const touch = (field) => {
    setSuccess(false)
    setSubmitError('')
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess(false)
    setSubmitError('')

    const found = validate()
    setErrors(found)
    if (Object.values(found).some(Boolean)) return // stop here; the errors are shown below

    try {
      // await so this also works when onCreate becomes an async Supabase call.
      await onCreate({
        title: title.trim(),
        reward,
        type,
        duration_minutes: type === 'time' ? Number(duration) : null,
      })
      setTitle('')
      setReward('')
      setDuration('')
      setSuccess(true)
    } catch {
      setSubmitError('Could not create the task. Please try again.')
    }
  }

  return (
    <form className="p-card" onSubmit={handleSubmit} noValidate>
      <h2>Create a task</h2>

      {/* Summary banner: makes a failed attempt obvious at a glance. */}
      {(hasErrors || submitError) && (
        <div className="p-alert" role="alert">
          {submitError || 'Task not created. Please fix the highlighted fields.'}
        </div>
      )}
      {success && <div className="p-success" role="status">Task created.</div>}

      <input
        className={errors.title ? 'p-invalid' : ''}
        placeholder="e.g. Finish Algebra Homework"
        value={title}
        onChange={(e) => { setTitle(e.target.value); touch('title') }}
      />
      {errors.title && <p className="p-field-error">{errors.title}</p>}

      <div className="p-form-row">
        <div className="p-form-col">
          <input
            className={errors.reward ? 'p-invalid' : ''}
            type="number"
            min="0"
            step="0.5"
            placeholder="Reward ($)"
            value={reward}
            onChange={(e) => { setReward(e.target.value); touch('reward') }}
          />
          {errors.reward && <p className="p-field-error">{errors.reward}</p>}
        </div>
        <div className="p-form-col">
          <select value={type} onChange={(e) => { setType(e.target.value); touch('duration') }}>
            <option value="completion">Completion-based</option>
            <option value="time">Time-based</option>
          </select>
        </div>
      </div>

      {/* Only time-based tasks need a duration. */}
      {type === 'time' && (
        <label className="p-field-label">
          Time to spend (minutes)
          <input
            className={errors.duration ? 'p-invalid' : ''}
            type="number"
            min="1"
            step="5"
            placeholder="e.g. 30"
            value={duration}
            onChange={(e) => { setDuration(e.target.value); touch('duration') }}
          />
          {errors.duration && <p className="p-field-error">{errors.duration}</p>}
        </label>
      )}

      <button type="submit" className="p-primary">Add task</button>
    </form>
  )
}
