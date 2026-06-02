import { useState, useEffect, useMemo } from 'react'
import { getParticipants, getJudges, getScores, getCriteria, getConfig, putConfig } from '../../api'
import { useToast } from '../../components/Toast'

function ScoreDrawer({ team, judges, scores, criteria, round, onClose }) {
  if (!team) return null
  const teamScores = scores.filter(s => s.participant_id === team.id && (s.round || 1) === round && (s.status === 'frozen' || s.status === 'submitted'))

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" style={{ width: 420 }}>
        <button className="drawer-close" onClick={onClose}>✕</button>
        <div className="drawer-title">{team.team_name || team.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20 }}>
          Round {round} · Per-judge breakdown
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(' + criteria.length + ', 1fr) 1fr', gap: 4, marginBottom: 6, fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
          <span>Judge</span>
          {criteria.map(c => <span key={c.key} style={{ textAlign: 'center' }}>{c.label.split(' ').slice(0, 2).join(' ')}</span>)}
          <span style={{ textAlign: 'right' }}>Total</span>
        </div>
        {teamScores.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '20px 0' }}>No frozen scores yet for this round.</div>
        ) : teamScores.map(score => (
          <div key={score.id} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(' + criteria.length + ', 1fr) 1fr', gap: 4, padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{score.judge_name}</span>
            {criteria.map(c => <span key={c.key} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{score[c.key] ?? '—'}</span>)}
            <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>{score.total}</span>
          </div>
        ))}
        {teamScores.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(' + criteria.length + ', 1fr) 1fr', gap: 4, padding: '10px 0 0', fontSize: 13 }}>
            <span style={{ fontWeight: 700 }}>Average</span>
            {criteria.map(c => {
              const avg = Math.round(teamScores.reduce((s, r) => s + (r[c.key] || 0), 0) / teamScores.length)
              return <span key={c.key} style={{ textAlign: 'center', fontWeight: 600 }}>{avg}</span>
            })}
            <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>
              {Math.round(teamScores.reduce((s, r) => s + (r.total || 0), 0) / teamScores.length)}
            </span>
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

export default function Results() {
  const { show } = useToast()
  const [participants, setParticipants] = useState([])
  const [judges, setJudges] = useState([])
  const [scores, setScores] = useState([])
  const [criteria, setCriteria] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [round, setRound] = useState(1)
  const [drawerTeam, setDrawerTeam] = useState(null)
  const [pushing, setPushing] = useState(null) // participant id being toggled

  useEffect(() => {
    Promise.all([getParticipants(), getJudges(), getScores(), getCriteria(), getConfig()])
      .then(([parts, jdgs, scrs, crits, cfg]) => {
        setParticipants(parts)
        setJudges(jdgs)
        setScores(scrs)
        setCriteria(crits.filter(c => c.active !== false))
        setConfig(cfg)
      })
      .catch(() => show('Failed to load results', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const round2Teams = config?.round_2_teams || []

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
    } catch {
      show('Failed to update Round 2 teams', 'error')
    } finally {
      setPushing(null)
    }
  }

  const { leaderboard, disqualifiedList } = useMemo(() => {
    const pool = round === 2
      ? participants.filter(p => round2Teams.includes(p.id))
      : participants
    const mapped = pool.map(p => {
      const frozen = scores.filter(s => s.participant_id === p.id && (s.round || 1) === round && (s.status === 'frozen' || s.status === 'submitted'))
      const avg = frozen.length ? Math.round(frozen.reduce((s, r) => s + (r.total || 0), 0) / frozen.length) : null
      return { ...p, avg, judgeCount: frozen.length, frozen }
    })
    const sortFn = (a, b) => {
      if (a.avg === null && b.avg === null) return 0
      if (a.avg === null) return 1
      if (b.avg === null) return -1
      return b.avg - a.avg
    }
    return {
      leaderboard:      mapped.filter(p => !p.disqualified).sort(sortFn),
      disqualifiedList: mapped.filter(p =>  p.disqualified).sort(sortFn),
    }
  }, [participants, scores, round, round2Teams])

  function handleExportR1() {
    const headers = ['Rank', 'Team Name', 'Lead Name', ...judges.map(j => j.name), 'Avg Score', 'Round 2 Status']
    const rows = [headers]
    const pool = participants.map(p => {
      const frozen = scores.filter(s => s.participant_id === p.id && (s.round || 1) === 1 && (s.status === 'frozen' || s.status === 'submitted'))
      const avg = frozen.length ? Math.round(frozen.reduce((s, r) => s + (r.total || 0), 0) / frozen.length) : null
      return { ...p, avg, frozen }
    }).sort((a, b) => {
      if (a.avg === null && b.avg === null) return 0
      if (a.avg === null) return 1
      if (b.avg === null) return -1
      return b.avg - a.avg
    })
    pool.forEach((p, idx) => {
      const judgeScores = judges.map(j => {
        const s = scores.find(sc => sc.participant_id === p.id && sc.judge_id === j.id && (sc.round || 1) === 1 && (sc.status === 'frozen' || sc.status === 'submitted'))
        return s ? s.total : '—'
      })
      rows.push([
        p.avg !== null ? `#${idx + 1}` : '—',
        p.team_name || p.name,
        p.name,
        ...judgeScores,
        p.avg ?? '—',
        round2Teams.includes(p.id) ? 'Pushed to Round 2' : '—',
      ])
    })
    downloadCSV('results_round1.csv', rows)
  }

  function handleExportR2() {
    const headers = ['Rank', 'Team Name', 'Lead Name', ...judges.map(j => j.name), 'Avg Score']
    const rows = [headers]
    const pool = participants
      .filter(p => round2Teams.includes(p.id))
      .map(p => {
        const frozen = scores.filter(s => s.participant_id === p.id && (s.round || 1) === 2 && (s.status === 'frozen' || s.status === 'submitted'))
        const avg = frozen.length ? Math.round(frozen.reduce((s, r) => s + (r.total || 0), 0) / frozen.length) : null
        return { ...p, avg, frozen }
      }).sort((a, b) => {
        if (a.avg === null && b.avg === null) return 0
        if (a.avg === null) return 1
        if (b.avg === null) return -1
        return b.avg - a.avg
      })
    pool.forEach((p, idx) => {
      const judgeScores = judges.map(j => {
        const s = scores.find(sc => sc.participant_id === p.id && sc.judge_id === j.id && (sc.round || 1) === 2 && (sc.status === 'frozen' || sc.status === 'submitted'))
        return s ? s.total : '—'
      })
      rows.push([
        p.avg !== null ? `#${idx + 1}` : '—',
        p.team_name || p.name,
        p.name,
        ...judgeScores,
        p.avg ?? '—',
      ])
    })
    downloadCSV('results_round2.csv', rows)
  }

  const scored = leaderboard.filter(p => p.avg !== null).length
  const allRows = [...leaderboard, ...disqualifiedList]

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Results</div>
          <div className="page-subtitle">Leaderboard based on frozen judge scores</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-ghost" onClick={handleExportR1}>↓ Export R1 CSV</button>
          <button className="btn btn-sm btn-ghost" onClick={handleExportR2}>↓ Export R2 CSV</button>
          <div style={{ display: 'flex', border: '1.5px solid var(--accent)', borderRadius: 8, overflow: 'hidden' }}>
            {[1, 2].map(r => (
              <button key={r} onClick={() => setRound(r)} style={{
                padding: '7px 18px', border: 'none',
                background: round === r ? 'var(--accent)' : 'transparent',
                color: round === r ? '#FFFFFF' : 'var(--accent)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>Round {r}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-cards-3">
        <div className="stat-card">
          <div className="stat-card-label">Teams ranked</div>
          <div className="stat-card-value">{scored}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">{round === 1 ? 'Total teams' : 'In Round 2'}</div>
          <div className="stat-card-value">{round === 1 ? participants.length : round2Teams.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Judges scoring</div>
          <div className="stat-card-value">{judges.length}</div>
        </div>
      </div>

      {round === 2 && round2Teams.length === 0 && (
        <div style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid #F0C97A', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
          No teams have been pushed to Round 2 yet. Switch to Round 1 and use the "Push to R2" button.
        </div>
      )}

      <div className="section-card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 48, textAlign: 'center' }}>Rank</th>
                <th>Team</th>
                {judges.map(j => <th key={j.id} style={{ textAlign: 'center' }}>{j.name}</th>)}
                <th style={{ textAlign: 'center' }}>Avg score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allRows.length === 0 && (
                <tr><td colSpan={judges.length + 4} className="no-results">No teams to display</td></tr>
              )}
              {/* ── Eligible leaderboard ── */}
              {leaderboard.map((p, idx) => {
                const inR2 = round2Teams.includes(p.id)
                return (
                  <tr key={p.id}>
                    <td style={{ textAlign: 'center' }}>
                      {p.avg !== null ? (
                        <span style={{ fontWeight: 700, fontSize: 14, color: idx === 0 ? '#B8860B' : idx === 1 ? '#888888' : idx === 2 ? '#CD7F32' : 'var(--text-primary)' }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>
                      ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.team_name || p.name}</div>
                      {p.team_name && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.name}</div>}
                    </td>
                    {judges.map(j => {
                      const score = scores.find(s => s.participant_id === p.id && s.judge_id === j.id && (s.round || 1) === round && (s.status === 'frozen' || s.status === 'submitted'))
                      return (
                        <td key={j.id} style={{ textAlign: 'center', fontSize: 14, fontWeight: score ? 600 : 400, color: score ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                          {score ? score.total : '—'}
                        </td>
                      )
                    })}
                    <td style={{ textAlign: 'center' }}>
                      {p.avg !== null
                        ? <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>{p.avg}</span>
                        : <span className="badge badge-gray" style={{ fontSize: 10 }}>No scores</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setDrawerTeam(p)}>Breakdown</button>
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
              {/* ── Disqualified section ── */}
              {disqualifiedList.length > 0 && (
                <tr>
                  <td colSpan={judges.length + 4} style={{ background: '#FFF5F5', padding: '6px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--error-text)', borderTop: '2px solid #F5C6CB' }}>
                    ⚑ Disqualified teams — not included in rankings
                  </td>
                </tr>
              )}
              {disqualifiedList.map(p => (
                <tr key={p.id} style={{ opacity: 0.6, background: '#FFF5F5' }}>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-red" style={{ fontSize: 9 }}>DQ</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>{p.team_name || p.name}</div>
                    {p.team_name && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.name}</div>}
                  </td>
                  {judges.map(j => {
                    const score = scores.find(s => s.participant_id === p.id && s.judge_id === j.id && (s.round || 1) === round && (s.status === 'frozen' || s.status === 'submitted'))
                    return (
                      <td key={j.id} style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-tertiary)' }}>
                        {score ? score.total : '—'}
                      </td>
                    )
                  })}
                  <td style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    {p.avg !== null ? p.avg : '—'}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => setDrawerTeam(p)}>Breakdown</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerTeam && (
        <ScoreDrawer
          team={drawerTeam}
          judges={judges}
          scores={scores}
          criteria={criteria}
          round={round}
          onClose={() => setDrawerTeam(null)}
        />
      )}
    </div>
  )
}
