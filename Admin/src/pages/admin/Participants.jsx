import { useState, useEffect, useMemo } from 'react';
import { getParticipants, getSubmissions, getConfig, putConfig, deleteParticipant, putParticipant } from '../../api';

const PAGE_SIZE = 10;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTeamId(teamId) {
  if (!teamId && teamId !== 0) return '—';
  return `T-${String(teamId).padStart(3, '0')}`;
}

function SubmissionBadge({ status }) {
  if (status === 'submitted') return <span className="badge badge-green">Submitted</span>;
  if (status === 'draft') return <span className="badge badge-amber">Draft</span>;
  return <span className="badge badge-gray">None</span>;
}

export default function Participants() {
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [page, setPage] = useState(1);
  const [finalising, setFinalising] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  useEffect(() => {
    Promise.all([getParticipants(), getSubmissions(), getConfig()])
      .then(([parts, subs, cfg]) => {
        setParticipants(parts);
        setSubmissions(subs);
        setConfig(cfg);
      })
      .finally(() => setLoading(false));
  }, []);

  const finalised = config?.participants_finalised || false;

  function getSubmissionStatus(participantId) {
    const sub = submissions.find(s => s.participant_id === participantId);
    if (!sub) return 'none';
    return sub.status;
  }

  const filtered = useMemo(() => {
    return participants.filter(p => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.enterprise_id.toLowerCase().includes(search.toLowerCase()) ||
        (p.team_name || '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || p.participation_type === typeFilter;
      const subStatus = getSubmissionStatus(p.id);
      const matchStatus = statusFilter === 'all' || subStatus === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [participants, submissions, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleExpand   = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const togglePassword = (id) => setRevealedPasswords(r => ({ ...r, [id]: !r[id] }));

  async function handleDelete(p) {
    if (!window.confirm(`Remove "${p.name}" from the participant list? This cannot be undone.`)) return;
    try {
      await deleteParticipant(p.id);
      setParticipants(prev => prev.filter(x => x.id !== p.id));
    } catch {
      alert('Failed to remove participant.');
    }
  }

  async function handleDisqualify(p) {
    const isDisq = p.disqualified || false;
    const msg = isDisq
      ? `Reinstate "${p.team_name || p.name}"? They will be visible in results again.`
      : `Disqualify "${p.team_name || p.name}"? They will be flagged and hidden from leaderboards.`;
    if (!window.confirm(msg)) return;
    try {
      const updated = await putParticipant(p.id, { ...p, disqualified: !isDisq });
      setParticipants(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch {
      alert('Failed to update participant.');
    }
  }

  async function handleToggleFinalise() {
    if (!config) return;
    setFinalising(true);
    try {
      const updated = await putConfig({ ...config, participants_finalised: !finalised });
      setConfig(updated);
    } catch {
      alert('Failed to update finalise status.');
    } finally {
      setFinalising(false);
    }
  }

  const handleExport = () => {
    const headers = ['Team ID', 'Team Name', 'Name', 'Enterprise ID', 'Email', 'Skill', 'Member Type', 'Member Name', 'Participation Type', 'Project Name', 'Project Lead', 'Registered At', 'Submission Status'];
    const rows = [];
    participants.forEach(p => {
      const subStatus = getSubmissionStatus(p.id);
      const teamId = formatTeamId(p.team_id);
      const teamName = p.team_name || '';
      rows.push([
        teamId, teamName,
        p.name, p.enterprise_id, p.email || '', p.primary_skill || '', p.member_type || '',
        '',
        p.participation_type, p.project_name || '', p.project_lead || '',
        p.registered_at, subStatus,
      ]);
      (p.team_members || []).forEach(m => {
        rows.push([
          teamId, teamName,
          p.name, p.enterprise_id, p.email || '', p.primary_skill || '', p.member_type || '',
          m.name || '',
          p.participation_type, p.project_name || '', p.project_lead || '',
          p.registered_at, subStatus,
        ]);
      });
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'participants.csv'; a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Participants</div>
          <div className="page-subtitle">Manage registered participants</div>
        </div>
        <button
          className={`btn btn-sm ${finalised ? 'btn-ghost' : 'btn-primary'}`}
          onClick={handleToggleFinalise}
          disabled={finalising}
        >
          {finalised ? '🔓 Unfinalise list' : '✓ Finalise participants'}
        </button>
      </div>

      {finalised && (
        <div style={{
          background: 'var(--success-bg)', color: 'var(--success-text)',
          border: '1px solid #A8D5B5', borderRadius: 8,
          padding: '10px 16px', fontSize: 13, fontWeight: 700,
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ✓ Participant list is finalised and reflected in JuryArena and the Judging Portal.
          Editing is disabled — click "Unfinalise list" to make changes.
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-search">
          <input
            className="form-control"
            placeholder="Search by name, enterprise ID or team name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="form-control" style={{ width: 'auto' }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="all">All types</option>
          <option value="team">Team</option>
          <option value="solo">Solo</option>
        </select>
        <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All status</option>
          <option value="submitted">Submitted</option>
          <option value="draft">Draft</option>
          <option value="none">No submission</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
          Showing {filtered.length} of {participants.length}
        </span>
        <button className="btn btn-secondary" onClick={handleExport}>Export CSV</button>
      </div>

      <div className="section-card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Team ID</th>
                <th>Team Name</th>
                <th>Name</th>
                <th>Enterprise ID</th>
                <th>Email</th>
                <th>Skill</th>
                <th>Type</th>
                <th>Submission</th>
                <th>Registered</th>
                <th>Password</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={11} className="no-results">No participants found</td></tr>
              )}
              {paged.map(p => {
                const subStatus = getSubmissionStatus(p.id);
                const isExpanded = expanded[p.id];
                const totalMembers = (p.team_members || []).length + 1;
                return (
                  <>
                    <tr key={p.id}>
                      <td className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        {formatTeamId(p.team_id)}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {p.team_name || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.name}
                          {p.disqualified && <span className="badge badge-red" style={{ fontSize: 9 }}>DQ</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.member_type || 'Project lead'}</div>
                      </td>
                      <td className="mono">{p.enterprise_id}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.email}</td>
                      <td style={{ fontSize: 12 }}>{p.primary_skill}</td>
                      <td>
                        {p.participation_type === 'team'
                          ? <span className="badge badge-purple">Team·{totalMembers}</span>
                          : <span className="badge badge-gray">Solo</span>
                        }
                      </td>
                      <td><SubmissionBadge status={subStatus} /></td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(p.registered_at)}</td>
                      <td>
                        {p.password ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {revealedPasswords[p.id] ? (
                              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-color)' }}>
                                {p.password}
                              </span>
                            ) : (
                              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>••••••</span>
                            )}
                            <button
                              className="btn btn-sm btn-ghost"
                              style={{ fontSize: 11, padding: '3px 8px' }}
                              onClick={() => togglePassword(p.id)}
                              title={revealedPasswords[p.id] ? 'Hide password' : 'Reveal password'}
                            >
                              {revealedPasswords[p.id] ? '🙈 Hide' : '👁 Show'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {p.participation_type === 'team' && (p.team_members || []).length > 0 && (
                            <button className="btn btn-sm btn-secondary" onClick={() => toggleExpand(p.id)}>
                              {isExpanded ? '▴ Team' : '▾ Team'}
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ color: p.disqualified ? 'var(--success-text)' : 'var(--warning-text)', fontSize: 11 }}
                            onClick={() => handleDisqualify(p)}
                          >
                            {p.disqualified ? '✓ Reinstate' : '⚑ Disqualify'}
                          </button>
                          {!finalised && (
                            <button
                              className="btn btn-sm btn-ghost"
                              style={{ color: 'var(--error-text)' }}
                              onClick={() => handleDelete(p)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (p.team_members || []).map((m, i) => (
                      <tr key={`${p.id}-m-${i}`} className="sub-row">
                        <td colSpan={11}>
                          <div className="sub-row-content">
                            <div className="team-member-row">
                              <span style={{ color: 'var(--text-tertiary)', marginRight: 6 }}>└</span>
                              <span>{m.name}</span>
                              <span style={{ color: 'var(--text-tertiary)', margin: '0 4px' }}>·</span>
                              <span className="monospace">{m.enterprise_id}</span>
                              {m.primary_skill && (
                                <>
                                  <span style={{ color: 'var(--text-tertiary)', margin: '0 4px' }}>·</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{m.primary_skill}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination" style={{ padding: '12px 16px' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} className={n === page ? 'active' : ''} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
