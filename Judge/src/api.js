const BASE = `${import.meta.env.VITE_API_URL || ''}/api`

export async function judgeLogin(username, password) {
  const res = await fetch(`${BASE}/auth/judge-login`, {
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
  if (!res.ok) throw new Error('Failed to update config')
  return res.json()
}

export async function getParticipants() {
  const res = await fetch(`${BASE}/participants`)
  if (!res.ok) throw new Error('Failed to fetch participants')
  return res.json()
}

export async function getCriteria() {
  const res = await fetch(`${BASE}/criteria`)
  if (!res.ok) throw new Error('Failed to fetch criteria')
  return res.json()
}

export async function getScoresByJudge(judgeId, round) {
  const res = await fetch(`${BASE}/scores?judge_id=${judgeId}&round=${round}`)
  if (!res.ok) throw new Error('Failed to fetch scores')
  return res.json()
}

export async function postScore(data) {
  const res = await fetch(`${BASE}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save score')
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
