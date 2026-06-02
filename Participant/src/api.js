const BASE = `${import.meta.env.VITE_API_URL || ''}/api`

export async function participantLogin(team_name, password) {
  const res = await fetch(`${BASE}/auth/participant-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_name, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Invalid team name or password')
  return data
}

export async function getConfig() {
  const res = await fetch(`${BASE}/config`)
  if (!res.ok) throw new Error('Failed to fetch config')
  return res.json()
}

export async function getParticipants() {
  const res = await fetch(`${BASE}/participants`)
  if (!res.ok) throw new Error('Failed to fetch participants')
  return res.json()
}

export async function getParticipantByEid(eid) {
  const res = await fetch(`${BASE}/participants?enterprise_id=${encodeURIComponent(eid)}`)
  if (!res.ok) throw new Error('Failed to fetch participant')
  return res.json() // returns array
}

export async function postParticipant(data) {
  const res = await fetch(`${BASE}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Registration failed')
  return res.json()
}

export async function putParticipant(id, data) {
  const res = await fetch(`${BASE}/participants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update participant')
  return res.json()
}

export async function getResources() {
  const res = await fetch(`${BASE}/resources`)
  if (!res.ok) throw new Error('Failed to fetch resources')
  return res.json()
}

export async function getSubmissionByEid(eid) {
  const res = await fetch(`${BASE}/submissions?eid=${encodeURIComponent(eid)}`)
  if (!res.ok) throw new Error('Failed to fetch submission')
  return res.json() // returns array
}

// Fetches submission for a specific round (defaults missing `round` field to 1)
export async function getSubmissionByEidAndRound(eid, round) {
  const res = await fetch(`${BASE}/submissions?eid=${encodeURIComponent(eid)}`)
  if (!res.ok) throw new Error('Failed to fetch submission')
  const all = await res.json()
  return all.filter(s => (s.round || 1) === round)
}

export async function postSubmission(data) {
  const res = await fetch(`${BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save submission')
  return res.json()
}

export async function putSubmission(id, data) {
  const res = await fetch(`${BASE}/submissions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update submission')
  return res.json()
}
