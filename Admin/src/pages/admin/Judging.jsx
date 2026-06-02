import { useState, useEffect, useMemo } from 'react'
import { getParticipants } from '../../api'
import { useToast } from '../../components/Toast'

const BASE = '/api'

const CRITERIA = [
  { key: 'ai_usage',          label: 'AI Usage & Innovation',      max: 30 },
  { key: 'business_impact',   label: 'Business Impact',             max: 25 },
  { key: 'speed_of_delivery', label: 'Speed of Delivery',           max: 20 },
  { key: 'day_plan',          label: '30-60-90 Day Plan',           max: 15 },
  { key: 'demo_quality',      label: 'Demo & Presentation Quality', max: 10 },
]

async function getAllScores() {
  const res = await fetch(`${BASE}/scores`)
  if (!res.ok) throw new Error('Failed to fetch scores')
  return res.json()
}

async function getAllJudges() {
  const res = await fetch(`${BASE}/judges`)
  if (!res.ok) throw new Error('Failed to fetch judges')
  return res.json()
}

function StatusBadge({ status }) {
  if (status === 'submitted') return <span className="badge badge-green">Submitted</span>
  if (status === 'draft') return <span className="badge badge-amber">Draft</span>
  return <span className="badge badge-gray">Pending</span>
}

function ScoreDrawer({ team, judges, scores, round, onClose }) {
  if (!team) return null

  const teamScores = scores.filter(s => s.participant_id === team.id && (s.round || 1) === round)

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" style={{ width: 400 }}>
        <button className="drawer-close" onClick={onClose}>✕</button>
        <div className="drawer-title">{team.team_name || team.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
          Round {round} · Score breakdown by judge
        </div>

        {judges.map(judge => {
          const score = teamScores.find(s => s.judge_id === judge.id)
          return (
            <div key={judge.id} className="drawer-field" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div className="drawer-field-label">{judge.name}</div>
                <StatusBadge status={score?.status} />
              </div>
              {score ? (
                <div>
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <tbody>
                      {CRITERIA.map(c => (
                        <tr key={c.key}>
                          <td style={{ padding: '3px 0', color: 'var(--text-secondary)', border: 'none' }}>{c.label}</td>
                          <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, border: 'none' }}>
                            {score[c.key] ?? '—'} / {c.max}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ padding: '6px 0 0', fontWeight: 700, border: 'none', borderTop: '1px solid var(--border-color)' }}>Total</td>
                        <td style={{ padding: '6px 0 0', textAlign: 'right', fontWeight: 700, color: 'var(--accent)', border: 'none', borderTop: '1px solid var(--border-color)' }}>
                          {score.total ?? '—'} / 100
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {score.submitted_at && (
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                      Submitted {new Date(score.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No scores submitted yet</div>
              )}
            </div>
          )
        })}

        {teamScores.filter(s => s.status === 'submitted').length > 0 && (
          <div style={{ marginTop: 4, padding: '12px 0', borderTop: '2px solid var(--accent)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Average score (submitted judges)
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
              {Math.round(
                teamScores.filter(s => s.status === 'submitted').reduce((sum, s) => sum + (s.total || 0), 0) /
                teamScores.filter(s => s.status === 'submitted').length
              )} / 100
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function Judging() {
  const { show } = useToast()
  const [participants, setParticipants] = useState([])
  const [judges, setJudges] = useState([])
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [round, setRound] = useState(1)
  const [search, setSearch] = useState('')
  const [drawerTeam, setDrawerTeam] = useState(null)

  useEffect(() => {
    Promise.all([getParticipants(), getAllJudges(), getAllScores()])
      .then(([parts, jdgs, scrs]) => {
        setParticipants(parts)
        setJudges(jdgs)
        setScores(scrs)
      })
      .catch(() => show('Failed to load judging data', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return participants.filter(p => {
      if (!search) return true
      const name = (p.team_name || p.name || '').toLowerCase()
      return name.includes(search.toLowerCase())
    })
  }, [participants, search])

  function getTeamScores(participantId) {
    return scores.filter(s => s.participant_id === participantId && (s.round || 1) === round)
  }

  function getAvgScore(participantId) {
    const submitted = getTeamScores(participantId).filter(s => s.status === 'submitted')
    if (!submitted.length) return null
    return Math.round(submitted.reduce((sum, s) => sum + (s.total || 0), 0) / submitted.length)
  }

  function getJudgeStatus(participantId, judgeId) {
    const score = scores.find(s => s.participant_id === participantId && s.judge_id === judgeId && (s.round || 1) === round)
    if (!score) return 'pending'
    return score.status
  }

  const totalSubmitted = useMemo(() => {
    const judgeIds = judges.map(j => j.id)
    return participants.filter(p =>
      judgeIds.every(jid => getTeamScores(p.id).some(s => s.judge_id === jid && s.status === 'submitted'))
    ).length
  }, [participants, judges, scores, round])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Judging</div>
        <div className="page-subtitle">Scores submitted by judges across all teams</div>
      </div>

      {/* Stats */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-label">Total teams</div>
          <div className="stat-card-value">{participants.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Judges</div>
          <div className="stat-card-value">{judges.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Fully scored</div>
          <div className="stat-card-value">{totalSubmitted}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total scores</div>
          <div className="stat-card-value">{scores.filter(s => (s.round || 1) === round && s.status === 'submitted').length}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <input
            className="form-control"
            placeholder="Search by team name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', border: '1.5px solid var(--accent)', borderRadius: 8, overflow: 'hidden' }}>
          {[1, 2].map(r => (
            <button
              key={r}
              onClick={() => setRound(r)}
              style={{
                padding: '7px 18px',
                border: 'none',
                background: round === r ? 'var(--accent)' : 'transparent',
                color: round === r ? '#FFFFFF' : 'var(--accent)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              Round {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="section-card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Team</th>
                {judges.map(j => (
                  <th key={j.id} style={{ textAlign: 'center' }}>{j.name}</th>
                ))}
                <th style={{ textAlign: 'center' }}>Avg score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={judges.length + 3} className="no-results">No teams found</td></tr>
              )}
              {filtered.map(p => {
                const avg = getAvgScore(p.id)
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.team_name || p.name}</div>
                      {p.team_name && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.name}</div>}
                    </td>
                    {judges.map(j => {
                      const status = getJudgeStatus(p.id, j.id)
                      const score = scores.find(s => s.participant_id === p.id && s.judge_id === j.id && (s.round || 1) === round)
                      return (
                        <td key={j.id} style={{ textAlign: 'center' }}>
                          {status === 'submitted' ? (
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>{score?.total ?? '—'}</div>
                              <span className="badge badge-green" style={{ fontSize: 10 }}>Done</span>
                            </div>
                          ) : status === 'draft' ? (
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14 }}>{score?.total ?? '—'}</div>
                              <span className="badge badge-amber" style={{ fontSize: 10 }}>Draft</span>
                            </div>
                          ) : (
                            <span className="badge badge-gray" style={{ fontSize: 10 }}>Pending</span>
                          )}
                        </td>
                      )
                    })}
                    <td style={{ textAlign: 'center' }}>
                      {avg !== null ? (
                        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{avg}</span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => setDrawerTeam(p)}>
                        Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {drawerTeam && (
        <ScoreDrawer
          team={drawerTeam}
          judges={judges}
          scores={scores}
          round={round}
          onClose={() => setDrawerTeam(null)}
        />
      )}
    </div>
  )
}
