import { useState, useEffect } from 'react';
import { getConfig, putConfig } from '../../api';
import { useToast } from '../../components/Toast';

const THEME_OPTIONS = ['AI / ML', 'Web3', 'Sustainability', 'FinTech', 'HealthTech', 'Open'];

export default function HackathonSetup() {
  const { show } = useToast();
  const [config, setConfig] = useState(null);
  const [savedConfig, setSavedConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Attachment draft state (reset on tab change)
  const [showAttForm, setShowAttForm] = useState(false);
  const [attDraft, setAttDraft] = useState({ name: '', url: '' });
  const [attErrors, setAttErrors] = useState({});

  useEffect(() => {
    getConfig()
      .then(cfg => {
        const withDefaults = {
          ...cfg,
          description: cfg.description || '',
          eligibility_criteria: cfg.eligibility_criteria || '',
          round_1_date: cfg.round_1_date || '',
          round_2_date: cfg.round_2_date || '',
          // Normalise: ensure attachments array exists on every use case
          use_cases: (cfg.use_cases || []).map(uc => ({ ...uc, attachments: uc.attachments || [] })),
        };
        setConfig(withDefaults);
        setSavedConfig(withDefaults);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>;
  if (!config) return null;

  // Safe active tab index (guards against deletion making it out-of-bounds)
  const safeTab = Math.min(activeTab, Math.max(config.use_cases.length - 1, 0));
  const activeUC = config.use_cases[safeTab];

  const set = (key, value) => setConfig(c => ({ ...c, [key]: value }));

  // ── Use case helpers ──────────────────────────────────
  function updateUseCase(index, field, value) {
    setConfig(c => ({
      ...c,
      use_cases: c.use_cases.map((uc, i) => i === index ? { ...uc, [field]: value } : uc),
    }));
  }

  function addUseCase() {
    const newIdx = config.use_cases.length;
    const newUC = {
      id: Date.now(),
      title: `Use case ${newIdx + 1}`,
      content: '',
      attachments: [],
    };
    setConfig(c => ({ ...c, use_cases: [...c.use_cases, newUC] }));
    setActiveTab(newIdx);
    resetAttForm();
  }

  function removeUseCase(index) {
    if (!window.confirm(`Delete "${config.use_cases[index].title}"? This cannot be undone.`)) return;
    setConfig(c => ({ ...c, use_cases: c.use_cases.filter((_, i) => i !== index) }));
    setActiveTab(t => Math.min(t, Math.max(config.use_cases.length - 2, 0)));
    resetAttForm();
  }

  function switchTab(i) {
    setActiveTab(i);
    resetAttForm();
  }

  // ── Attachment helpers ────────────────────────────────
  function resetAttForm() {
    setShowAttForm(false);
    setAttDraft({ name: '', url: '' });
    setAttErrors({});
  }

  function addAttachment(ucIndex) {
    const errs = {};
    if (!attDraft.name.trim()) errs.name = 'Name is required';
    if (!attDraft.url.trim())  errs.url  = 'URL is required';
    else if (!/^https?:\/\/.+/.test(attDraft.url.trim())) errs.url = 'Must be a valid URL (start with http/https)';
    if (Object.keys(errs).length) { setAttErrors(errs); return; }

    const att = { id: Date.now(), name: attDraft.name.trim(), url: attDraft.url.trim() };
    setConfig(c => ({
      ...c,
      use_cases: c.use_cases.map((uc, i) =>
        i === ucIndex ? { ...uc, attachments: [...(uc.attachments || []), att] } : uc
      ),
    }));
    resetAttForm();
  }

  function removeAttachment(ucIndex, attId) {
    setConfig(c => ({
      ...c,
      use_cases: c.use_cases.map((uc, i) =>
        i === ucIndex ? { ...uc, attachments: (uc.attachments || []).filter(a => a.id !== attId) } : uc
      ),
    }));
  }

  // ── Toggle / Save / Discard ───────────────────────────
  const handleToggle = async (key) => {
    const newConfig = { ...config, [key]: !config[key] };
    setConfig(newConfig);
    setSavedConfig(newConfig);
    try {
      await putConfig(newConfig);
      show('Setting updated', 'success');
    } catch {
      show('Failed to save setting', 'error');
      setConfig(config);
      setSavedConfig(savedConfig);
    }
  };

  const handleSave = async () => {
    try {
      await putConfig(config);
      setSavedConfig(config);
      show('Changes saved', 'success');
    } catch {
      show('Failed to save changes', 'error');
    }
  };

  const handleDiscard = () => {
    setConfig({ ...savedConfig });
    setActiveTab(0);
    resetAttForm();
    show('Changes discarded', 'info');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Hackathon setup</div>
        <div className="page-subtitle">Configure your hackathon details and settings</div>
      </div>

      {/* Section 1 — Basic details */}
      <div className="section-card">
        <div className="section-title">Basic details</div>
        <div className="grid-2">
          <div className="form-group">
            <label>Hackathon name</label>
            <input className="form-control" value={config.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Organiser</label>
            <input className="form-control" value={config.organiser} onChange={e => set('organiser', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Theme</label>
            <select className="form-control" value={config.theme} onChange={e => set('theme', e.target.value)}>
              {THEME_OPTIONS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Prize pool</label>
            <input className="form-control" value={config.prize_pool} onChange={e => set('prize_pool', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Max team size</label>
            <input className="form-control" type="number" min={1} max={10} value={config.max_team_size} onChange={e => set('max_team_size', parseInt(e.target.value))} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Tagline</label>
            <textarea className="form-control" rows={2} value={config.tagline} onChange={e => set('tagline', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Description</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describe the hackathon — context, goals, what participants can expect…"
              value={config.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Eligibility criteria</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Who can participate? Any restrictions on role, location, experience level…"
              value={config.eligibility_criteria}
              onChange={e => set('eligibility_criteria', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section 2 — Dates */}
      <div className="section-card">
        <div className="section-title">Dates &amp; deadlines</div>
        <div className="grid-2">
          <div className="form-group">
            <label>Registration deadline</label>
            <input className="form-control" type="datetime-local" value={config.registration_deadline?.slice(0, 16)} onChange={e => set('registration_deadline', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Round 1 date</label>
            <input className="form-control" type="date" value={config.round_1_date} onChange={e => set('round_1_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Round 2 date</label>
            <input className="form-control" type="date" value={config.round_2_date} onChange={e => set('round_2_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Results date</label>
            <input className="form-control" type="date" value={config.results_date} onChange={e => set('results_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hackathon start</label>
            <input className="form-control" type="datetime-local" value={config.hackathon_start?.slice(0, 16)} onChange={e => set('hackathon_start', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Submission deadline</label>
            <input className="form-control" type="datetime-local" value={config.submission_deadline?.slice(0, 16)} onChange={e => set('submission_deadline', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Section 3 — Toggles */}
      <div className="section-card">
        <div className="section-title">Visibility &amp; access</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'registration_open', label: 'Allow new participants to register' },
            { key: 'resources_visible', label: 'Show the resources page after registration' },
            { key: 'submissions_open', label: 'Allow Round 1 submissions' },
            { key: 'round_2_open', label: 'Allow Round 2 submissions' },
          ].map(({ key, label }) => (
            <label key={key} className="toggle-switch" style={{ cursor: 'pointer' }}>
              <div className={`toggle-track ${config[key] ? 'on' : ''}`} onClick={() => handleToggle(key)}>
                <div className="toggle-thumb" />
              </div>
              <span style={{ fontSize: 13 }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Section 4 — Use cases */}
      <div className="section-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Use cases</div>
          <button className="btn btn-sm btn-primary" onClick={addUseCase}>+ Add use case</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, marginTop: 4 }}>
          Add as many use cases as needed. Markdown is supported. Use cases with no content are hidden from participants.
        </p>

        {config.use_cases.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-tertiary)', border: '2px dashed var(--border)', borderRadius: 8, fontSize: 13 }}>
            No use cases yet. Click <strong>+ Add use case</strong> to create the first one.
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 0, flexWrap: 'wrap', gap: 0 }}>
              {config.use_cases.map((uc, i) => (
                <button
                  key={uc.id}
                  type="button"
                  onClick={() => switchTab(i)}
                  style={{
                    padding: '8px 18px',
                    background: 'none',
                    border: 'none',
                    borderBottom: safeTab === i ? '2px solid var(--accent)' : '2px solid transparent',
                    marginBottom: -2,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: safeTab === i ? 600 : 400,
                    color: safeTab === i ? 'var(--accent)' : 'var(--text-secondary)',
                    transition: 'color 0.15s',
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={uc.title}
                >
                  {uc.title || `Use case ${i + 1}`}
                  {uc.content.trim() && (
                    <span style={{
                      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--accent)', marginLeft: 6, verticalAlign: 'middle', opacity: 0.7,
                    }} />
                  )}
                </button>
              ))}
            </div>

            {/* Active tab content */}
            {activeUC && (
              <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: 20 }}>

                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>
                      Use case title
                    </label>
                    <input
                      className="form-control"
                      style={{ fontSize: 14, fontWeight: 600 }}
                      value={activeUC.title}
                      onChange={e => updateUseCase(safeTab, 'title', e.target.value)}
                      placeholder="e.g. AI in Healthcare"
                    />
                  </div>
                  <button
                    className="btn btn-sm btn-ghost"
                    style={{ color: 'var(--error-text)', marginTop: 20, flexShrink: 0 }}
                    onClick={() => removeUseCase(safeTab)}
                  >
                    🗑 Delete use case
                  </button>
                </div>

                {/* Content textarea */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
                    Content (Markdown)
                  </label>
                  <textarea
                    className="form-control"
                    rows={12}
                    placeholder={`Paste or type content for "${activeUC.title}" here.\nMarkdown is supported — use **bold**, _italic_, ## headings, - lists, etc.`}
                    value={activeUC.content}
                    onChange={e => updateUseCase(safeTab, 'content', e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, resize: 'vertical', marginTop: 6 }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {activeUC.content.length} characters · empty use cases are hidden from participants
                  </div>
                </div>

                {/* Attachments section */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                        Attachments
                      </span>
                      {(activeUC.attachments || []).length > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>
                          {(activeUC.attachments || []).length} file{(activeUC.attachments || []).length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {!showAttForm && (
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ fontSize: 12 }}
                        onClick={() => setShowAttForm(true)}
                      >
                        + Add attachment
                      </button>
                    )}
                  </div>

                  {/* Existing attachments list */}
                  {(activeUC.attachments || []).length === 0 && !showAttForm && (
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', paddingBottom: 4 }}>
                      No attachments yet. Add links to reference documents, briefs, or datasets.
                    </div>
                  )}
                  {(activeUC.attachments || []).map(att => (
                    <div key={att.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', marginBottom: 6,
                      background: 'var(--bg-secondary)', borderRadius: 6,
                      border: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: 16 }}>📎</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {att.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {att.url}
                        </div>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-ghost"
                        style={{ fontSize: 11, flexShrink: 0 }}
                      >
                        Preview ↗
                      </a>
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--error-text)', fontSize: 11, flexShrink: 0 }}
                        onClick={() => removeAttachment(safeTab, att.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {/* Add attachment inline form */}
                  {showAttForm && (
                    <div style={{
                      padding: 14, marginTop: 8,
                      background: 'var(--bg-secondary)', borderRadius: 8,
                      border: '1px dashed var(--border)',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>
                        New attachment
                      </div>
                      <div className="grid-2" style={{ marginBottom: 10 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: 12 }}>Display name *</label>
                          <input
                            className="form-control"
                            style={{ fontSize: 13 }}
                            value={attDraft.name}
                            onChange={e => { setAttDraft(d => ({ ...d, name: e.target.value })); setAttErrors({}); }}
                            placeholder="e.g. Problem Statement.pdf"
                          />
                          {attErrors.name && <span style={{ fontSize: 11, color: 'var(--error-text)' }}>{attErrors.name}</span>}
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: 12 }}>URL *</label>
                          <input
                            className="form-control"
                            style={{ fontSize: 13 }}
                            value={attDraft.url}
                            onChange={e => { setAttDraft(d => ({ ...d, url: e.target.value })); setAttErrors({}); }}
                            placeholder="https://drive.google.com/…"
                          />
                          {attErrors.url && <span style={{ fontSize: 11, color: 'var(--error-text)' }}>{attErrors.url}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => addAttachment(safeTab)}>Add</button>
                        <button className="btn btn-sm btn-ghost" onClick={resetAttForm}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="form-footer">
        <button className="btn btn-secondary" onClick={handleDiscard}>Discard changes</button>
        <button className="btn btn-primary" onClick={handleSave}>Save changes</button>
      </div>
    </div>
  );
}
