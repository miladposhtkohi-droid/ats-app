import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Kolla om det redan finns en aktiv session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Lyssna på förändringar (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <p>Laddar...</p>

  if (!session) {
    return <Login />
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 className="text-3xl font-bold text-blue-600">Inloggad som: {session.user.email}</h1>
      <button onClick={() => supabase.auth.signOut()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Logga ut
      </button>
    </div>
  )
}

export default App