import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getConfig } from '../api'

function formatDate(val) {
  if (!val) return null
  return new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function stageStatus(dateVal) {
  if (!dateVal) return 'pending'
  const d = new Date(dateVal).getTime()
  const now = Date.now()
  if (now > d) return 'done'
  if (now > d - 7 * 24 * 60 * 60 * 1000) return 'active' // within 7 days
  return 'pending'
}

export default function Discovery() {
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  const auth = (() => {
    try { return JSON.parse(localStorage.getItem('ha_participant_auth')) } catch { return null }
  })()

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .finally(() => setLoading(false))
  }, [])

  function getRedirectTarget() {
    if (!auth || !config) return '/register'
    if (config.round_2_open && (config.round_2_teams || []).includes(auth.id)) {
      return `/submit?eid=${encodeURIComponent(auth.enterprise_id)}&round=2`
    }
    if (config.submissions_open) {
      return `/submit?eid=${encodeURIComponent(auth.enterprise_id)}&round=1`
    }
    return `/resources?eid=${encodeURIComponent(auth.enterprise_id)}`
  }

  if (loading) return (
    <>
      <Navbar>
        {!auth && <button className="btn-primary" onClick={() => navigate('/register')}>Register</button>}
      </Navbar>
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
    </>
  )

  if (!config) return null

  const now = Date.now()
  let status
  if (now < new Date(config.registration_deadline).getTime()) status = 'open'
  else if (now < new Date(config.hackathon_end).getTime()) status = 'live'
  else status = 'ended'

  const statusBadge = {
    open:  { cls: 'badge-green', label: 'Open' },
    live:  { cls: 'badge-live',  label: 'Live' },
    ended: { cls: 'badge-gray',  label: 'Ended' },
  }[status]

  const timelineStages = [
    { label: 'Registration', date: config.registration_deadline },
    { label: 'Round 1',      date: config.round_1_date },
    { label: 'Round 2',      date: config.round_2_date },
    { label: 'Results',      date: config.results_date },
  ]

  return (
    <>
      <Navbar>
        {!auth && (
          <button className="btn-primary" onClick={() => navigate('/register')}>
            Register
          </button>
        )}
      </Navbar>

      {/* ── Hero ── */}
      <div className="disco-hero">
        <div className="disco-hero-inner">
          <div className="disco-hero-meta">
            <span className="disco-hero-organiser">{config.organiser}</span>
            <span className={`badge ${statusBadge.cls}`}>{statusBadge.label}</span>
            {config.theme && <span className="badge badge-theme">{config.theme}</span>}
          </div>
          <h1 className="disco-hero-name">{config.name}</h1>
          {config.tagline && <p className="disco-hero-tagline">{config.tagline}</p>}
          {auth ? (
            <button className="btn-primary disco-hero-cta" onClick={() => navigate(getRedirectTarget())}>
              Continue →
            </button>
          ) : (
            <button className="btn-primary disco-hero-cta" onClick={() => navigate('/register')}>
              Register now →
            </button>
          )}
        </div>
      </div>

      <div className="disco-page">

        {/* ── Description ── */}
        {config.description?.trim() && (
          <div className="disco-section">
            <div className="disco-section-label">About this hackathon</div>
            <p className="disco-body-text">{config.description}</p>
          </div>
        )}

        {/* ── Timeline ── */}
        <div className="disco-section">
          <div className="disco-section-label">Timeline</div>
          <div className="disco-timeline">
            {timelineStages.map((stage, i) => {
              const s = stageStatus(stage.date)
              return (
                <div key={stage.label} className="disco-timeline-item">
                  {/* connector line before node (skip first) */}
                  {i > 0 && (
                    <div className={`disco-timeline-line ${
                      stageStatus(timelineStages[i - 1].date) === 'done' ? 'line-done' : ''
                    }`} />
                  )}
                  <div className={`disco-timeline-node node-${s}`}>
                    {s === 'done' ? '✓' : i + 1}
                  </div>
                  <div className="disco-timeline-info">
                    <div className="disco-timeline-stage">{stage.label}</div>
                    <div className="disco-timeline-date">
                      {formatDate(stage.date) || <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>TBD</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Eligibility ── */}
        {config.eligibility_criteria?.trim() && (
          <div className="disco-section">
            <div className="disco-section-label">Eligibility criteria</div>
            <p className="disco-body-text">{config.eligibility_criteria}</p>
          </div>
        )}

      </div>
    </>
  )
}
