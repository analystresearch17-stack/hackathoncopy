import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useToast } from '../components/Toast'
import { getConfig, getParticipantByEid, getSubmissionByEidAndRound, postSubmission, putSubmission } from '../api'

const MAX_DESC = 300
const MAX_FILE_MB = 20

function formatTimestamp(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function deadlineBannerClass(deadline) {
  if (!deadline) return 'deadline-banner-neutral'
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'deadline-banner-neutral'
  if (diff < 2 * 60 * 60 * 1000)  return 'deadline-banner-red'
  if (diff < 12 * 60 * 60 * 1000) return 'deadline-banner-amber'
  return 'deadline-banner-neutral'
}

function deadlineBannerText(deadline) {
  if (!deadline) return ''
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Submission deadline has passed.'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (diff < 2 * 60 * 60 * 1000)
    return `⚠ Less than 2 hours left — ${h}h ${m}m remaining.`
  if (diff < 12 * 60 * 60 * 1000)
    return `⏰ Deadline approaching — ${h}h ${m}m remaining.`
  return `Submission deadline: ${formatTimestamp(deadline)}`
}

export default function Submit() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const eid = params.get('eid') || ''
  const round = parseInt(params.get('round') || '1', 10)
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState(null)
  const [participant, setParticipant] = useState(null)
  const [existingSubmission, setExistingSubmission] = useState(null)
  const [round1UseCase, setRound1UseCase] = useState('')

  const [form, setForm] = useState({ use_case: '', description: '' })
  const [links, setLinks] = useState([{ title: '', url: '' }])
  const [filename, setFilename] = useState('')
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(null)
  const [bannerText, setBannerText] = useState('')
  const [bannerCls, setBannerCls]   = useState('deadline-banner-neutral')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!eid) { setLoading(false); return }
    Promise.all([
      getConfig(),
      getParticipantByEid(eid),
      getSubmissionByEidAndRound(eid, round),
      // For Round 2, also fetch Round 1 submission to pre-fill the locked use_case
      round === 2 ? getSubmissionByEidAndRound(eid, 1) : Promise.resolve([]),
    ])
      .then(([cfg, parts, subs, r1Subs]) => {
        setConfig(cfg)
        setParticipant(parts[0] || null)
        const sub      = subs[0]    || null
        const r1Sub    = r1Subs[0]  || null
        const r1UC     = r1Sub?.use_case || ''
        setExistingSubmission(sub)
        setRound1UseCase(r1UC)
        if (sub) {
          setForm({
            use_case:    sub.use_case    || r1UC || '',
            description: sub.description || '',
          })
          setLinks(sub.links?.length ? sub.links : [{ title: '', url: '' }])
          setFilename(sub.filename || '')
          if (sub.status === 'submitted') setSubmitted(sub)
        } else {
          // No existing submission — pre-fill use_case from R1 for Round 2
          setForm(f => ({ ...f, use_case: r1UC }))
        }
      })
      .finally(() => setLoading(false))
  }, [eid, round])

  // Deadline banner — live countdown
  useEffect(() => {
    if (!config) return
    const deadline = round === 1 ? config.round_1_date : config.round_2_date
    setBannerText(deadlineBannerText(deadline))
    setBannerCls(deadlineBannerClass(deadline))
    const id = setInterval(() => {
      setBannerText(deadlineBannerText(deadline))
      setBannerCls(deadlineBannerClass(deadline))
    }, 1000)
    return () => clearInterval(id)
  }, [config, round])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
    </>
  )

  if (!participant) {
    return (
      <>
        <Navbar />
        <div className="gate-screen">
          <div className="gate-icon">🔐</div>
          <div className="gate-title">Access restricted</div>
          <div className="gate-body">
            Please <Link to="/register">register first</Link> to submit your project.
          </div>
        </div>
      </>
    )
  }

  // Gate: check if this round is open
  const roundOpen = round === 1 ? config.submissions_open : (config.round_2_open || false)
  if (!roundOpen) {
    return (
      <>
        <Navbar>
          <span className="participant-name">{participant.name}</span>
        </Navbar>
        <div className="gate-screen">
          <div className="gate-icon">🔒</div>
          <div className="gate-title">Round {round} submissions are closed</div>
          <div className="gate-body">
            {round === 2
              ? 'Round 2 has not opened yet. Check back after Round 1 results.'
              : 'The submission window for this hackathon has ended.'}
          </div>
        </div>
      </>
    )
  }

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast(`File exceeds ${MAX_FILE_MB}MB limit`, 'error')
      e.target.value = ''
      return
    }
    setFilename(file.name)
    if (errors.file) setErrors(e => ({ ...e, file: undefined }))
  }

  function setLinkField(index, key, value) {
    setLinks(prev => prev.map((l, i) => i === index ? { ...l, [key]: value } : l))
    if (errors.links) setErrors(e => ({ ...e, links: undefined }))
  }

  function addLink() {
    setLinks(prev => [...prev, { title: '', url: '' }])
  }

  function removeLink(index) {
    setLinks(prev => prev.length === 1 ? [{ title: '', url: '' }] : prev.filter((_, i) => i !== index))
  }

  function buildRecord(status) {
    return {
      eid,
      round,
      participant_id: participant?.id,
      use_case:    form.use_case.trim(),
      description: form.description.trim(),
      links:       links.filter(l => l.url.trim()),
      filename,
      status,
    }
  }

  async function saveDraft() {
    const record = buildRecord('draft')
    try {
      let result
      if (existingSubmission?.id) {
        result = await putSubmission(existingSubmission.id, record)
      } else {
        result = await postSubmission(record)
        setExistingSubmission(result)
      }
      toast('Draft saved', 'info')
    } catch {
      toast('Failed to save draft', 'error')
    }
  }

  function validate() {
    const errs = {}
    if (!form.use_case.trim()) errs.use_case = 'Use case is required'
    if (!links.some(l => l.url.trim())) errs.links = 'At least one link is required'
    if (!filename) errs.file = 'Please upload your deck (PPTX or PDF)'
    return errs
  }

  async function handleWithdraw() {
    if (!window.confirm('Withdraw your submission? It will return to draft status and you can re-submit before the deadline.')) return
    try {
      const result = await putSubmission(existingSubmission.id, { ...buildRecord('draft'), submitted_at: null })
      setExistingSubmission(result)
      toast('Submission withdrawn — you can now edit and re-submit.', 'info')
    } catch {
      toast('Failed to withdraw submission', 'error')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    const record = {
      ...buildRecord('submitted'),
      submitted_at: new Date().toISOString(),
    }
    try {
      let result
      if (existingSubmission?.id) {
        result = await putSubmission(existingSubmission.id, record)
      } else {
        result = await postSubmission(record)
      }
      setExistingSubmission(result)
      toast('Submission received!', 'success')
      setSubmitted(result)
    } catch {
      toast('Failed to submit. Please try again.', 'error')
    }
  }

  // Confirmation screen
  if (submitted) {
    return (
      <>
        <Navbar>
          <span className="participant-name">{participant.name}</span>
        </Navbar>
        <div className="page">
        <button
          className="btn btn-sm btn-ghost"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() => navigate('/dashboard')}
        >
          ← Back to dashboard
        </button>
          <div className="card">
            <div className="confirm-screen">
              <div className="confirm-icon">✓</div>
              <div className="confirm-title">Round {round} submission received</div>
              <div className="confirm-detail">
                <strong>{submitted.use_case}</strong><br />
                Submitted {formatTimestamp(submitted.submitted_at)}
              </div>
              <div className="confirm-note">
                You can still update your submission until the deadline.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
                <button className="btn-primary" onClick={() => setSubmitted(null)}>
                  Update submission
                </button>
                {round === 1 && (
                  <button
                    className="btn"
                    onClick={() => navigate(`/submit?eid=${encodeURIComponent(eid)}&round=2`)}
                  >
                    Proceed to Round 2 →
                  </button>
                )}
                <button
                  className="btn"
                  style={{ color: 'var(--error-text)', borderColor: 'var(--error-text)', fontSize: 13 }}
                  onClick={handleWithdraw}
                >
                  Withdraw submission
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar>
        <span className="participant-name">{participant.name}</span>
      </Navbar>

      <div className="page">
        <button
          className="btn btn-sm btn-ghost"
          style={{ marginBottom: 16, fontSize: 13 }}
          onClick={() => navigate('/dashboard')}
        >
          ← Back to dashboard
        </button>
        <div className="page-header">
          <div className="page-title">Round {round} — Submit your project</div>
          <div className="page-subtitle">{config.name}</div>
        </div>

        {/* Round indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[1, 2].map(r => (
            <span
              key={r}
              className={`badge ${r === round ? 'badge-green' : 'badge-gray'}`}
              style={{ fontSize: 12, padding: '4px 12px' }}
            >
              Round {r}{r === round ? ' — Active' : ''}
            </span>
          ))}
        </div>

        {bannerText && (
          <div className={`deadline-banner ${bannerCls}`}>
            {bannerText}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {round === 1 ? (
            /* ── Round 1: dropdown of active use cases ── */
            <div className="form-group">
              <label className="form-label">Use case <span className="required">*</span></label>
              <select
                className={`form-select${errors.use_case ? ' error' : ''}`}
                value={form.use_case}
                onChange={e => setField('use_case', e.target.value)}
              >
                <option value="">— Select a use case —</option>
                {(config.use_cases || [])
                  .filter(uc => uc.content?.trim())
                  .map(uc => (
                    <option key={uc.id} value={uc.title}>{uc.title}</option>
                  ))
                }
              </select>
              {errors.use_case && <span className="form-error">{errors.use_case}</span>}
            </div>
          ) : (
            /* ── Round 2: locked, pre-filled from Round 1 ── */
            <div className="form-group">
              <label className="form-label">Use case</label>
              <div style={{
                padding: '9px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                color: form.use_case ? 'var(--text-primary)' : 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}>
                <span>{form.use_case || '—'}</span>
                <span className="badge badge-gray" style={{ fontSize: 10, flexShrink: 0 }}>Carried from Round 1</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 5 }}>
                Your use case is locked based on your Round 1 submission.
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Short description</label>
            <textarea
              className={`form-textarea${errors.description ? ' error' : ''}`}
              value={form.description}
              onChange={e => setField('description', e.target.value.slice(0, MAX_DESC))}
              placeholder="Describe your solution in a few sentences…"
              rows={4}
            />
            <div className={`char-count${form.description.length >= MAX_DESC ? ' over' : ''}`}>
              {form.description.length} / {MAX_DESC}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Links <span className="required">*</span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginLeft: '6px', textTransform: 'none', letterSpacing: 0 }}>add at least one</span>
            </label>

            {links.map((link, index) => (
              <div key={index} className="form-grid" style={{ marginBottom: 10, alignItems: 'flex-start' }}>
                <input
                  className="form-input"
                  value={link.title}
                  onChange={e => setLinkField(index, 'title', e.target.value)}
                  placeholder="Title (e.g. GitHub Repo)"
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className={`form-input${errors.links && !link.url.trim() && index === 0 ? ' error' : ''}`}
                    style={{ flex: 1 }}
                    value={link.url}
                    onChange={e => setLinkField(index, 'url', e.target.value)}
                    placeholder="https://…"
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      style={{
                        background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                        color: 'var(--text-tertiary)', cursor: 'pointer', padding: '0 10px',
                        fontSize: 16, lineHeight: 1, flexShrink: 0,
                      }}
                      title="Remove link"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}

            {errors.links && <span className="form-error">{errors.links}</span>}

            <button
              type="button"
              className="btn"
              style={{ marginTop: 4, fontSize: 13, padding: '6px 14px' }}
              onClick={addLink}
            >
              Add link +
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Deck upload <span className="required">*</span> <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginLeft: '4px', textTransform: 'none', letterSpacing: 0 }}>PPTX or PDF · max 20 MB</span></label>
            <div className="file-upload-wrap">
              <label className="file-upload-box">
                <input
                  type="file"
                  accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <span className="file-upload-box-label">
                  {filename ? `📎 ${filename}` : 'Click to choose file'}
                </span>
                <span className="file-upload-box-hint">PPTX or PDF — maximum 20 MB</span>
              </label>
            </div>
            {errors.file && <span className="form-error">{errors.file}</span>}
          </div>

          <hr className="divider" />

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={saveDraft}>
              Save draft
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>
              Submit Round {round} →
            </button>
          </div>
          {existingSubmission?.status === 'submitted' && (
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--error-text)', textDecoration: 'underline' }}
                onClick={handleWithdraw}
              >
                Withdraw this submission
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  )
}
