const BASE = `${import.meta.env.VITE_API_URL || ''}/api`

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Invalid credentials')
  return data
}

export async function getConfig() {
  const res = await fetch(`${BASE}/config`)
  if (!res.ok) throw new Error('Failed to fetch config')
  return res.json()
}

export async function putConfig(data) {
  const res = await fetch(`${BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save config')
  return res.json()
}

export async function getParticipants() {
  const res = await fetch(`${BASE}/participants`)
  if (!res.ok) throw new Error('Failed to fetch participants')
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

export async function deleteParticipant(id) {
  const res = await fetch(`${BASE}/participants/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete participant')
}

export async function getSubmissions() {
  const res = await fetch(`${BASE}/submissions`)
  if (!res.ok) throw new Error('Failed to fetch submissions')
  return res.json()
}

export async function getResources() {
  const res = await fetch(`${BASE}/resources`)
  if (!res.ok) throw new Error('Failed to fetch resources')
  return res.json()
}

export async function addResource(data) {
  const res = await fetch(`${BASE}/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add resource')
  return res.json()
}

export async function deleteResource(id) {
  const res = await fetch(`${BASE}/resources/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete resource')
}

export async function getScores() {
  const res = await fetch(`${BASE}/scores`)
  if (!res.ok) throw new Error('Failed to fetch scores')
  return res.json()
}

export async function putScore(id, data) {
  const res = await fetch(`${BASE}/scores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update score')
  return res.json()
}

export async function getJudges() {
  const res = await fetch(`${BASE}/judges`)
  if (!res.ok) throw new Error('Failed to fetch judges')
  return res.json()
}

export async function postJudge(data) {
  const res = await fetch(`${BASE}/judges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add judge')
  return res.json()
}

export async function putJudge(id, data) {
  const res = await fetch(`${BASE}/judges/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update judge')
  return res.json()
}

export async function deleteJudge(id) {
  const res = await fetch(`${BASE}/judges/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete judge')
}

export async function getCriteria() {
  const res = await fetch(`${BASE}/criteria`)
  if (!res.ok) throw new Error('Failed to fetch criteria')
  return res.json()
}

export async function postCriterion(data) {
  const res = await fetch(`${BASE}/criteria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add criterion')
  return res.json()
}

export async function putCriterion(id, data) {
  const res = await fetch(`${BASE}/criteria/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update criterion')
  return res.json()
}

export async function deleteCriterion(id) {
  const res = await fetch(`${BASE}/criteria/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete criterion')
}
