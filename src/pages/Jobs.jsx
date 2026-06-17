import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Candidates from './Candidates'

export default function Jobs({ session }) {
  const [jobs, setJobs] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

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

    const { error } = await supabase.from('jobs').insert({
      title,
      description,
      customer_id: session.user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setTitle('')
      setDescription('')
      fetchJobs()
    }
  }

  // Om ett jobb är valt, visa Candidates-vyn istället
  if (selectedJob) {
    return (
      <Candidates
        job={selectedJob}
        onBack={() => setSelectedJob(null)}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Skapa nytt jobb</h2>

      <form onSubmit={handleCreateJob} className="mb-8 space-y-3">
        <input
          type="text"
          placeholder="Jobbtitel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Beskrivning (valfritt)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Skapa jobb
        </button>
      </form>

      <h2 className="text-2xl font-bold mb-4">Mina jobb</h2>

      {loading ? (
        <p>Laddar jobb...</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500">Inga jobb skapade än.</p>
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="p-4 border rounded cursor-pointer hover:bg-gray-50"
            >
              <h3 className="font-semibold">{job.title}</h3>
              {job.description && <p className="text-gray-600">{job.description}</p>}
              <span className="text-sm text-blue-600">Visa kandidater →</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}