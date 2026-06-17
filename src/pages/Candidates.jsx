import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { Card } from "../components/ui/Card"
import { PageHeader, EmptyState, LoadingState } from "../components/ui/Page"
import { StatusBadge } from "../components/ui/Badge"
import Avatar from "../components/ui/Avatar"

export default function Candidates({ job, onBack }) {
  const [candidates, setCandidates] = useState([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCandidates()
  }, [])

  async function fetchCandidates() {
    setLoading(true)
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setCandidates(data)
    }
    setLoading(false)
  }

  async function handleAddCandidate(e) {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.from("candidates").insert({
      job_id: job.id,
      name,
      email,
      linkedin_url: linkedinUrl,
    })

    if (error) {
      setError(error.message)
    } else {
      setName("")
      setEmail("")
      setLinkedinUrl("")
      fetchCandidates()
    }
  }

  return (
    <div>
      {/* Bakåt-knapp */}
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-brand-600"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Tillbaka till jobb
      </button>

      <PageHeader
        title={job.title}
        subtitle="Kandidater för detta jobb"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-8">
        {/* ---- Vänster: lägg till kandidat ---- */}
        <div className="order-2 lg:order-1">
          <Card className="lg:sticky lg:top-24">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                Lägg till kandidat
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Fyll i kandidatens uppgifter.
              </p>
            </div>
            <form onSubmit={handleAddCandidate} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-soft">
                  Namn
                </label>
                <Input
                  type="text"
                  placeholder="För- och efternamn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-soft">
                  E-post{" "}
                  <span className="font-normal text-ink-muted">(valfritt)</span>
                </label>
                <Input
                  type="email"
                  placeholder="namn@exempel.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-soft">
                  LinkedIn{" "}
                  <span className="font-normal text-ink-muted">(valfritt)</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full">
                <PlusIcon className="h-4 w-4" />
                Lägg till kandidat
              </Button>
            </form>
          </Card>
        </div>

        {/* ---- Höger: kandidatlista ---- */}
        <div className="order-1 lg:order-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Kandidater{" "}
              <span className="ml-1 text-sm font-normal text-ink-muted">
                ({candidates.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <LoadingState label="Laddar kandidater..." />
          ) : candidates.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="h-7 w-7" />}
              title="Inga kandidater än"
              description="Lägg till din första kandidat med formuläret till vänster."
            />
          ) : (
            <ul className="space-y-3">
              {candidates.map((candidate) => (
                <li key={candidate.id}>
                  <Card className="p-4 transition-colors hover:border-brand-200">
                    <div className="flex items-start gap-3.5">
                      <Avatar name={candidate.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-display font-semibold text-ink">
                              {candidate.name}
                            </h3>
                            {candidate.email && (
                              <a
                                href={`mailto:${candidate.email}`}
                                className="text-sm text-ink-muted transition-colors hover:text-brand-600"
                              >
                                {candidate.email}
                              </a>
                            )}
                          </div>
                          <StatusBadge status={candidate.status} />
                        </div>
                        {candidate.linkedin_url && (
                          <a
                            href={candidate.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
                          >
                            <LinkedinIcon className="h-3.5 w-3.5" />
                            LinkedIn-profil
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
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
function ArrowLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M19 12H5m0 0 6-6m-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LinkedinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.74v20.5C0 23.2.8 24 1.77 24h20.45c.98 0 1.78-.8 1.78-1.76V1.74C24 .78 23.2 0 22.22 0Z" />
    </svg>
  )
}

function ExternalLinkIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}