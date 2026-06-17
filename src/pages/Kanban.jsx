import { useEffect, useState } from "react"
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core"
import { supabase } from "../supabaseClient"
import { STATUSES, getStatus } from "../lib/statuses"
import { cn } from "../lib/cn"
import { PageHeader, LoadingState, EmptyState } from "../components/ui/Page"
import Input from "../components/ui/Input"
import Avatar from "../components/ui/Avatar"

function CandidateCard({ candidate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: candidate.id })

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group mb-2.5 cursor-grab rounded-lg border border-line bg-surface p-3 shadow-soft",
        "transition-shadow hover:shadow-card active:cursor-grabbing",
        isDragging && "ring-2 ring-brand-400"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Avatar name={candidate.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {candidate.name}
          </p>
          {candidate.jobs?.title && (
            <p className="truncate text-xs text-ink-muted">
              {candidate.jobs.title}
            </p>
          )}
        </div>
      </div>
      {candidate.linkedin_url && (
        <a
          href={candidate.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          <LinkedinIcon className="h-3 w-3" />
          LinkedIn
        </a>
      )}
    </div>
  )
}

function KanbanColumn({ statusKey, candidates }) {
  const { setNodeRef, isOver } = useDroppable({ id: statusKey })
  const status = getStatus(statusKey)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[260px] flex-1 flex-col rounded-xl border-t-4 p-3 transition-colors",
        status.column,
        status.columnBorder,
        isOver && "ring-2 ring-brand-300 ring-offset-1"
      )}
    >
      {/* Kolumnrubrik */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", status.dot)} />
          <h3 className="text-sm font-semibold text-ink-soft">
            {status.label}
          </h3>
        </div>
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/80 px-2 text-xs font-semibold text-ink-muted">
          {candidates.length}
        </span>
      </div>

      {/* Kort */}
      <div className="flex-1">
        {candidates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line/60 py-8 text-center text-xs text-ink-muted/60">
            Släpp här
          </div>
        ) : (
          candidates.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))
        )}
      </div>
    </div>
  )
}

export default function Kanban() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [jobFilter, setJobFilter] = useState("")
  const [nameFilter, setNameFilter] = useState("")

  useEffect(() => {
    fetchCandidates()
  }, [])

  async function fetchCandidates() {
    setLoading(true)
    const { data, error } = await supabase
      .from("candidates")
      .select("*, jobs(title)")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setCandidates(data)
    }
    setLoading(false)
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return

    const candidateId = active.id
    const newStatus = over.id

    const candidate = candidates.find((c) => c.id === candidateId)
    if (!candidate || candidate.status === newStatus) return

    const { error } = await supabase
      .from("candidates")
      .update({ status: newStatus })
      .eq("id", candidateId)

    if (!error) {
      fetchCandidates()
    }
  }

  const filteredCandidates = candidates.filter((c) => {
    const matchesJob = c.jobs?.title
      ?.toLowerCase()
      .includes(jobFilter.toLowerCase())
    const matchesName = c.name
      ?.toLowerCase()
      .includes(nameFilter.toLowerCase())
    return matchesJob && matchesName
  })

  return (
    <div>
      <PageHeader
        title="Kanban-tavla"
        subtitle="Dra och släpp kandidater för att uppdatera status."
      />

      {/* Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <SearchIcon className="h-4 w-4 text-ink-muted" />
          <span className="text-sm font-medium text-ink-soft">Filtrera:</span>
        </div>
        <Input
          type="text"
          placeholder="Jobbtitel..."
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="sm:max-w-xs"
        />
        <Input
          type="text"
          placeholder="Kandidatnamn..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="sm:max-w-xs"
        />
        <span className="text-sm text-ink-muted">
          {filteredCandidates.length} kandidater
        </span>
      </div>

      {loading ? (
        <LoadingState label="Laddar kandidater..." />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={<KanbanIcon className="h-7 w-7" />}
          title="Inga kandidater än"
          description="När du lagt till kandidater via Jobb visas de här som kort."
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status.key}
                statusKey={status.key}
                candidates={filteredCandidates.filter(
                  (c) => c.status === status.key
                )}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  )
}

/* ---- Ikoner ---- */
function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function KanbanIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="5" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9.5" y="3" width="5" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16" y="3" width="5" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}