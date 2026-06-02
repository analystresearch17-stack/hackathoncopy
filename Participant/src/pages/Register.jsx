import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useToast } from '../components/Toast'
import { getConfig, getParticipants, postParticipant } from '../api'

const SKILL_OPTIONS = ['Product', 'Design', 'Engineering']

const emptyMember = () => ({ full_name: '', enterprise_id: '', primary_skill: '' })

const emptyForm = () => ({
  team_name: '',
  full_name: '',
  enterprise_id: '',
  work_email: '',
  primary_skill: '',
  project_name: '',
  project_lead: '',
  password: '',
  confirm_password: '',
})

export default function Register() {
  const navigate = useNavigate()
  const toast = useToast()

  const [config, setConfig]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [mode, setMode]               = useState('solo')
  const [form, setForm]               = useState(emptyForm())
  const [members, setMembers]         = useState([emptyMember()])
  const [errors, setErrors]           = useState({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [savedRecord, setSavedRecord] = useState(null)

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
    </>
  )

  if (!config.registration_open) {
    return (
      <>
        <Navbar />
        <div className="gate-screen">
          <div className="gate-icon">🔒</div>
          <div className="gate-title">Registration is closed</div>
          <div className="gate-body">The registration period for this hackathon has ended.</div>
        </div>
      </>
    )
  }

  const maxAdditionalMembers = Math.max(1, (config.max_team_size || 5) - 1)

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function setMemberField(idx, key, value) {
    setMembers(ms => ms.map((m, i) => i === idx ? { ...m, [key]: value } : m))
    const eKey = `member_${idx}_${key}`
    if (errors[eKey]) setErrors(e => ({ ...e, [eKey]: undefined }))
  }

  function addMember() {
    if (members.length < maxAdditionalMembers) setMembers(ms => [...ms, emptyMember()])
  }

  function removeMember(idx) {
    setMembers(ms => ms.filter((_, i) => i !== idx))
  }

  function validate() {
    const errs = {}
    const required = ['team_name', 'full_name', 'enterprise_id', 'work_email', 'primary_skill', 'project_name', 'project_lead', 'password']
    required.forEach(k => {
      if (!form[k]?.trim()) errs[k] = 'This field is required'
    })
    if (form.work_email && !form.work_email.includes('@')) {
      errs.work_email = 'Must be a valid email address'
    }
    if (form.password && form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters'
    }
    if (!form.confirm_password?.trim()) {
      errs.confirm_password = 'Please confirm your password'
    } else if (form.password && form.password !== form.confirm_password) {
      errs.confirm_password = 'Passwords do not match'
    }
    if (mode === 'team') {
      members.forEach((m, i) => {
        if (!m.full_name?.trim()) errs[`member_${i}_full_name`] = 'Required'
        if (!m.enterprise_id?.trim()) errs[`member_${i}_enterprise_id`] = 'Required'
      })
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      const existing = await getParticipants()

      // Duplicate enterprise ID check
      if (existing.some(p => p.enterprise_id === form.enterprise_id.trim())) {
        setErrors(e => ({ ...e, enterprise_id: 'This Enterprise ID is already registered' }))
        return
      }

      // Duplicate team name check (case-insensitive)
      if (existing.some(p => p.team_name?.toLowerCase() === form.team_name.trim().toLowerCase())) {
        setErrors(e => ({ ...e, team_name: 'This team name is already taken. Please choose a different name.' }))
        return
      }

      // Compute next team_id (max existing + 1, starting from 1)
      const maxTeamId = existing.reduce((max, p) => Math.max(max, p.team_id || 0), 0)
      const nextTeamId = maxTeamId + 1

      const record = {
        team_id: nextTeamId,
        team_name: form.team_name.trim(),
        name: form.full_name.trim(),
        email: form.work_email.trim(),
        enterprise_id: form.enterprise_id.trim(),
        primary_skill: form.primary_skill,
        member_type: 'Team Lead',
        project_name: form.project_name.trim(),
        project_lead: form.project_lead.trim(),
        participation_type: mode,
        team_members: mode === 'team' ? members.map(m => ({ name: m.full_name.trim(), enterprise_id: m.enterprise_id.trim(), primary_skill: m.primary_skill, member_type: 'Member' })) : [],
        registered_at: new Date().toISOString(),
        password: form.password.trim(),
      }

      const saved = await postParticipant(record)
      setSavedRecord(saved)
      setShowSuccess(true)
    } catch (err) {
      toast(err.message || 'Registration failed. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar>
        <button className="btn-primary" onClick={() => navigate('/register')}>
          Register
        </button>
      </Navbar>

      <div className="page">
        <button
          className="btn btn-sm btn-ghost"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() => navigate('/')}
        >
          ← Back
        </button>
        <div className="page-header">
          <div className="page-title">Register for {config.name}</div>
          <div className="page-subtitle">Fill in your details to secure your spot.</div>
        </div>

        {/* Solo / Team toggle */}
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn${mode === 'solo' ? ' active' : ''}`}
            onClick={() => setMode('solo')}
          >
            Solo
          </button>
          <button
            type="button"
            className={`toggle-btn${mode === 'team' ? ' active' : ''}`}
            onClick={() => setMode('team')}
          >
            Team
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Section 1: Your details ── */}
          <div className="section-title">Your details</div>

          <div className="form-group">
            <label className="form-label">Team name <span className="required">*</span></label>
            <input
              className={`form-input${errors.team_name ? ' error' : ''}`}
              value={form.team_name}
              onChange={e => setField('team_name', e.target.value)}
              placeholder="e.g. Team Innovators"
            />
            {errors.team_name && <span className="form-error">{errors.team_name}</span>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full name <span className="required">*</span></label>
              <input
                className={`form-input${errors.full_name ? ' error' : ''}`}
                value={form.full_name}
                onChange={e => setField('full_name', e.target.value)}
                placeholder="Jane Smith"
              />
              {errors.full_name && <span className="form-error">{errors.full_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Enterprise ID <span className="required">*</span></label>
              <input
                className={`form-input${errors.enterprise_id ? ' error' : ''}`}
                value={form.enterprise_id}
                onChange={e => setField('enterprise_id', e.target.value)}
                placeholder="EMP00123"
              />
              {errors.enterprise_id && <span className="form-error">{errors.enterprise_id}</span>}
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Work email <span className="required">*</span></label>
              <input
                type="email"
                className={`form-input${errors.work_email ? ' error' : ''}`}
                value={form.work_email}
                onChange={e => setField('work_email', e.target.value)}
                placeholder="jane@company.com"
              />
              {errors.work_email && <span className="form-error">{errors.work_email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Primary skill <span className="required">*</span></label>
              <select
                className={`form-select${errors.primary_skill ? ' error' : ''}`}
                value={form.primary_skill}
                onChange={e => setField('primary_skill', e.target.value)}
              >
                <option value="">Select a skill</option>
                {SKILL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.primary_skill && <span className="form-error">{errors.primary_skill}</span>}
            </div>
          </div>


          <hr className="divider" />

          {/* ── Section 2: Project details ── */}
          <div className="section-title">Project details</div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Project name <span className="required">*</span></label>
              <input
                className={`form-input${errors.project_name ? ' error' : ''}`}
                value={form.project_name}
                onChange={e => setField('project_name', e.target.value)}
                placeholder="e.g. EcoGuard AI"
              />
              {errors.project_name && <span className="form-error">{errors.project_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Project lead <span className="required">*</span></label>
              <input
                className={`form-input${errors.project_lead ? ' error' : ''}`}
                value={form.project_lead}
                onChange={e => setField('project_lead', e.target.value)}
                placeholder="Project lead name"
              />
              {errors.project_lead && <span className="form-error">{errors.project_lead}</span>}
            </div>
          </div>

          {/* ── Team members (team mode only) ── */}
          {mode === 'team' && (
            <>
              <hr className="divider" />
              <div className="section-title">Team members</div>

              {members.map((m, i) => (
                <div key={i} className="member-block">
                  <div className="member-block-header">
                    <span className="member-title">Member {i + 2}</span>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => removeMember(i)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="member-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Full name <span className="required">*</span></label>
                      <input
                        className={`form-input${errors[`member_${i}_full_name`] ? ' error' : ''}`}
                        value={m.full_name}
                        onChange={e => setMemberField(i, 'full_name', e.target.value)}
                        placeholder="Full name"
                      />
                      {errors[`member_${i}_full_name`] && (
                        <span className="form-error">{errors[`member_${i}_full_name`]}</span>
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Enterprise ID <span className="required">*</span></label>
                      <input
                        className={`form-input${errors[`member_${i}_enterprise_id`] ? ' error' : ''}`}
                        value={m.enterprise_id}
                        onChange={e => setMemberField(i, 'enterprise_id', e.target.value)}
                        placeholder="EMP00456"
                      />
                      {errors[`member_${i}_enterprise_id`] && (
                        <span className="form-error">{errors[`member_${i}_enterprise_id`]}</span>
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Primary skill</label>
                      <select
                        className="form-select"
                        value={m.primary_skill}
                        onChange={e => setMemberField(i, 'primary_skill', e.target.value)}
                      >
                        <option value="">Select a skill</option>
                        {SKILL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {members.length < maxAdditionalMembers && (
                <button
                  type="button"
                  className="btn"
                  style={{ marginBottom: '24px' }}
                  onClick={addMember}
                >
                  + Add member
                </button>
              )}
            </>
          )}

          <hr className="divider" />

          {/* ── Section 3: Create password ── */}
          <div className="section-title">Create a password</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Your <strong>team name</strong> will be your username. Use these credentials to log back in.
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <input
                type="password"
                className={`form-input${errors.password ? ' error' : ''}`}
                value={form.password}
                onChange={e => setField('password', e.target.value)}
                placeholder="Min. 6 characters"
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm password <span className="required">*</span></label>
              <input
                type="password"
                className={`form-input${errors.confirm_password ? ' error' : ''}`}
                value={form.confirm_password}
                onChange={e => setField('confirm_password', e.target.value)}
                placeholder="Re-enter password"
              />
              {errors.confirm_password && <span className="form-error">{errors.confirm_password}</span>}
            </div>
          </div>

          <hr className="divider" />

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Registering…' : 'Complete registration →'}
          </button>
        </form>
      </div>

      {/* ── Success modal ── */}
      {showSuccess && savedRecord && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-success-icon">✓</div>
            <div className="modal-title">Registration Successful!</div>
            <div className="modal-body">
              You're all set, <strong>{savedRecord.name}</strong>. Here are your login credentials — save them somewhere safe.
            </div>

            <div className="modal-creds-box">
              <div className="modal-creds-row">
                <span className="modal-creds-label">Username (Team name)</span>
                <span className="modal-creds-value">{savedRecord.team_name}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-color)', margin: '8px 0' }} />
              <div className="modal-creds-row">
                <span className="modal-creds-label">Password</span>
                <span className="modal-creds-value" style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                  {form.password}
                </span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 24, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-color)' }}>
              ⚠️ Your password won't be shown again. Please note it down before continuing.
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                localStorage.setItem('ha_participant_auth', JSON.stringify({
                  id: savedRecord.id,
                  name: savedRecord.name,
                  team_name: savedRecord.team_name,
                  enterprise_id: savedRecord.enterprise_id,
                  team_id: savedRecord.team_id,
                }))
                navigate('/dashboard')
              }}
            >
              Continue to my dashboard →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
