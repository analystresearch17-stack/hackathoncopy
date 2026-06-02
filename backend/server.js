const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true })
  }
  res.status(401).json({ success: false, message: 'Invalid username or password' })
})

app.post('/api/auth/judge-login', async (req, res) => {
  const { username, password } = req.body
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single()
  if (error || !data) return res.status(401).json({ success: false, message: 'Invalid username or password' })
  res.json({ success: true, judge: { id: data.id, name: data.name, round_assignment: data.round_assignment || 'both' } })
})

app.post('/api/auth/participant-login', async (req, res) => {
  const { team_name, password } = req.body
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('team_name', team_name)
    .eq('password', password)
    .single()
  if (error || !data) return res.status(401).json({ success: false, message: 'Invalid team name or password' })
  res.json({
    success: true,
    participant: {
      id: data.id,
      name: data.name,
      team_name: data.team_name,
      enterprise_id: data.enterprise_id,
      team_id: data.team_id,
    },
  })
})

// ── Config ────────────────────────────────────────────────────────────────────

app.get('/api/config', async (_req, res) => {
  const { data, error } = await supabase.from('config').select('data').eq('id', 1).single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data.data)
})

app.put('/api/config', async (req, res) => {
  const { data, error } = await supabase
    .from('config')
    .update({ data: req.body })
    .eq('id', 1)
    .select('data')
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data.data)
})

// ── Participants ──────────────────────────────────────────────────────────────

app.get('/api/participants', async (req, res) => {
  let query = supabase.from('participants').select('*')
  if (req.query.enterprise_id) query = query.eq('enterprise_id', req.query.enterprise_id)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/api/participants/:id', async (req, res) => {
  const { data, error } = await supabase.from('participants').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: error.message })
  res.json(data)
})

app.post('/api/participants', async (req, res) => {
  const { data, error } = await supabase.from('participants').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

app.put('/api/participants/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('participants')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.delete('/api/participants/:id', async (req, res) => {
  const { error } = await supabase.from('participants').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({})
})

// ── Submissions ───────────────────────────────────────────────────────────────

app.get('/api/submissions', async (req, res) => {
  let query = supabase.from('submissions').select('*')
  if (req.query.eid) query = query.eq('eid', req.query.eid)
  if (req.query.participant_id) query = query.eq('participant_id', req.query.participant_id)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/api/submissions/:id', async (req, res) => {
  const { data, error } = await supabase.from('submissions').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: error.message })
  res.json(data)
})

app.post('/api/submissions', async (req, res) => {
  const { data, error } = await supabase.from('submissions').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

app.put('/api/submissions/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('submissions')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// ── Resources ─────────────────────────────────────────────────────────────────

app.get('/api/resources', async (_req, res) => {
  const { data, error } = await supabase.from('resources').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/resources', async (req, res) => {
  const { data, error } = await supabase.from('resources').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

app.delete('/api/resources/:id', async (req, res) => {
  const { error } = await supabase.from('resources').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({})
})

// ── Judges ────────────────────────────────────────────────────────────────────

app.get('/api/judges', async (_req, res) => {
  const { data, error } = await supabase.from('judges').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/judges', async (req, res) => {
  const { data, error } = await supabase.from('judges').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

app.put('/api/judges/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('judges')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.delete('/api/judges/:id', async (req, res) => {
  const { error } = await supabase.from('judges').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({})
})

// ── Criteria ──────────────────────────────────────────────────────────────────

app.get('/api/criteria', async (_req, res) => {
  const { data, error } = await supabase.from('criteria').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/criteria', async (req, res) => {
  const { data, error } = await supabase.from('criteria').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

app.put('/api/criteria/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('criteria')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.delete('/api/criteria/:id', async (req, res) => {
  const { error } = await supabase.from('criteria').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({})
})

// ── Scores ────────────────────────────────────────────────────────────────────

// Flatten score_data JSONB back into top-level keys for API compatibility
function flattenScore(row) {
  if (!row) return row
  const { score_data, ...rest } = row
  return { ...rest, ...(score_data || {}) }
}

// Separate known columns from dynamic criteria scores
const SCORE_COLUMNS = new Set(['id', 'judge_id', 'judge_name', 'participant_id', 'team_name', 'round', 'total', 'status', 'frozen_at'])

function splitScoreBody(body) {
  const base = {}
  const score_data = {}
  for (const [k, v] of Object.entries(body)) {
    if (SCORE_COLUMNS.has(k)) base[k] = v
    else score_data[k] = v
  }
  base.score_data = score_data
  return base
}

app.get('/api/scores', async (req, res) => {
  let query = supabase.from('scores').select('*')
  if (req.query.judge_id) query = query.eq('judge_id', req.query.judge_id)
  if (req.query.round) query = query.eq('round', req.query.round)
  if (req.query.participant_id) query = query.eq('participant_id', req.query.participant_id)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data.map(flattenScore))
})

app.post('/api/scores', async (req, res) => {
  const { data, error } = await supabase.from('scores').insert(splitScoreBody(req.body)).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(flattenScore(data))
})

app.put('/api/scores/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('scores')
    .update(splitScoreBody(req.body))
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(flattenScore(data))
})

// ── Start ─────────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => console.log(`HackerArena backend running at http://localhost:${PORT}`))
}

module.exports = app
