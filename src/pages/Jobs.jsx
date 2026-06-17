import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import Candidates from "./Candidates"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Textarea from "../components/ui/Textarea"
import { Card } from "../components/ui/Card"
import { PageHeader, EmptyState, LoadingState } from "../components/ui/Page"

export default function Jobs({ session }) {
  const [jobs, setJobs] = useState([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    setLoading(true)
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setJobs(data)
    }
    setLoading(false)
  }

  async function handleCreateJob(e) {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.from("jobs").insert({
      title,
      description,
      customer_id: session.user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setTitle("")
      setDescription("")
      fetchJobs()
    }
  }

  // Om ett jobb är valt, visa Candidates-vyn istället
  if (selectedJob) {
    return <Candidates job={selectedJob} onBack={() => setSelectedJob(null)} />
  }

  return (
    <div>
      <PageHeader
        title="Jobbannonser"
        subtitle="Skapa och hantera dina rekryteringar."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-8">
        {/* ---- Vänster: skapa jobb ---- */}
        <div className="order-2 lg:order-1">
          <Card className="lg:sticky lg:top-24">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                Skapa nytt jobb
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Fyll i titel och beskrivning.
              </p>
            </div>
            <form onSubmit={handleCreateJob} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-soft">
                  Jobbtitel
                </label>
                <Input
                  type="text"
                  placeholder="t.ex. Frontend-utvecklare"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-soft">
                  Beskrivning{" "}
                  <span className="font-normal text-ink-muted">(valfritt)</span>
                </label>
                <Textarea
                  placeholder="Kort beskrivning av rollen, krav etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full">
                <PlusIcon className="h-4 w-4" />
                Skapa jobb
              </Button>
            </form>
          </Card>
        </div>

        {/* ---- Höger: jobblista ---- */}
        <div className="order-1 lg:order-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Mina jobb{" "}
              <span className="ml-1 text-sm font-normal text-ink-muted">
                ({jobs.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <LoadingState label="Laddar jobb..." />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={<BriefcaseIcon className="h-7 w-7" />}
              title="Inga jobb skapade än"
              description="Skapa ditt första jobb för att börja lägga till kandidater."
            />
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="group flex w-full items-start gap-4 rounded-xl border border-line bg-surface p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/10"
                  >
                    <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                      <BriefcaseIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold text-ink">
                        {job.title}
                      </h3>
                      {job.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                          {job.description}
                        </p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                        Visa kandidater
                        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---- Ikoner ---- */
function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function BriefcaseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1ZM8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M4 12h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowRightIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}