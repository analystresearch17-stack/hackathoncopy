import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getParticipants, getCriteria, getConfig, getScoresByJudge, postScore, putScore } from '../api'
import { useToast } from '../components/Toast'

// ── Leaderboard panel (right column) ──────────────────────
function Leaderboard({ participants, allScores, criteria, round, selectedId }) {
  const [view, setView] = useState('summary') // 'summary' | 'breakdown'
  const maxTotal = criteria.reduce((s, c) => s + (c.max || 0), 0)

  const rows = participants.map(p => {
    const score = allScores.find(s => s.participant_id === p.id)
    return { p, score, total: score?.total ?? null, status: score?.status ?? 'none' }
  }).sort((a, b) => {
    if (a.total === null && b.total === null) return 0
    if (a.total === null) return 1
    if (b.total === null) return -1
    return b.total - a.total
  })

  const frozenCount = allScores.filter(s => s.status === 'frozen' || s.status === 'submitted').length
  const draftCount  = allScores.filter(s => s.status === 'draft').length

  return (
    <div className="lb-card">
      <div className="lb-header">
        <div className="lb-title">My scores · Round {round}</div>
        <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
          <button
            onClick={() => setView('summary')}
            style={{
              padding: '3px 10px', fontSize: 10, border: 'none', cursor: 'pointer', fontWeight: 700,
              background: view === 'summary' ? 'var(--accent)' : 'transparent',
              color: view === 'summary' ? '#FFF' : 'var(--text-tertiary)',
            }}
          >Summary</button>
          <button
            onClick={() => setView('breakdown')}
            style={{
              padding: '3px 10px', fontSize: 10, border: 'none', cursor: 'pointer', fontWeight: 700,
              background: view === 'breakdown' ? 'var(--accent)' : 'transparent',
              color: view === 'breakdown' ? '#FFF' : 'var(--text-tertiary)',
            }}
          >Breakdown</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: '6px 16px', display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
        <span><strong style={{ color: 'var(--success-text)' }}>{frozenCount}</strong> frozen</span>
        <span><strong style={{ color: 'var(--warning-text)' }}>{draftCount}</strong> draft</span>
        <span><strong style={{ color: 'var(--text-primary)' }}>{participants.length - frozenCount - draftCount}</strong> pending</span>
      </div>

      {/* Summary view */}
      {view === 'summary' && (
        rows.length === 0 ? (
          <div style={{ padding: '24px 16px', fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>No teams yet</div>
        ) : rows.map((row, idx) => {
          const isFrozen = row.status === 'frozen' || row.status === 'submitted'
          const isDraft  = row.status === 'draft'
          const isActive = row.p.id === parseInt(selectedId, 10)
          return (
            <div key={row.p.id} className={`lb-row${isActive ? ' lb-active' : ''}`}>
              <div className="lb-rank">{row.total !== null ? `#${idx + 1}` : '—'}</div>
              <div className="lb-team">
                <div className="lb-team-name">{row.p.team_name || row.p.name}</div>
                {row.p.team_name && <div className="lb-team-sub">{row.p.name}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {isFrozen ? (
                  <><span className="badge badge-green" style={{ fontSize: 9 }}>Frozen</span><span className="lb-score">{row.total}</span></>
                ) : isDraft ? (
                  <><span className="badge badge-amber" style={{ fontSize: 9 }}>Draft</span><span className="lb-score" style={{ color: 'var(--text-secondary)' }}>{row.total}</span></>
                ) : (
                  <span className="lb-score-empty">Not scored</span>
                )}
              </div>
            </div>
          )
        })
      )}

      {/* Breakdown (comparative) view */}
      {view === 'breakdown' && (
        <div style={{ overflowX: 'auto' }}>
          {rows.filter(r => r.score).length === 0 ? (
            <div style={{ padding: '24px 16px', fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>No scores yet — score some teams to see breakdown.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ padding: '7px 10px', background: '#1A1A1A', color: '#FFF', textAlign: 'left', whiteSpace: 'nowrap' }}>Team</th>
                  {criteria.map(c => (
                    <th key={c.key} style={{ padding: '7px 8px', background: '#1A1A1A', color: '#FFF', textAlign: 'center', whiteSpace: 'nowrap', fontSize: 10 }}>
                      {c.label.split(' ').slice(0, 2).join(' ')}
                      <div style={{ fontWeight: 400, color: '#AAA', fontSize: 9 }}>/{c.max}</div>
                    </th>
                  ))}
                  <th style={{ padding: '7px 8px', background: '#1A1A1A', color: '#FFF', textAlign: 'center' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter(r => r.score).map((row, idx) => (
                  <tr key={row.p.id} style={{ background: idx % 2 === 0 ? '#FFF' : '#FAFAFA', outline: row.p.id === parseInt(selectedId, 10) ? '2px solid var(--accent)' : 'none' }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-color)' }}>
                      {row.p.team_name || row.p.name}
                    </td>
                    {criteria.map(c => (
                      <td key={c.key} style={{ padding: '7px 8px', textAlign: 'center', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        {row.score[c.key] ?? '—'}
                      </td>
                    ))}
                    <td style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--accent)', borderBottom: '1px solid var(--border-color)' }}>
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {maxTotal > 0 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-color)', fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>
          Max possible: {maxTotal} pts
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────
export default function JudgeHome() {
  const navigate = useNavigate()
  const { show } = useToast()

  const judge = (() => {
    try { return JSON.parse(localStorage.getItem('ha_judge_auth')) } catch { return null }
  })()

  const assignment   = judge?.round_assignment || 'both'
  const canRound1    = assignment === 'both' || assignment === 'round_1'
  const canRound2    = assignment === 'both' || assignment === 'round_2'
  const defaultRound = canRound1 ? 1 : 2

  const [round, setRound]               = useState(defaultRound)
  const [participants, setParticipants] = useState([])
  const [criteria, setCriteria]         = useState([])
  const [config, setConfig]             = useState(null)
  const [loading, setLoading]           = useState(true)

  // All scores this judge has given in the current round → powers the leaderboard
  const [allScores, setAllScores]       = useState([])

  // Selected team scoring state
  const [selectedId, setSelectedId]     = useState('')
  const [values, setValues]             = useState({})
  const [comments, setComments]         = useState({}) // { [criteriaKey]: '…', overall: '…' }
  const [scoreId, setScoreId]           = useState(null)
  const [scoreStatus, setScoreStatus]   = useState('idle')
  const [saving, setSaving]             = useState(false)
  const [freezing, setFreezing]         = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('ha_judge_auth')
    navigate('/judge/login')
  }

  // Load participants, criteria, and config once
  useEffect(() => {
    if (!judge) return
    Promise.all([getParticipants(), getCriteria(), getConfig()])
      .then(([parts, crits, cfg]) => {
        setParticipants(parts)
        setCriteria(crits.filter(c => c.active !== false))
        setConfig(cfg)
      })
      .catch(() => show('Failed to load data', 'error'))
      .finally(() => setLoading(false))
  }, [])

  // Reload all scores whenever round changes
  const reloadAllScores = useCallback(async () => {
    if (!judge) return
    try {
      const scores = await getScoresByJudge(judge.id, round)
      setAllScores(scores)
    } catch { /* silent */ }
  }, [judge?.id, round])

  useEffect(() => { reloadAllScores() }, [reloadAllScores])

  // When selected team or round changes, load that team's existing score
  const loadSelectedScore = useCallback(async () => {
    if (!selectedId || !criteria.length || !judge) return
    const pid = parseInt(selectedId, 10)
    try {
      const scores = await getScoresByJudge(judge.id, round)
      setAllScores(scores) // keep leaderboard in sync
      const existing = scores.find(s => s.participant_id === pid)
      if (existing) {
        const vals = {}
        criteria.forEach(c => { vals[c.key] = existing[c.key] !== undefined ? String(existing[c.key]) : '' })
        setValues(vals)
        // Load saved comments (per-criteria + overall)
        const savedComments = existing.comments || {}
        setComments(savedComments)
        setScoreId(existing.id)
        const frozen = existing.status === 'frozen' || existing.status === 'submitted'
        setScoreStatus(frozen ? 'frozen' : 'saved')
      } else {
        const empty = {}
        criteria.forEach(c => { empty[c.key] = '' })
        setValues(empty)
        setComments({})
        setScoreId(null)
        setScoreStatus('idle')
      }
    } catch {
      show('Failed to load score', 'error')
    }
  }, [selectedId, round, criteria, judge?.id])

  useEffect(() => { if (criteria.length > 0) loadSelectedScore() }, [loadSelectedScore])

  function handleSelectTeam(id) {
    setSelectedId(id)
    setScoreStatus('idle')
    setValues({})
    setComments({})
    setScoreId(null)
  }

  function handleRoundChange(r) {
    setRound(r)
    setSelectedId('')
    setValues({})
    setComments({})
    setScoreId(null)
    setScoreStatus('idle')
    // Refresh config so round_2_teams is always up-to-date
    getConfig().then(cfg => setConfig(cfg)).catch(() => {})
  }

  function setValue(key, raw) {
    const crit = criteria.find(c => c.key === key)
    const max  = crit?.max ?? 999
    const num  = parseInt(raw, 10)
    const val  = raw === '' ? '' : String(Math.min(max, Math.max(0, isNaN(num) ? 0 : num)))
    setValues(prev => ({ ...prev, [key]: val }))
    if (scoreStatus !== 'idle') setScoreStatus('editing')
  }

  function calcTotal() {
    return criteria.reduce((sum, c) => sum + (parseInt(values[c.key], 10) || 0), 0)
  }

  const selectedParticipant = participants.find(p => p.id === parseInt(selectedId, 10))

  function buildPayload(status) {
    const pid = parseInt(selectedId, 10)
    const payload = {
      judge_id:       judge.id,
      judge_name:     judge.name,
      participant_id: pid,
      team_name:      selectedParticipant?.team_name || selectedParticipant?.name || '',
      round,
      total:    calcTotal(),
      status,
      comments, // per-criteria comments + overall
    }
    criteria.forEach(c => { payload[c.key] = parseInt(values[c.key], 10) || 0 })
    return payload
  }

  // Patch a single entry in the leaderboard without a full re-fetch
  function patchLeaderboard(result) {
    setAllScores(prev => {
      const exists = prev.find(s => s.participant_id === result.participant_id)
      return exists
        ? prev.map(s => s.participant_id === result.participant_id ? result : s)
        : [...prev, result]
    })
  }

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)
    try {
      const payload = buildPayload('draft')
      let result
      if (scoreId) {
        result = await putScore(scoreId, payload)
      } else {
        result = await postScore(payload)
        setScoreId(result.id)
      }
      setScoreStatus('saved')
      patchLeaderboard(result)
      show(`Scores saved for ${selectedParticipant?.team_name || selectedParticipant?.name}`, 'success')
    } catch {
      show('Failed to save scores', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleFreeze() {
    if (!selectedId) return
    if (scoreStatus === 'idle' || scoreStatus === 'editing') {
      show('Save scores first before freezing', 'error')
      return
    }
    // Freeze protection: warn if any criteria left blank
    const emptyCriteria = criteria.filter(c => values[c.key] === '' || values[c.key] === undefined)
    if (emptyCriteria.length > 0) {
      const names = emptyCriteria.map(c => c.label).join(', ')
      const proceed = window.confirm(
        `⚠️ The following criteria have no score:\n\n${names}\n\nDo you still want to freeze? (They will be counted as 0)`
      )
      if (!proceed) return
    } else if (!window.confirm(`Freeze your Round ${round} score for this team? The admin can unfreeze if needed.`)) return
    setFreezing(true)
    try {
      const payload = { ...buildPayload('frozen'), frozen_at: new Date().toISOString() }
      let result
      if (scoreId) {
        result = await putScore(scoreId, payload)
      } else {
        result = await postScore(payload)
        setScoreId(result.id)
      }
      setScoreStatus('frozen')
      patchLeaderboard(result)
      show(`Round ${round} score frozen for ${selectedParticipant?.team_name || selectedParticipant?.name}`, 'success')
    } catch {
      show('Failed to freeze score', 'error')
    } finally {
      setFreezing(false)
    }
  }

  async function handleFreezeAll() {
    if (!window.confirm(`Freeze ALL your saved Round ${round} scores? The admin can unfreeze if needed.`)) return
    setFreezing(true)
    try {
      const toFreeze = allScores.filter(s => s.status === 'draft')
      const updated  = await Promise.all(
        toFreeze.map(s => putScore(s.id, { ...s, status: 'frozen', frozen_at: new Date().toISOString() }))
      )
      setAllScores(prev => prev.map(s => {
        const u = updated.find(r => r.id === s.id)
        return u || s
      }))
      // Reflect on selected team if it was in the batch
      if (selectedId) {
        const pid = parseInt(selectedId, 10)
        if (toFreeze.find(s => s.participant_id === pid)) setScoreStatus('frozen')
      }
      show(`All Round ${round} scores frozen`, 'success')
    } catch {
      show('Failed to freeze all scores', 'error')
    } finally {
      setFreezing(false)
    }
  }

  const total    = calcTotal()
  const maxTotal = criteria.reduce((s, c) => s + (c.max || 0), 0)
  const isFrozen = scoreStatus === 'frozen'

  // For Round 2, only show teams pushed by admin
  const round2Teams = config?.round_2_teams || []
  const visibleParticipants = round === 2
    ? participants.filter(p => round2Teams.includes(p.id))
    : participants

  if (!judge) { navigate('/judge/login'); return null }

  return (
    <div className="judge-layout">
      {/* Header */}
      <header className="judge-header">
        <div className="judge-header-brand">HackerArena</div>
        <div className="judge-header-center">Judging Portal</div>
        <div className="judge-header-right">
          <span className="judge-name-badge">{judge.name}</span>
          <button className="btn btn-sm btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="judge-main">
        {/* Title + round toggle */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="page-title">Score a Team</div>
            <div className="page-subtitle">Select a team, enter scores, save, then freeze when ready.</div>
          </div>
          <div className="round-toggle">
            {[1, 2].map(r => {
              const canDo = r === 1 ? canRound1 : canRound2
              return (
                <button
                  key={r}
                  className={`round-toggle-btn${round === r ? ' active' : ''}`}
                  disabled={!canDo}
                  title={!canDo ? `You are not assigned to Round ${r}` : `Switch to Round ${r}`}
                  onClick={() => canDo && handleRoundChange(r)}
                >
                  Round {r}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
        ) : round === 2 && visibleParticipants.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            background: 'var(--tile-bg)', border: '1px solid var(--accent-mid)',
            borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No teams in Round 2 yet</div>
            <div style={{ fontSize: 13 }}>The admin hasn't pushed any teams to Round 2. Check back later.</div>
          </div>
        ) : (
          <div className="judge-columns">

            {/* ── LEFT: Scoring form ──────────────────────── */}
            <div className="judge-col-left">

              {/* Progress tracker */}
              {(() => {
                const scoredCount  = visibleParticipants.filter(p => allScores.some(s => s.participant_id === p.id)).length
                const frozenCount  = allScores.filter(s => s.status === 'frozen' || s.status === 'submitted').length
                const draftCount   = allScores.filter(s => s.status === 'draft').length
                const total        = visibleParticipants.length
                const allDone      = total > 0 && scoredCount === total
                return (
                  <div style={{
                    marginBottom: 16, padding: '12px 16px',
                    background: allDone ? 'var(--success-bg)' : 'var(--bg-secondary)',
                    border: `1px solid ${allDone ? '#A8D5B5' : 'var(--border-color)'}`,
                    borderRadius: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: allDone ? 'var(--success-text)' : 'var(--text-secondary)' }}>
                        Scoring progress
                      </div>
                      {allDone && <span className="badge badge-green" style={{ fontSize: 9 }}>✓ All teams scored!</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${total > 0 ? (scoredCount / total) * 100 : 0}%`, background: allDone ? 'var(--success-text)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: allDone ? 'var(--success-text)' : 'var(--text-primary)', minWidth: 48, textAlign: 'right' }}>
                        {scoredCount} / {total}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-tertiary)' }}>
                      <span><strong style={{ color: 'var(--success-text)' }}>{frozenCount}</strong> frozen</span>
                      <span><strong style={{ color: 'var(--warning-text)' }}>{draftCount}</strong> draft</span>
                      <span><strong>{total - scoredCount}</strong> not started</span>
                    </div>
                  </div>
                )
              })()}

              {/* Team dropdown */}
              <div className="section-card" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                    Select team to score
                  </label>
                  <select
                    className="form-control"
                    style={{ fontSize: 14 }}
                    value={selectedId}
                    onChange={e => handleSelectTeam(e.target.value)}
                  >
                    <option value="">— Choose a team —</option>
                    {visibleParticipants.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.team_name ? `${p.team_name} (${p.name})` : p.name}
                        {p.team_id ? ` · T-${String(p.team_id).padStart(3, '0')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedId ? (
                <>
                  <div className="section-card">
                    {/* Team header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                          {selectedParticipant?.team_name || selectedParticipant?.name}
                        </div>
                        {selectedParticipant?.team_name && (
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            Lead: {selectedParticipant.name}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isFrozen
                          ? <span className="badge badge-green">🔒 Frozen</span>
                          : scoreStatus === 'saved'
                            ? <span className="badge badge-amber">Draft</span>
                            : scoreStatus === 'editing'
                              ? <span className="badge badge-gray">Editing</span>
                              : null
                        }
                        <span style={{ fontWeight: 700, fontSize: 20, color: total > 0 ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                          {total}{maxTotal > 0 ? ` / ${maxTotal}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Criteria rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {criteria.map(c => (
                        <div
                          key={c.key}
                          style={{
                            padding: '11px 14px', background: 'var(--bg-secondary)',
                            borderRadius: 8, border: '1px solid var(--border-color)',
                          }}
                        >
                          {/* Score row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {c.label}
                                {c.tooltip && (
                                  <span className="info-icon" data-tooltip={c.tooltip} style={{ marginLeft: 6 }}>ⓘ</span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                                Max {c.max} pts
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {isFrozen ? (
                                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', minWidth: 40, textAlign: 'center' }}>
                                  {values[c.key] !== '' && values[c.key] !== undefined ? values[c.key] : '—'}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  className="score-input"
                                  style={{ width: 68, fontSize: 15, textAlign: 'center' }}
                                  min={0}
                                  max={c.max}
                                  value={values[c.key] ?? ''}
                                  onChange={e => setValue(c.key, e.target.value)}
                                  placeholder="0"
                                />
                              )}
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', minWidth: 36 }}>/ {c.max}</span>
                            </div>
                          </div>
                          {/* Per-criteria comment */}
                          {isFrozen ? (
                            comments[c.key] ? (
                              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: 2 }}>
                                💬 {comments[c.key]}
                              </div>
                            ) : null
                          ) : (
                            <input
                              type="text"
                              style={{
                                marginTop: 8, width: '100%',
                                padding: '5px 10px', fontSize: 12,
                                border: '1px solid var(--border-color)',
                                borderRadius: 6, background: '#FFFFFF',
                                color: 'var(--text-secondary)',
                                fontFamily: 'inherit', outline: 'none',
                              }}
                              value={comments[c.key] || ''}
                              onChange={e => setComments(prev => ({ ...prev, [c.key]: e.target.value }))}
                              placeholder={`Comment on ${c.label}…`}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Overall comment */}
                    <div style={{ marginTop: 10 }}>
                      {isFrozen ? (
                        comments.overall ? (
                          <div style={{
                            padding: '10px 14px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 8, border: '1px solid var(--border-color)',
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                              Overall comment
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              💬 {comments.overall}
                            </div>
                          </div>
                        ) : null
                      ) : (
                        <div style={{
                          padding: '10px 14px',
                          background: 'var(--bg-secondary)',
                          borderRadius: 8, border: '1px solid var(--border-color)',
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 6 }}>
                            Overall comment
                          </div>
                          <textarea
                            style={{
                              width: '100%', padding: '7px 10px',
                              fontSize: 13, fontFamily: 'inherit',
                              border: '1px solid var(--border-color)',
                              borderRadius: 6, background: '#FFFFFF',
                              color: 'var(--text-primary)',
                              resize: 'vertical', minHeight: 72, outline: 'none',
                            }}
                            value={comments.overall || ''}
                            onChange={e => setComments(prev => ({ ...prev, overall: e.target.value }))}
                            placeholder="Overall thoughts on this team's submission…"
                          />
                        </div>
                      )}
                    </div>

                    {/* Total bar */}
                    <div style={{
                      marginTop: 14, padding: '10px 14px',
                      background: 'var(--tile-bg)', borderRadius: 8,
                      border: '1px solid var(--accent-mid)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>Total</span>
                      <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>
                        {total}{maxTotal > 0 ? ` / ${maxTotal}` : ''}
                      </span>
                    </div>

                    {/* Actions */}
                    {!isFrozen && (
                      <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                          {saving ? 'Saving…' : 'Save draft'}
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                          onClick={handleFreeze}
                          disabled={freezing || scoreStatus === 'idle' || scoreStatus === 'editing'}
                        >
                          {freezing ? 'Freezing…' : '🔒 Freeze score'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Freeze all footer */}
                  {!isFrozen && (
                    <div className="judge-footer">
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Freeze all your saved Round {round} scores at once.
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={handleFreezeAll} disabled={freezing}>
                        {freezing ? 'Freezing…' : `🔒 Freeze all Round ${round}`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                  Select a team above to start scoring.
                </div>
              )}
            </div>

            {/* ── RIGHT: Leaderboard ──────────────────────── */}
            <div className="judge-col-right">
              <Leaderboard
                participants={visibleParticipants}
                allScores={allScores}
                criteria={criteria}
                round={round}
                selectedId={selectedId}
              />
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
