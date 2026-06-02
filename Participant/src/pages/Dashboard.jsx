import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useToast } from '../components/Toast'
import { getConfig, getParticipantByEid, getSubmissionByEid, putParticipant } from '../api'

const SKILL_OPTIONS = ['Product', 'Design', 'Engineering']

export default function Dashboard() {
  const navigate = useNavigate()
  const toast = useToast()

  const auth = (() => {
    try { return JSON.parse(localStorage.getItem('ha_participant_auth')) } catch { return null }
  })()

  const [config, setConfig]           = useState(null)
  const [participant, setParticipant] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [teamExpanded, setTeamExpanded] = useState(false)

  // Edit profile modal
  const [showEdit, setShowEdit]       = useState(false)
  const [editForm, setEditForm]       = useState({})
  const [editSaving, setEditSaving]   = useState(false)

  useEffect(() => {
    if (!auth) { navigate('/login', { replace: true }); return }
    Promise.all([
      getConfig(),
      getParticipantByEid(auth.enterprise_id),
      getSubmissionByEid(auth.enterprise_id),
    ])
      .then(([cfg, parts, subs]) => {
        setConfig(cfg)
        setParticipant(parts[0] || null)
        setSubmissions(subs)
      })
      .catch(() => toast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    localStorage.removeItem('ha_participant_auth')
    navigate('/login')
  }

  function openEdit() {
    if (!participant) return
    setEditForm({
      name:          participant.name          || '',
      email:         participant.email         || '',
      project_name:  participant.project_name  || '',
      project_lead:  participant.project_lead  || '',
      primary_skill: participant.primary_skill || '',
    })
    setShowEdit(true)
  }

  async function saveEdit() {
    setEditSaving(true)
    try {
      const updated = await putParticipant(participant.id, { ...participant, ...editForm })
      setParticipant(updated)
      // Update name in localStorage if changed
      const stored = JSON.parse(localStorage.getItem('ha_participant_auth') || '{}')
      localStorage.setItem('ha_participant_auth', JSON.stringify({ ...stored, name: updated.name }))
      toast('Profile updated', 'success')
      setShowEdit(false)
    } catch {
      toast('Failed to update profile', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  if (loading) return (
    <>
      <Navbar>
        <button className="btn btn-sm btn-ghost" onClick={handleLogout}>Logout</button>
      </Navbar>
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
    </>
  )

  if (!participant) return (
    <>
      <Navbar />
      <div className="gate-screen">
        <div className="gate-icon">🔐</div>
        <div className="gate-title">Participant not found</div>
        <div className="gate-body">
          <Link to="/register">Register first</Link> to access your dashboard.
        </div>
      </div>
    </>
  )

  const round2Teams = config?.round_2_teams || []
  const qualifiedForR2 = round2Teams.includes(participant.id)

  const r1Sub = submissions.find(s => (s.round || 1) === 1)
  const r2Sub = submissions.find(s => (s.round || 1) === 2)

  const submissionsOpen = config?.submissions_open || false
  const round2Open      = config?.round_2_open     || false

  const totalMembers = (participant.team_members || []).length + 1

  return (
    <>
      <Navbar>
        <span className="participant-name">{participant.name}</span>
        <button className="btn btn-sm btn-ghost" onClick={handleLogout} style={{ marginLeft: 8 }}>Logout</button>
      </Navbar>

      <div className="page">

        {/* ── R2 Qualification banner ── */}
        {qualifiedForR2 && (
          <div className="r2-banner">
            <div className="r2-banner-icon">🎉</div>
            <div>
              <div className="r2-banner-title">You've qualified for Round 2!</div>
              <div className="r2-banner-body">
                Congratulations — your team has been selected to advance.
                {round2Open
                  ? <> Round 2 submissions are now open. <Link to={`/submit?eid=${encodeURIComponent(participant.enterprise_id)}&round=2`} className="r2-banner-link">Submit Round 2 →</Link></>
                  : ' Round 2 will open soon — check back here.'}
              </div>
            </div>
          </div>
        )}

        {/* ── Page header ── */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="page-title">{participant.team_name || participant.name}</div>
            <div className="page-subtitle">
              {participant.team_name && <span>Lead: {participant.name} · </span>}
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{participant.enterprise_id}</span>
              {participant.participation_type === 'team' && (
                <span className="badge badge-purple" style={{ marginLeft: 8, fontSize: 10 }}>Team · {totalMembers}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={openEdit}>✏ Edit Profile</button>
          </div>
        </div>

        {/* ── Submission status cards ── */}
        <div className="section-title">My Submissions</div>
        <div className="dashboard-sub-cards">
          {/* Round 1 card */}
          <div className={`dash-sub-card ${r1Sub?.status === 'submitted' ? 'sub-submitted' : r1Sub ? 'sub-draft' : 'sub-none'}`}>
            <div className="dash-sub-round">Round 1</div>
            <div className="dash-sub-status">
              {r1Sub?.status === 'submitted'
                ? <span className="badge badge-green">Submitted</span>
                : r1Sub?.status === 'draft'
                  ? <span className="badge badge-amber">Draft saved</span>
                  : <span className="badge badge-gray">Not started</span>}
            </div>
            {r1Sub?.use_case && (
              <div className="dash-sub-usecase">{r1Sub.use_case}</div>
            )}
            {submissionsOpen ? (
              <Link
                to={`/submit?eid=${encodeURIComponent(participant.enterprise_id)}&round=1`}
                className="btn btn-sm btn-primary"
                style={{ marginTop: 10, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
              >
                {r1Sub ? 'Edit submission →' : 'Start submission →'}
              </Link>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10 }}>Submissions closed</div>
            )}
          </div>

          {/* Round 2 card */}
          <div className={`dash-sub-card ${r2Sub?.status === 'submitted' ? 'sub-submitted' : r2Sub ? 'sub-draft' : 'sub-none'} ${!qualifiedForR2 ? 'sub-locked' : ''}`}>
            <div className="dash-sub-round">Round 2</div>
            <div className="dash-sub-status">
              {!qualifiedForR2
                ? <span className="badge badge-gray">Not qualified</span>
                : r2Sub?.status === 'submitted'
                  ? <span className="badge badge-green">Submitted</span>
                  : r2Sub?.status === 'draft'
                    ? <span className="badge badge-amber">Draft saved</span>
                    : <span className="badge badge-gray">Not started</span>}
            </div>
            {r2Sub?.use_case && (
              <div className="dash-sub-usecase">{r2Sub.use_case}</div>
            )}
            {qualifiedForR2 && round2Open ? (
              <Link
                to={`/submit?eid=${encodeURIComponent(participant.enterprise_id)}&round=2`}
                className="btn btn-sm btn-primary"
                style={{ marginTop: 10, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
              >
                {r2Sub ? 'Edit submission →' : 'Start Round 2 →'}
              </Link>
            ) : qualifiedForR2 ? (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10 }}>Round 2 not open yet</div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10 }}>
                Advance from Round 1 to unlock
              </div>
            )}
          </div>
        </div>

        {/* ── Quick links ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <Link to={`/resources?eid=${encodeURIComponent(participant.enterprise_id)}`}
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none' }}>
            📚 Resources
          </Link>
        </div>

        {/* ── Profile info ── */}
        <div className="section-card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Profile</div>
          <div className="profile-grid">
            <div className="profile-field">
              <div className="profile-label">Project name</div>
              <div className="profile-value">{participant.project_name || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-label">Project lead</div>
              <div className="profile-value">{participant.project_lead || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-label">Work email</div>
              <div className="profile-value">{participant.email || '—'}</div>
            </div>
            <div className="profile-field">
              <div className="profile-label">Primary skill</div>
              <div className="profile-value">{participant.primary_skill || '—'}</div>
            </div>
          </div>
        </div>

        {/* ── Team members ── */}
        {participant.participation_type === 'team' && (
          <div className="section-card" style={{ marginBottom: 20 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setTeamExpanded(e => !e)}
            >
              <div className="section-title" style={{ marginBottom: 0 }}>
                Team Members <span className="badge badge-purple" style={{ marginLeft: 8, fontSize: 10 }}>{totalMembers}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{teamExpanded ? '▴ Hide' : '▾ Show'}</span>
            </div>
            {teamExpanded && (
              <div style={{ marginTop: 14 }}>
                {/* Lead row */}
                <div className="team-member-card">
                  <div style={{ fontWeight: 700 }}>{participant.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{participant.enterprise_id}</div>
                  <span className="badge badge-purple" style={{ fontSize: 9, marginTop: 4 }}>Team Lead</span>
                  {participant.primary_skill && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{participant.primary_skill}</div>
                  )}
                </div>
                {/* Other members */}
                {(participant.team_members || []).map((m, i) => (
                  <div key={i} className="team-member-card">
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{m.enterprise_id}</div>
                    <span className="badge badge-gray" style={{ fontSize: 9, marginTop: 4 }}>Member</span>
                    {m.primary_skill && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{m.primary_skill}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Edit Profile Modal ── */}
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Edit Profile</div>
              <button
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-tertiary)' }}
                onClick={() => setShowEdit(false)}
              >✕</button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-color)' }}>
              ℹ️ Team name and Enterprise ID cannot be changed after registration.
            </div>

            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Work email</label>
              <input
                type="email"
                className="form-input"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Project name</label>
                <input
                  className="form-input"
                  value={editForm.project_name}
                  onChange={e => setEditForm(f => ({ ...f, project_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Project lead</label>
                <input
                  className="form-input"
                  value={editForm.project_lead}
                  onChange={e => setEditForm(f => ({ ...f, project_lead: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Primary skill</label>
              <select
                className="form-select"
                value={editForm.primary_skill}
                onChange={e => setEditForm(f => ({ ...f, primary_skill: e.target.value }))}
              >
                <option value="">Select a skill</option>
                {SKILL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn-primary" style={{ flex: 2 }} onClick={saveEdit} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setShowEdit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
