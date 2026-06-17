import { useEffect, useState } from 'react'
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core'
import { supabase } from '../supabaseClient'

const STATUSES = [
  { key: 'new', label: 'Nya' },
  { key: 'screening', label: 'Screening' },
  { key: 'interview', label: 'Intervju' },
  { key: 'offer', label: 'Erbjudande' },
  { key: 'rejected', label: 'Avslag' },
]

function CandidateCard({ candidate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
  })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-3 rounded shadow cursor-grab mb-2 border"
    >
      <p className="font-medium">{candidate.name}</p>
      <p className="text-xs text-gray-500">{candidate.jobs?.title}</p>
      {candidate.linkedin_url && (
        <a
          href={candidate.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 text-xs hover:underline"
        >
          LinkedIn →
        </a>
      )}
    </div>
  )
}

function KanbanColumn({ status, candidates }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.key })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[220px] p-3 rounded-lg ${
        isOver ? 'bg-blue-50' : 'bg-gray-100'
      }`}
    >
      <h3 className="font-bold mb-3 text-sm text-gray-700">
        {status.label} ({candidates.length})
      </h3>
      {candidates.map((c) => (
        <CandidateCard key={c.id} candidate={c} />
      ))}
    </div>
  )
}

export default function Kanban() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [jobFilter, setJobFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')

  useEffect(() => {
    fetchCandidates()
  }, [])

  async function fetchCandidates() {
    setLoading(true)
    // Hämtar kandidater + jobbtitel via relationen till jobs-tabellen
    const { data, error } = await supabase
      .from('candidates')
      .select('*, jobs(title)')
      .order('created_at', { ascending: false })

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
      .from('candidates')
      .update({ status: newStatus })
      .eq('id', candidateId)

    if (!error) {
      fetchCandidates()
    }
  }

  // Filtrera kandidater baserat på sökfälten
  const filteredCandidates = candidates.filter((c) => {
    const matchesJob = c.jobs?.title
      ?.toLowerCase()
      .includes(jobFilter.toLowerCase())
    const matchesName = c.name
      ?.toLowerCase()
      .includes(nameFilter.toLowerCase())
    return matchesJob && matchesName
  })

  if (loading) return <p className="p-8">Laddar kandidater...</p>
  if (error) return <p className="p-8 text-red-500">{error}</p>

  return (
    <div className="p-4">
      <div className="flex gap-3 mb-4 max-w-2xl">
        <input
          type="text"
          placeholder="Filtrera på jobb..."
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Filtrera på kandidatnamn..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status.key}
              status={status}
              candidates={filteredCandidates.filter((c) => c.status === status.key)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}