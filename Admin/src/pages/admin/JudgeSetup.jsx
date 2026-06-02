import { useState, useEffect } from 'react'
import { getJudges, postJudge, putJudge, deleteJudge, getCriteria, postCriterion, putCriterion, deleteCriterion, getConfig, putConfig, getScores } from '../../api'
import { useToast } from '../../components/Toast'

const ROUND_OPTIONS = [
  { value: 'both',    label: 'Both rounds' },
  { value: 'round_1', label: 'Round 1 only' },
  { value: 'round_2', label: 'Round 2 only' },
]

function emptyJudge() {
  return { name: '', username: '', password: '', round_assignment: 'both' }
}

function emptyCriterion() {
  return { label: '', tooltip: '', max: '', key: '', active: true }
}

function toKey(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export default function JudgeSetup() {
  const { show } = useToast()

  // ── Judges ──────────────────────────────────────────────
  const [judges, setJudges] = useState([])
  const [showJudgeModal, setShowJudgeModal] = useState(false)
  const [editingJudge, setEditingJudge] = useState(null)   // null = add, obj = edit
  const [judgeForm, setJudgeForm] = useState(emptyJudge())
  const [judgeErrors, setJudgeErrors] = useState({})
  const [judgeSaving, setJudgeSaving] = useState(false)

  // ── Criteria ─────────────────────────────────────────────
  const [criteria, setCriteria] = useState([])
  const [criteriaLocked, setCriteriaLocked] = useState(false)
  const [hasScores, setHasScores] = useState(false)
  const [editingCriteria, setEditingCriteria] = useState({})   // id → { label, tooltip, max }
  const [showAddCrit, setShowAddCrit] = useState(false)
  const [newCrit, setNewCrit] = useState(emptyCriterion())
  const [critErrors, setCritErrors] = useState({})
  const [critSaving, setCritSaving] = useState(false)

  useEffect(() => {
    Promise.all([getJudges(), getCriteria(), getConfig(), getScores()])
      .then(([jdgs, crits, cfg, scrs]) => {
        setJudges(jdgs)
        setCriteria(crits)
        setCriteriaLocked(cfg.criteria_locked || false)
        setHasScores(scrs.length > 0)
        // Seed editing state
        const eds = {}
        crits.forEach(c => { eds[c.id] = { label: c.label, tooltip: c.tooltip, max: String(c.max) } })
        setEditingCriteria(eds)
      })
      .catch(() => show('Failed to load setup data', 'error'))
  }, [])


  // ── Judges ──────────────────────────────────────────────
  function openAddJudge() {
    setEditingJudge(null)
    setJudgeForm(emptyJudge())
    setJudgeErrors({})
    setShowJudgeModal(true)
  }

  function openEditJudge(judge) {
    setEditingJudge(judge)
    setJudgeForm({ name: judge.name, username: judge.username, password: judge.password, round_assignment: judge.round_assignment || 'both' })
    setJudgeErrors({})
    setShowJudgeModal(true)
  }

  function validateJudge() {
    const errs = {}
    if (!judgeForm.name.trim())     errs.name     = 'Name is required'
    if (!judgeForm.username.trim()) errs.username = 'Username is required'
    if (!editingJudge && !judgeForm.password.trim()) errs.password = 'Password is required'
    // Check username uniqueness
    const taken = judges.find(j => j.username === judgeForm.username.trim() && j.id !== editingJudge?.id)
    if (taken) errs.username = 'Username already taken'
    return errs
  }

  async function saveJudge() {
    const errs = validateJudge()
    if (Object.keys(errs).length) { setJudgeErrors(errs); return }
    setJudgeSaving(true)
    try {
      const payload = { ...judgeForm, name: judgeForm.name.trim(), username: judgeForm.username.trim() }
      if (editingJudge && !judgeForm.password.trim()) delete payload.password  // keep existing if blank
      let result
      if (editingJudge) {
        result = await putJudge(editingJudge.id, { ...editingJudge, ...payload })
        setJudges(prev => prev.map(j => j.id === result.id ? result : j))
        show('Judge updated', 'success')
      } else {
        result = await postJudge(payload)
        setJudges(prev => [...prev, result])
        show('Judge added', 'success')
      }
      setShowJudgeModal(false)
    } catch {
      show('Failed to save judge', 'error')
    } finally {
      setJudgeSaving(false)
    }
  }

  async function removeJudge(judge) {
    if (!window.confirm(`Remove judge "${judge.name}"? This cannot be undone.`)) return
    try {
      await deleteJudge(judge.id)
      setJudges(prev => prev.filter(j => j.id !== judge.id))
      show('Judge removed', 'success')
    } catch {
      show('Failed to remove judge', 'error')
    }
  }

  // ── Criteria ─────────────────────────────────────────────
  function setCritField(id, field, value) {
    setEditingCriteria(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  async function saveCriterion(c) {
    const ed = editingCriteria[c.id]
    if (!ed) return
    setCritSaving(true)
    try {
      const updated = await putCriterion(c.id, { ...c, label: ed.label, tooltip: ed.tooltip, max: parseInt(ed.max, 10) || 0 })
      setCriteria(prev => prev.map(x => x.id === updated.id ? updated : x))
      show('Criterion saved', 'success')
    } catch {
      show('Failed to save criterion', 'error')
    } finally {
      setCritSaving(false)
    }
  }

  async function removeCriterion(c) {
    if (criteriaLocked) { show('Criteria are locked — unfreeze first', 'error'); return }
    if (!window.confirm(`Delete criterion "${c.label}"?`)) return
    try {
      await deleteCriterion(c.id)
      setCriteria(prev => prev.filter(x => x.id !== c.id))
      show('Criterion deleted', 'success')
    } catch {
      show('Failed to delete criterion', 'error')
    }
  }

  function validateNewCrit() {
    const errs = {}
    if (!newCrit.label.trim()) errs.label = 'Label is required'
    const m = parseInt(newCrit.max, 10)
    if (!newCrit.max || isNaN(m) || m <= 0) errs.max = 'Max points must be > 0'
    return errs
  }

  async function addCriterion() {
    const errs = validateNewCrit()
    if (Object.keys(errs).length) { setCritErrors(errs); return }
    setCritSaving(true)
    try {
      const key = toKey(newCrit.label) || `criterion_${Date.now()}`
      const payload = { key, label: newCrit.label.trim(), tooltip: newCrit.tooltip.trim(), max: parseInt(newCrit.max, 10), active: true }
      const result = await postCriterion(payload)
      setCriteria(prev => [...prev, result])
      setEditingCriteria(prev => ({ ...prev, [result.id]: { label: result.label, tooltip: result.tooltip, max: String(result.max) } }))
      setNewCrit(emptyCriterion())
      setCritErrors({})
      setShowAddCrit(false)
      show('Criterion added', 'success')
    } catch {
      show('Failed to add criterion', 'error')
    } finally {
      setCritSaving(false)
    }
  }

  async function toggleDeclareLock() {
    try {
      const cfg = await getConfig()
      const updated = await putConfig({ ...cfg, criteria_locked: !criteriaLocked })
      setCriteriaLocked(updated.criteria_locked)
      show(updated.criteria_locked ? 'Criteria declared and locked' : 'Criteria unlocked', 'success')
    } catch {
      show('Failed to update lock', 'error')
    }
  }

  const roundLabel = v => ROUND_OPTIONS.find(o => o.value === v)?.label || v

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Judge Setup</div>
        <div className="page-subtitle">Manage judges and scoring criteria</div>
      </div>

      {/* ── Judges Panel ─────────────────────────────────── */}
      <div className="section-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Judges</div>
          <button className="btn btn-primary btn-sm" onClick={openAddJudge}>+ Add judge</button>
        </div>

        {judges.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '12px 0' }}>No judges added yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Rounds</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {judges.map(j => (
                <tr key={j.id}>
                  <td style={{ fontWeight: 600 }}>{j.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{j.username}</td>
                  <td>
                    <span className="badge badge-purple" style={{ fontSize: 10 }}>{roundLabel(j.round_assignment)}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => openEditJudge(j)}>Edit</button>
                      <button className="btn btn-sm btn-ghost" style={{ color: 'var(--error-text)' }} onClick={() => removeJudge(j)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Criteria Panel ───────────────────────────────── */}
      <div className="section-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 2 }}>Scoring Criteria</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Set max points for each criteria. These will reflect in the judging portal.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!criteriaLocked && (
              <button className="btn btn-sm btn-ghost" onClick={() => setShowAddCrit(s => !s)}>
                + Add custom criteria
              </button>
            )}
            <button
              className={`btn btn-sm ${criteriaLocked ? 'btn-ghost' : 'btn-primary'}`}
              onClick={toggleDeclareLock}
            >
              {criteriaLocked ? '🔓 Unlock criteria' : '🔒 Declare criteria'}
            </button>
          </div>
        </div>

        {criteriaLocked && (
          <div style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid #A8D5B5', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
            ✓ Criteria are declared and locked. Judges are scoring based on these criteria.
          </div>
        )}
        {criteriaLocked && hasScores && (
          <div style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid #F0C97A', borderRadius: 8, padding: '10px 14px', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Judges have already started scoring</div>
              <div>Unlocking and changing criteria now will make existing judge scores inconsistent. Proceed only if all judges are aware of the change.</div>
            </div>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Criteria</th>
              <th style={{ width: '35%' }}>Description / Tooltip</th>
              <th style={{ width: '12%', textAlign: 'center' }}>Max pts</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {criteria.map(c => {
              const ed = editingCriteria[c.id] || { label: c.label, tooltip: c.tooltip, max: String(c.max) }
              return (
                <tr key={c.id}>
                  <td>
                    <input
                      className="form-control"
                      style={{ fontSize: 13 }}
                      value={ed.label}
                      disabled={criteriaLocked}
                      onChange={e => setCritField(c.id, 'label', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="form-control"
                      style={{ fontSize: 13 }}
                      value={ed.tooltip}
                      disabled={criteriaLocked}
                      placeholder="Shown as tooltip to judges"
                      onChange={e => setCritField(c.id, 'tooltip', e.target.value)}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      className="form-control"
                      style={{ textAlign: 'center', fontSize: 13 }}
                      value={ed.max}
                      disabled={criteriaLocked}
                      min={1}
                      max={100}
                      onChange={e => setCritField(c.id, 'max', e.target.value)}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!criteriaLocked && (
                        <>
                          <button className="btn btn-sm btn-secondary" disabled={critSaving} onClick={() => saveCriterion(c)}>Save</button>
                          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--error-text)' }} onClick={() => removeCriterion(c)}>×</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Add custom criteria row */}
        {showAddCrit && !criteriaLocked && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px dashed var(--border-color)' }}>
            <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, color: 'var(--text-secondary)' }}>
              Add Custom Criteria
            </div>
            <div className="grid-2" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label>Label *</label>
                <input className="form-control" value={newCrit.label} onChange={e => setNewCrit(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Innovation" />
                {critErrors.label && <span style={{ color: 'var(--error-text)', fontSize: 12 }}>{critErrors.label}</span>}
              </div>
              <div className="form-group">
                <label>Max points *</label>
                <input type="number" className="form-control" value={newCrit.max} min={1} max={100} onChange={e => setNewCrit(p => ({ ...p, max: e.target.value }))} placeholder="e.g. 10" />
                {critErrors.max && <span style={{ color: 'var(--error-text)', fontSize: 12 }}>{critErrors.max}</span>}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Description / Tooltip</label>
              <input className="form-control" value={newCrit.tooltip} onChange={e => setNewCrit(p => ({ ...p, tooltip: e.target.value }))} placeholder="Shown as tooltip to judges" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={addCriterion} disabled={critSaving}>Add</button>
              <button className="btn btn-sm btn-ghost" onClick={() => { setShowAddCrit(false); setNewCrit(emptyCriterion()); setCritErrors({}) }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Judge Modal ───────────────────────── */}
      {showJudgeModal && (
        <>
          <div className="drawer-overlay" onClick={() => setShowJudgeModal(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#FFFFFF', borderRadius: 12, border: '2px solid var(--accent)',
            padding: 32, width: 420, zIndex: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
              {editingJudge ? 'Edit judge' : 'Add judge'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Full name *</label>
                <input className="form-control" value={judgeForm.name} onChange={e => setJudgeForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Himanshu" />
                {judgeErrors.name && <span style={{ color: 'var(--error-text)', fontSize: 12 }}>{judgeErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input className="form-control" value={judgeForm.username} onChange={e => setJudgeForm(p => ({ ...p, username: e.target.value.toLowerCase() }))} placeholder="e.g. himanshu" />
                {judgeErrors.username && <span style={{ color: 'var(--error-text)', fontSize: 12 }}>{judgeErrors.username}</span>}
              </div>
              <div className="form-group">
                <label>{editingJudge ? 'New password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" className="form-control" value={judgeForm.password} onChange={e => setJudgeForm(p => ({ ...p, password: e.target.value }))} placeholder={editingJudge ? '••••••••' : 'Enter password'} />
                {judgeErrors.password && <span style={{ color: 'var(--error-text)', fontSize: 12 }}>{judgeErrors.password}</span>}
              </div>
              <div className="form-group">
                <label>Rounds assigned *</label>
                <select className="form-control" value={judgeForm.round_assignment} onChange={e => setJudgeForm(p => ({ ...p, round_assignment: e.target.value }))}>
                  {ROUND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={saveJudge} disabled={judgeSaving}>
                  {judgeSaving ? 'Saving…' : editingJudge ? 'Update judge' : 'Add judge'}
                </button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowJudgeModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
