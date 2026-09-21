import { useEffect, useState } from 'react'

const API = 'http://localhost:8000/api'

// Plaid Link (Sandbox). The server exchanges the public token and stores the
// access token in Supabase, so the browser never sees the access token.
export default function ConnectBank({ onSynced }) {
  const [linked, setLinked] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [accounts, setAccounts] = useState([])
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  async function loadAccounts() {
    try {
      const response = await fetch(`${API}/plaid-accounts`)
      const data = await response.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Could not load the bank accounts:', err)
      setStatus('Could not load the bank accounts.')
    }
  }

  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch(`${API}/plaid-status`)
        const data = await response.json()
        setLinked(Boolean(data.linked))
        if (data.linked) await loadAccounts()
      } catch (err) {
        console.error('Could not check the bank connection:', err)
        setStatus('Could not check the bank connection. Is the server running?')
      }
      setChecking(false)
    }
    loadStatus()
  }, [])

  async function connect() {
    setBusy(true)
    setStatus('Opening Plaid...')
    try {
      const tokenResponse = await fetch(`${API}/create-link-token`, { method: 'POST' })
      const { link_token } = await tokenResponse.json()
      if (!link_token) throw new Error('No link token')

      window.Plaid.create({
        token: link_token,
        onSuccess: async (public_token) => {
          const response = await fetch(`${API}/exchange-public-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token }),
          })
          if (response.ok) {
            setLinked(true)
            setStatus('')
            await loadAccounts()
          } else {
            setStatus('Could not save the bank connection. Check the server logs.')
          }
          setBusy(false)
        },
        onExit: () => {
          setStatus('')
          setBusy(false)
        },
      }).open()
    } catch (err) {
      console.error('Plaid Link failed:', err)
      setStatus('Could not connect to Plaid. Is the server running?')
      setBusy(false)
    }
  }

  // Mark one account as the kid's, or pass null to clear the choice. The server
  // clears the old choice, so only one account is ever the kid's.
  async function chooseKidAccount(accountId) {
    setSaving(true)
    setStatus('')
    try {
      const response = await fetch(`${API}/kid-account`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId }),
      })
      if (!response.ok) throw new Error(`Server said ${response.status}`)
      await loadAccounts()
    } catch (err) {
      console.error("Could not save the kid's account:", err)
      setStatus("Could not save the child's account.")
    }
    setSaving(false)
  }

  // Pulls the bank's latest transactions and balances into Supabase.
  async function syncNow() {
    setSyncing(true)
    setStatus('')
    try {
      const response = await fetch(`${API}/plaid-sync`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `Server said ${response.status}`)
      setStatus(`Saved ${data.stored} transaction${data.stored === 1 ? '' : 's'}.`)
      await loadAccounts()
      onSynced?.()
    } catch (err) {
      console.error('Could not refresh the bank data:', err)
      setStatus(err.message || 'Could not refresh the bank data.')
    }
    setSyncing(false)
  }

  const kidAccount = accounts.find((a) => a.kid_id !== null)

  return (
    <section className="p-card">
      <h2>Bank account</h2>
      {linked ? (
        <p className="p-muted">Bank account is already linked.</p>
      ) : (
        <p className="p-muted p-small">Link a bank account to show real spending.</p>
      )}
      <button
        type="button"
        className="p-primary"
        onClick={connect}
        disabled={linked || busy || checking}
      >
        {linked ? 'Bank account already linked' : 'Connect Bank'}
      </button>

      {linked && accounts.length > 0 && (
        <>
          <p className="p-field-label">
            Which account is the child's? Spending on it counts towards the child's balance.
          </p>
          {accounts.map((account) => (
            <label key={account.id} className="p-radio">
              <input
                type="radio"
                name="kid-account"
                checked={account.kid_id !== null}
                disabled={saving}
                onChange={() => chooseKidAccount(account.id)}
              />
              <span>
                {account.name}
                {account.current_balance != null && (
                  <span className="p-muted p-small"> · ${Number(account.current_balance).toFixed(2)}</span>
                )}
              </span>
            </label>
          ))}
          <div className="p-actions">
            <button type="button" className="p-primary" disabled={syncing || saving} onClick={syncNow}>
              {syncing ? 'Refreshing...' : 'Refresh'}
            </button>
            {kidAccount && (
              <button type="button" className="p-redo" disabled={saving || syncing} onClick={() => chooseKidAccount(null)}>
                Clear
              </button>
            )}
          </div>
        </>
      )}

      {linked && accounts.length === 0 && (
        <p className="p-muted p-small">No accounts found for the linked bank yet.</p>
      )}

      {status && <p className="p-muted p-small">{status}</p>}
    </section>
  )
}
