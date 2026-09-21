import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import ShowMoreButton from './ShowMoreButton.jsx'
import { PAGE_SIZE } from './taskUtils.js'

// Bank spending synced from Plaid. Task rewards live in the same table, so this
// reads only source = 'plaid'. Money coming in is stored positive (a refund, a
// paycheck), and a spending list shows money going out, so only negative rows.
// Bump `reloadKey` to load the list again after a sync.
export default function SpendingList({ reloadKey }) {
  const [spending, setSpending] = useState([])
  const [error, setError] = useState('')
  const [shown, setShown] = useState(PAGE_SIZE)

  useEffect(() => {
    async function loadSpending() {
      const { data, error: loadError } = await supabase
        .from('transactions')
        .select('id, name, amount, created_at')
        .eq('source', 'plaid')
        .lt('amount', 0)
        .order('created_at', { ascending: false })

      if (loadError) {
        console.error('Could not load recent spending:', loadError)
        setError('Could not load recent spending.')
        return
      }
      setError('')
      setSpending(data)
    }
    loadSpending()
  }, [reloadKey])

  return (
    <section className="p-card">
      <h2>Recent spending</h2>
      {error && <p className="p-muted p-small">{error}</p>}
      {!error && spending.length === 0 && (
        <p className="p-muted p-small">No bank spending yet. Connect a bank and press Refresh.</p>
      )}
      <ul className="p-list">
        {spending.slice(0, shown).map((s) => (
          <li key={s.id}>
            <span>
              {s.name || 'Purchase'}
              <span className="p-muted p-small"> · {s.created_at.slice(0, 10)}</span>
            </span>
            <span className="p-spend">-${Math.abs(Number(s.amount)).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <ShowMoreButton
        remaining={spending.length - shown}
        canCollapse={shown > PAGE_SIZE}
        onMore={() => setShown((n) => n + PAGE_SIZE)}
        onLess={() => setShown(PAGE_SIZE)}
      />
    </section>
  )
}
