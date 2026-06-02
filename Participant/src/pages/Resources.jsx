import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Countdown from '../components/Countdown'
import { getConfig, getParticipantByEid } from '../api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function Resources() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const eid = params.get('eid') || ''

  const [config, setConfig] = useState(null)
  const [participant, setParticipant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (!eid) { setLoading(false); return }
    Promise.all([getConfig(), getParticipantByEid(eid)])
      .then(([cfg, parts]) => {
        setConfig(cfg)
        setParticipant(parts[0] || null)
      })
      .finally(() => setLoading(false))
  }, [eid])

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
            Please <Link to="/register">register first</Link> to access the resources.
          </div>
        </div>
      </>
    )
  }

  if (!config.resources_visible) {
    return (
      <>
        <Navbar>
          <span className="participant-name">{participant.name}</span>
        </Navbar>
        <div className="gate-screen">
          <div className="gate-icon">📦</div>
          <div className="gate-title">Resources not yet available</div>
          <div className="gate-body">Check back closer to the hackathon start date.</div>
        </div>
      </>
    )
  }

  const visibleUseCases = (config.use_cases || []).filter(uc => uc.content?.trim())

  // Clamp active tab if tabs changed
  const safeTab = Math.min(activeTab, Math.max(visibleUseCases.length - 1, 0))

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
          <div className="page-title">Resources</div>
          <div className="page-subtitle">{config.name} · {config.organiser}</div>
        </div>

        <Countdown
          targetDate={config.hackathon_start}
          label="Hackathon starts in"
          expiredLabel="Hackathon is underway!"
        />

        {visibleUseCases.length === 0 ? (
          <div style={{
            padding: '40px 24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            background: 'var(--surface)',
            borderRadius: 8,
            border: '1px solid var(--border)',
            marginTop: 24,
          }}>
            No use cases have been published yet. Check back soon.
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            {/* Tab bar */}
            <div style={{
              display: 'flex',
              borderBottom: '2px solid var(--border)',
              marginBottom: 0,
              overflowX: 'auto',
            }}>
              {visibleUseCases.map((uc, i) => (
                <button
                  key={uc.id}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    borderBottom: safeTab === i ? '2px solid var(--accent)' : '2px solid transparent',
                    marginBottom: -2,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: safeTab === i ? 600 : 400,
                    color: safeTab === i ? 'var(--accent)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                  }}
                >
                  {uc.title}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{
              padding: '28px 24px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              lineHeight: 1.7,
            }}>
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {visibleUseCases[safeTab]?.content || ''}
                </ReactMarkdown>
              </div>

              {/* Attachments */}
              {(visibleUseCases[safeTab]?.attachments || []).length > 0 && (
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 10,
                  }}>
                    Attachments
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(visibleUseCases[safeTab].attachments).map(att => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 8,
                          textDecoration: 'none',
                          color: 'var(--text-primary)',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      >
                        <span style={{ fontSize: 18, flexShrink: 0 }}>📎</span>
                        <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{att.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>
                          Open ↗
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bottom-link" style={{ marginTop: 32 }}>
          Ready to submit?{' '}
          <Link to={`/submit?eid=${encodeURIComponent(eid)}`}>
            Go to submission page →
          </Link>
        </div>
      </div>
    </>
  )
}
