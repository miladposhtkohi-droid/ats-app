import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Jobs from './pages/Jobs'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Kunde inte hämta profil:', error.message)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  if (loading) return <p className="p-8">Laddar...</p>

  if (!session) {
    return <Login />
  }

  return (
    <div className="font-sans">
      <header className="p-4 border-b flex justify-between items-center">
        <span>
          Inloggad som: <strong>{session.user.email}</strong> ({profile?.role})
        </span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-gray-200 hover:bg-gray-300 py-1 px-3 rounded"
        >
          Logga ut
        </button>
      </header>

      <Jobs session={session} />
    </div>
  )
}

export default App