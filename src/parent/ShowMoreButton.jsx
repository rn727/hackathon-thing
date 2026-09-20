// "Show more" / "Show less" buttons shared by the task list and the spending list.
//   remaining   - how many rows are still hidden
//   canCollapse - true once the list has been expanded past the first page
export default function ShowMoreButton({ remaining, canCollapse, onMore, onLess }) {
  if (remaining <= 0 && !canCollapse) return null
  return (
    <div className="p-show-row">
      {remaining > 0 && (
        <button type="button" className="p-show-more" onClick={onMore}>
          Show more ({remaining} more)
        </button>
      )}
      {canCollapse && (
        <button type="button" className="p-show-more" onClick={onLess}>
          Show less
        </button>
      )}
    </div>
  )
}
