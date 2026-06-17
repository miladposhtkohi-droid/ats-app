import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Jobs from './pages/Jobs'
import Kanban from './pages/Kanban'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('jobs') // 'jobs' eller 'kanban'

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
        <div className="flex gap-4 items-center">
          <span>
            Inloggad som: <strong>{session.user.email}</strong> ({profile?.role})
          </span>
          <nav className="flex gap-2">
            <button
              onClick={() => setView('jobs')}
              className={`px-3 py-1 rounded ${view === 'jobs' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              Jobb
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1 rounded ${view === 'kanban' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              Kanban
            </button>
          </nav>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-gray-200 hover:bg-gray-300 py-1 px-3 rounded"
        >
          Logga ut
        </button>
      </header>

      {view === 'jobs' ? <Jobs session={session} /> : <Kanban />}
    </div>
  )
}

export default App