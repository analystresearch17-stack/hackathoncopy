import { useState, useEffect, useMemo } from 'react';
import { getParticipants, getSubmissions } from '../../api';
import { useToast } from '../../components/Toast';

const PAGE_SIZE = 10;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  if (status === 'submitted') return <span className="badge badge-green">Submitted</span>;
  if (status === 'draft') return <span className="badge badge-amber">Draft</span>;
  return <span className="badge badge-gray">None</span>;
}

function RoundBadge({ round }) {
  const r = round || 1;
  return (
    <span className={`badge ${r === 1 ? 'badge-purple' : 'badge-green'}`} style={{ fontSize: 11 }}>
      Round {r}
    </span>
  );
}

function Drawer({ submission, participant, onClose }) {
  const { show } = useToast();
  if (!submission) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <button className="drawer-close" onClick={onClose}>✕</button>
        <div className="drawer-title">{submission.use_case || submission.project_title}</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <StatusBadge status={submission.status} />
          <RoundBadge round={submission.round} />
        </div>

        <div className="drawer-field">
          <div className="drawer-field-label">Participant</div>
          <div className="drawer-field-value">{participant?.name}</div>
          <div style={{ marginTop: 2 }}>
            {participant?.participation_type === 'team'
              ? <span className="badge badge-purple">Team·{(participant?.team_members?.length || 0) + 1}</span>
              : <span className="badge badge-gray">Solo</span>
            }
          </div>
        </div>

        <div className="drawer-field">
          <div className="drawer-field-label">Submitted at</div>
          <div className="drawer-field-value">{formatDate(submission.submitted_at)}</div>
        </div>

        <div className="drawer-field">
          <div className="drawer-field-label">Description</div>
          <div className="drawer-field-value" style={{ lineHeight: 1.5 }}>{submission.description || '—'}</div>
        </div>

        <div className="drawer-field">
          <div className="drawer-field-label">Links</div>
          {submission.links?.length
            ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                {submission.links.map((link, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {link.title && (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {link.title}
                      </span>
                    )}
                    <a href={link.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 13, wordBreak: 'break-all' }}>
                      {link.url}
                    </a>
                  </div>
                ))}
              </div>
            )
            : (
              /* legacy fallback for older submissions that stored github_url / demo_url */
              submission.github_url || submission.demo_url
                ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                    {submission.github_url && (
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>GitHub</span>
                        <div><a href={submission.github_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 13, wordBreak: 'break-all' }}>{submission.github_url}</a></div>
                      </div>
                    )}
                    {submission.demo_url && (
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Demo</span>
                        <div><a href={submission.demo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 13, wordBreak: 'break-all' }}>{submission.demo_url}</a></div>
                      </div>
                    )}
                  </div>
                )
                : <div className="drawer-field-value">—</div>
            )
          }
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!submission.filename}
            onClick={() => show('Downloading deck...', 'info')}
          >
            Download deck{!submission.filename ? ' (none)' : ''}
          </button>
        </div>
      </div>
    </>
  );
}

export default function Submissions() {
  const { show } = useToast();
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [drawerSub, setDrawerSub] = useState(null);

  useEffect(() => {
    Promise.all([getParticipants(), getSubmissions()])
      .then(([parts, subs]) => {
        setParticipants(parts);
        setSubmissions(subs);
      })
      .finally(() => setLoading(false));
  }, []);

  const enriched = useMemo(() => {
    return submissions
      .filter(s => participants.some(p => p.id === s.participant_id)) // skip orphaned (deleted participant)
      .map(s => ({
        ...s,
        participant: participants.find(p => p.id === s.participant_id),
      }));
  }, [submissions, participants]);

  const filtered = useMemo(() => {
    return enriched.filter(s => {
      const useCaseOrTitle = s.use_case || s.project_title || '';
      const matchSearch = !search ||
        useCaseOrTitle.toLowerCase().includes(search.toLowerCase()) ||
        (s.participant?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchRound = roundFilter === 'all' || (s.round || 1) === parseInt(roundFilter, 10);
      return matchSearch && matchStatus && matchRound;
    });
  }, [enriched, search, statusFilter, roundFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const r1submitted = submissions.filter(s => s.status === 'submitted' && (s.round || 1) === 1).length;
  const r2submitted = submissions.filter(s => s.status === 'submitted' && (s.round || 1) === 2).length;
  const draftCount  = submissions.filter(s => s.status === 'draft').length;

  const drawerParticipant = drawerSub ? participants.find(p => p.id === drawerSub.participant_id) : null;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Submissions</div>
        <div className="page-subtitle">Review project submissions</div>
      </div>

      <div className="stat-cards-3">
        <div className="stat-card">
          <div className="stat-card-label">Round 1 submitted</div>
          <div className="stat-card-value">{r1submitted}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Round 2 submitted</div>
          <div className="stat-card-value">{r2submitted}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Draft</div>
          <div className="stat-card-value">{draftCount}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <input
            className="form-control"
            placeholder="Search by use case or participant…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="form-control" style={{ width: 'auto' }} value={roundFilter} onChange={e => { setRoundFilter(e.target.value); setPage(1); }}>
          <option value="all">All rounds</option>
          <option value="1">Round 1</option>
          <option value="2">Round 2</option>
        </select>
        <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All status</option>
          <option value="submitted">Submitted</option>
          <option value="draft">Draft</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
          Showing {filtered.length} of {submissions.length}
        </span>
        <button className="btn btn-secondary" onClick={() => show('Preparing download...', 'info')}>
          Bulk download all
        </button>
      </div>

      <div className="section-card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Use case</th>
                <th>Round</th>
                <th>Participant</th>
                <th>Status</th>
                <th>Submitted at</th>
                <th>Files</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={7} className="no-results">No submissions found</td></tr>
              )}
              {paged.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.use_case || s.project_title || '—'}</td>
                  <td><RoundBadge round={s.round} /></td>
                  <td>
                    <div>{s.participant?.name}</div>
                    <div style={{ marginTop: 2 }}>
                      {s.participant?.participation_type === 'team'
                        ? <span className="badge badge-purple" style={{ fontSize: 10 }}>Team·{(s.participant?.team_members?.length || 0) + 1}</span>
                        : <span className="badge badge-gray" style={{ fontSize: 10 }}>Solo</span>
                      }
                    </div>
                  </td>
                  <td><StatusBadge status={s.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(s.submitted_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-sm btn-outline-purple"
                        disabled={!s.filename}
                        onClick={() => show('Downloading deck...', 'info')}
                      >
                        Deck
                      </button>
                      {(() => {
                        const linkCount = s.links?.length || (s.github_url ? 1 : 0) + (s.demo_url ? 1 : 0);
                        return (
                          <button
                            className="btn btn-sm btn-secondary"
                            disabled={!linkCount}
                            onClick={() => setDrawerSub(s)}
                            title={linkCount ? `${linkCount} link${linkCount !== 1 ? 's' : ''}` : 'No links'}
                          >
                            {linkCount ? `Links (${linkCount})` : 'Links'}
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => setDrawerSub(s)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
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

      {drawerSub && (
        <Drawer
          submission={drawerSub}
          participant={drawerParticipant}
          onClose={() => setDrawerSub(null)}
        />
      )}
    </div>
  );
}
