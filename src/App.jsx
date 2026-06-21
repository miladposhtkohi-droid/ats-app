import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import Login from "./pages/Login"
import Jobs from "./pages/Jobs"
import Kanban from "./pages/Kanban"
import Admin from "./pages/Admin"
import AppLayout from "./components/layout/AppLayout"
import { LoadingState } from "./components/ui/Page"

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("jobs") // 'jobs', 'kanban' eller 'admin'

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Kunde inte hämta profil:", error.message)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <LoadingState label="Startar IrisATS..." />
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <AppLayout
      email={session.user.email}
      role={profile?.role}
      view={view}
      onViewChange={setView}
      onSignOut={() => supabase.auth.signOut()}
    >
      {view === "jobs" && <Jobs session={session} />}
      {view === "kanban" && <Kanban />}
      {view === "admin" && profile?.role === "admin" && (
        <Admin session={session} />
      )}
    </AppLayout>
  )
}

export default App