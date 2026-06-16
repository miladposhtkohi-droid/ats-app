import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [status, setStatus] = useState('Testar anslutning...')

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setStatus('Fel: ' + error.message)
      } else {
        setStatus('Anslutning fungerar! ✅')
      }
    }
    testConnection()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>ATS App</h1>
      <p>{status}</p>
    </div>
  )
}

export default App