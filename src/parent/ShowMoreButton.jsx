// "Show more" button shared by the task list and the spending list.
// Renders nothing when there are no hidden rows left.
export default function ShowMoreButton({ remaining, onClick }) {
  if (remaining <= 0) return null
  return (
    <button type="button" className="p-show-more" onClick={onClick}>
      Show more ({remaining} more)
    </button>
  )
}
