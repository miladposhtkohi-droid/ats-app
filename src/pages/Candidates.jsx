import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Candidates({ job, onBack }) {
  const [candidates, setCandidates] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCandidates()
  }, [])

  async function fetchCandidates() {
    setLoading(true)
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })

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

    const { error } = await supabase.from('candidates').insert({
      job_id: job.id,
      name,
      email,
      linkedin_url: linkedinUrl,
    })

    if (error) {
      setError(error.message)
    } else {
      setName('')
      setEmail('')
      setLinkedinUrl('')
      fetchCandidates()
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <button
        onClick={onBack}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Tillbaka till jobb
      </button>

      <h2 className="text-2xl font-bold mb-1">{job.title}</h2>
      <p className="text-gray-500 mb-6">Kandidater för detta jobb</p>

      <form onSubmit={handleAddCandidate} className="mb-8 space-y-3">
        <input
          type="text"
          placeholder="Namn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email (valfritt)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="url"
          placeholder="LinkedIn-länk (valfritt)"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Lägg till kandidat
        </button>
      </form>

      <h3 className="text-xl font-bold mb-4">Kandidatlista</h3>

      {loading ? (
        <p>Laddar kandidater...</p>
      ) : candidates.length === 0 ? (
        <p className="text-gray-500">Inga kandidater tillagda än.</p>
      ) : (
        <ul className="space-y-2">
          {candidates.map((candidate) => (
            <li key={candidate.id} className="p-4 border rounded">
              <h4 className="font-semibold">{candidate.name}</h4>
              {candidate.email && <p className="text-gray-600 text-sm">{candidate.email}</p>}
              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                >
                  LinkedIn-profil →
                </a>
              )}
              <span className="block mt-1 text-xs bg-gray-100 inline-block px-2 py-1 rounded">
                {candidate.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}