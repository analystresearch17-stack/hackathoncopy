import { useState, useEffect, useMemo } from 'react'
import { getParticipants, getJudges, getScores, putScore, getCriteria, getConfig, putConfig } from '../../api'
import { useToast } from '../../components/Toast'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }) {
  if (status === 'frozen')    return <span className="badge badge-green">Frozen</span>
  if (status === 'submitted') return <span className="badge badge-green">Frozen</span>
  if (status === 'draft')     return <span className="badge badge-amber">Draft</span>
  return <span className="badge badge-gray">Pending</span>
}

function ScoreDrawer({ team, judges, scores, criteria, round, onClose, onUnfreeze }) {
  if (!team) return null
  const teamScores = scores.filter(s => s.participant_id === team.id && (s.round || 1) === round)
  const maxTotal   = criteria.reduce((sum, c) => sum + (c.max || 0), 0)
  const frozenScores = teamScores.filter(s => s.status === 'frozen' || s.status === 'submitted')
  const avgTotal = frozenScores.length
    ? Math.round(frozenScores.reduce((s, r) => s + (r.total || 0), 0) / frozenScores.length)
    : null

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" style={{ width: 480 }}>
        <button className="drawer-close" onClick={onClose}>✕</button>
        <div className="drawer-title">{team.team_name || team.name}</div>
        {team.team_name && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: -4, marginBottom: 4 }}>
            Lead: {team.name}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20 }}>
          Round {round} · Score breakdown by judge
        </div>

        {judges.map(judge => {
          const score    = teamScores.find(s => s.judge_id === judge.id)
          const isFrozen = score?.status === 'frozen' || score?.status === 'submitted'

          return (
            <div key={judge.id} style={{
              marginBottom: 16,
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#F5F5F5',
                borderBottom: score ? '1px solid var(--border-color)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{judge.name}</span>
                  <StatusBadge status={score?.status} />
                </div>
                {isFrozen && (
                  <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={() => onUnfreeze(score)}>
                    Unfreeze
                  </button>
                )}
              </div>

              {score ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 14px', background: '#1A1A1A', color: '#FFFFFF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Criteria</th>
                      <th style={{ padding: '8px 14px', background: '#1A1A1A', color: '#FFFFFF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: 72 }}>Score</th>
                      <th style={{ padding: '8px 14px', background: '#1A1A1A', color: '#FFFFFF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', width: 60 }}>Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((c, idx) => {
                      const criteriaComment = score.comments?.[c.key]
                      return (
                        <tr key={c.key} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                          <td style={{ padding: '9px 14px', fontSize: 13, borderBottom: '1px solid var(--border-color)' }}>
                            <div>{c.label}</div>
                            {criteriaComment && (
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 2 }}>
                                💬 {criteriaComment}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 700, textAlign: 'center', color: 'var(--accent)', borderBottom: '1px solid var(--border-color)' }}>
                            {score[c.key] ?? '—'}
                          </td>
                          <td style={{ padding: '9px 14px', fontSize: 12, textAlign: 'center', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                            {c.max}
                          </td>
                        </tr>
                      )
                    })}
                    <tr style={{ background: '#F0EBFF' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, border: 'none' }}>Total</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 15, textAlign: 'center', color: 'var(--accent)', border: 'none' }}>{score.total ?? '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'center', color: 'var(--text-tertiary)', border: 'none' }}>{maxTotal || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '14px', fontSize: 13, color: 'var(--text-tertiary)' }}>No scores submitted yet</div>
              )}
              {score?.comments?.overall && (
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-color)', background: '#FAFAFA' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>Overall comment</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>💬 {score.comments.overall}</div>
                </div>
              )}
            </div>
          )
        })}

        {avgTotal !== null ? (
          <div style={{
            marginTop: 8, padding: '16px',
            background: 'var(--accent-light)',
            border: '1px solid var(--accent-mid)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Average · frozen judges ({frozenScores.length} / {judges.length})
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Based on frozen scores only</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
              {avgTotal}{maxTotal > 0 ? <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-tertiary)' }}> / {maxTotal}</span> : ''}
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            No frozen scores yet — average will appear once a judge freezes their scores.
          </div>
        )}
      </div>
    </>
  )
}

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  window.URL.revokeObjectURL(url)
}

export default function JudgeDashboard() {
  const { show } = useToast()
  const [participants, setParticipants] = useState([])
  const [judges, setJudges]             = useState([])
  const [scores, setScores]             = useState([])
  const [criteria, setCriteria]         = useState([])
  const [config, setConfig]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [round, setRound]               = useState(1)
  const [search, setSearch]             = useState('')
  const [drawerTeam, setDrawerTeam]     = useState(null)
  const [pushing, setPushing]           = useState(null)

  const load = () => {
    Promise.all([getParticipants(), getJudges(), getScores(), getCriteria(), getConfig()])
      .then(([parts, jdgs, scrs, crits, cfg]) => {
        setParticipants(parts)
        setJudges(jdgs)
        setScores(scrs)
        setCriteria(crits.filter(c => c.active !== false))
        setConfig(cfg)
      })
      .catch(() => show('Failed to load data', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const round2Teams = config?.round_2_teams || []

  async function handleUnfreeze(score) {
    try {
      const updated = await putScore(score.id, { ...score, status: 'draft', frozen_at: null })
      setScores(prev => prev.map(s => s.id === updated.id ? updated : s))
      show('Score unfrozen — judge can now edit', 'success')
    } catch {
      show('Failed to unfreeze', 'error')
    }
  }

  async function toggleRound2(participantId) {
    if (!config) return
    setPushing(participantId)
    try {
      const current = config.round_2_teams || []
      const updated = current.includes(participantId)
        ? current.filter(id => id !== participantId)
        : [...current, participantId]
      const newCfg = await putConfig({ ...config, round_2_teams: updated })
      setConfig(newCfg)
      show(updated.includes(participantId) ? 'Team pushed to Round 2' : 'Team removed from Round 2', 'success')
    } catch {
      show('Failed to update Round 2 teams', 'error')
    } finally {
      setPushing(null)
    }
  }

  // Ranked + filtered list — sorted descending by avg frozen score
  const rankedFiltered = useMemo(() => {
    const pool = round === 2
      ? participants.filter(p => round2Teams.includes(p.id))
      : participants

    return pool
      .filter(p => {
        if (!search) return true
        return (p.team_name || p.name || '').toLowerCase().includes(search.toLowerCase())
      })
      .map(p => {
        const frozen = scores.filter(s =>
          s.participant_id === p.id && (s.round || 1) === round &&
          (s.status === 'frozen' || s.status === 'submitted')
        )
        const avg = frozen.length
          ? Math.round(frozen.reduce((s, r) => s + (r.total || 0), 0) / frozen.length)
          : null
        return { ...p, avg }
      })
      .sort((a, b) => {
        if (a.avg === null && b.avg === null) return 0
        if (a.avg === null) return 1
        if (b.avg === null) return -1
        return b.avg - a.avg
      })
  }, [participants, scores, round, round2Teams, search])

  function getScoreForJudge(participantId, judgeId) {
    return scores.find(s =>
      s.participant_id === participantId && s.judge_id === judgeId && (s.round || 1) === round
    )
  }

  // Stat card counts
  const pool = round === 2
    ? participants.filter(p => round2Teams.includes(p.id))
    : participants
  const roundScores  = scores.filter(s => (s.round || 1) === round)
  const frozenCount  = roundScores.filter(s => s.status === 'frozen' || s.status === 'submitted').length
  const draftCount   = roundScores.filter(s => s.status === 'draft').length
  const pendingTeams = pool.filter(p =>
    judges.every(j => !scores.find(s =>
      s.participant_id === p.id && s.judge_id === j.id && (s.round || 1) === round
    ))
  ).length

  function handleExportCSV() {
    const sortedPool = (round === 2
      ? participants.filter(p => round2Teams.includes(p.id))
      : participants
    ).map(p => {
      const frozen = scores.filter(s =>
        s.participant_id === p.id && (s.round || 1) === round &&
        (s.status === 'frozen' || s.status === 'submitted')
      )
      const avg = frozen.length
        ? Math.round(frozen.reduce((s, r) => s + (r.total || 0), 0) / frozen.length)
        : null
      return { ...p, avg }
    }).sort((a, b) => {
      if (a.avg === null && b.avg === null) return 0
      if (a.avg === null) return 1
      if (b.avg === null) return -1
      return b.avg - a.avg
    })

    const headers = ['Rank', 'Team Name', 'Lead', ...judges.map(j => j.name), 'Avg Score']
    if (round === 1) headers.push('Round 2 Status')
    const rows = [headers]

    sortedPool.forEach((p, idx) => {
      const judgeScores = judges.map(j => {
        const s = scores.find(sc =>
          sc.participant_id === p.id && sc.judge_id === j.id &&
          (sc.round || 1) === round && (sc.status === 'frozen' || sc.status === 'submitted')
        )
        return s ? s.total : '—'
      })
      const row = [
        p.avg !== null ? `#${idx + 1}` : '—',
        p.team_name || p.name,
        p.name,
        ...judgeScores,
        p.avg ?? '—',
      ]
      if (round === 1) row.push(round2Teams.includes(p.id) ? 'Pushed to Round 2' : '—')
      rows.push(row)
    })

    downloadCSV(`judge_dashboard_round${round}.csv`, rows)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Judge Dashboard</div>
          <div className="page-subtitle">Live overview of all judging scores</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-ghost" onClick={handleExportCSV}>
            ↓ Export CSV
          </button>
          <div style={{ display: 'flex', border: '1.5px solid var(--accent)', borderRadius: 8, overflow: 'hidden' }}>
            {[1, 2].map(r => (
              <button key={r} onClick={() => setRound(r)} style={{
                padding: '7px 18px', border: 'none',
                background: round === r ? 'var(--accent)' : 'transparent',
                color: round === r ? '#FFFFFF' : 'var(--accent)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em',
                transition: 'background 0.15s, color 0.15s',
              }}>Round {r}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-label">{round === 2 ? 'In Round 2' : 'Teams'}</div>
          <div className="stat-card-value">{pool.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Judges</div>
          <div className="stat-card-value">{judges.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Frozen scores</div>
          <div className="stat-card-value">{frozenCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Not yet scored</div>
          <div className="stat-card-value">{pendingTeams}</div>
        </div>
      </div>

      {/* R2 empty state warning */}
      {round === 2 && round2Teams.length === 0 && (
        <div style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid #F0C97A', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
          No teams have been pushed to Round 2 yet. Switch to Round 1 and use the "Push to R2" button on each team row.
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <input
            className="form-control"
            placeholder="Search team…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {round === 1 && round2Teams.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
            {round2Teams.length} team{round2Teams.length !== 1 ? 's' : ''} pushed to Round 2
          </span>
        )}
      </div>

      {/* Main table */}
      <div className="section-card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 48, textAlign: 'center' }}>Rank</th>
                <th>Team</th>
                {judges.map(j => <th key={j.id} style={{ textAlign: 'center' }}>{j.name}</th>)}
                <th style={{ textAlign: 'center' }}>Avg</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rankedFiltered.length === 0 && (
                <tr><td colSpan={judges.length + 4} className="no-results">No teams found</td></tr>
              )}
              {rankedFiltered.map((p, idx) => {
                const inR2 = round2Teams.includes(p.id)
                return (
                  <tr key={p.id}>
                    {/* Rank */}
                    <td style={{ textAlign: 'center' }}>
                      {p.avg !== null ? (
                        <span style={{
                          fontWeight: 700, fontSize: 14,
                          color: idx === 0 ? '#B8860B' : idx === 1 ? '#888888' : idx === 2 ? '#CD7F32' : 'var(--text-primary)',
                        }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>

                    {/* Team */}
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.team_name || p.name}</div>
                      {p.team_name && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.name}</div>}
                    </td>

                    {/* Per-judge scores */}
                    {judges.map(j => {
                      const score  = getScoreForJudge(p.id, j.id)
                      const frozen = score?.status === 'frozen' || score?.status === 'submitted'
                      return (
                        <td key={j.id} style={{ textAlign: 'center' }}>
                          {!score ? (
                            <span className="badge badge-gray" style={{ fontSize: 10 }}>Pending</span>
                          ) : frozen ? (
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>{score.total}</div>
                              <span className="badge badge-green" style={{ fontSize: 10 }}>Frozen</span>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14 }}>{score.total}</div>
                              <span className="badge badge-amber" style={{ fontSize: 10 }}>Draft</span>
                            </div>
                          )}
                        </td>
                      )
                    })}

                    {/* Avg */}
                    <td style={{ textAlign: 'center' }}>
                      {p.avg !== null
                        ? <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{p.avg}</span>
                        : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                      }
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setDrawerTeam(p)}>
                          Details
                        </button>
                        {round === 1 && (
                          inR2 ? (
                            <button
                              className="btn btn-sm btn-ghost"
                              style={{ color: 'var(--success-text)', borderColor: '#A8D5B5', background: 'var(--success-bg)', fontSize: 11 }}
                              disabled={pushing === p.id}
                              onClick={() => toggleRound2(p.id)}
                              title="Click to remove from Round 2"
                            >
                              ✓ In R2
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: 11 }}
                              disabled={pushing === p.id}
                              onClick={() => toggleRound2(p.id)}
                            >
                              {pushing === p.id ? '…' : 'Push to R2'}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score drawer */}
      {drawerTeam && (
        <ScoreDrawer
          team={drawerTeam}
          judges={judges}
          scores={scores}
          criteria={criteria}
          round={round}
          onClose={() => setDrawerTeam(null)}
          onUnfreeze={handleUnfreeze}
        />
      )}
    </div>
  )
}
