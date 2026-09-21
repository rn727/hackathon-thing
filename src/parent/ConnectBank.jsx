import { useEffect, useState } from 'react'

const API = 'http://localhost:8000/api'

// Plaid Link (Sandbox). The server exchanges the public token and stores the
// access token in Supabase, so the browser never sees the access token.
export default function ConnectBank() {
  const [linked, setLinked] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch(`${API}/plaid-status`)
        const data = await response.json()
        setLinked(Boolean(data.linked))
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
      {status && <p className="p-muted p-small">{status}</p>}
    </section>
  )
}
