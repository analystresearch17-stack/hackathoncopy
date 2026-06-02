import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getConfig, getParticipants, getSubmissions } from '../../api';
import Countdown from '../../components/Countdown';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminDashboard() {
  const [config, setConfig] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getConfig(), getParticipants(), getSubmissions()])
      .then(([cfg, parts, subs]) => {
        setConfig(cfg);
        setParticipants(parts);
        setSubmissions(subs);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>;
  if (!config) return null;

  const teams = participants.filter(p => p.participation_type === 'team').length;
  const submitted = submissions.filter(s => s.status === 'submitted').length;

  function getPhase(cfg) {
    if (cfg.round_2_open)            return { label: 'Round 2 in Progress',         color: '#1A56DB', bg: '#E8F0FE', icon: '🔵' }
    if (cfg.submissions_open)        return { label: 'Round 1 Submissions Open',     color: '#1E7E34', bg: '#E6F4EA', icon: '🟢' }
    if (cfg.registration_open)       return { label: 'Registration Open',            color: '#1E7E34', bg: '#E6F4EA', icon: '🟢' }
    if (cfg.participants_finalised)  return { label: 'Judging in Progress',          color: '#B45309', bg: '#FFF8E1', icon: '🟠' }
    return                                   { label: 'Setup / Not Started',         color: '#505050', bg: '#F5F5F5', icon: '⚪' }
  }
  const phase = getPhase(config);

  const now = new Date();
  const start = new Date(config.hackathon_start);
  const end = new Date(config.hackathon_end);
  let hackathonStatus = 'Not started';
  let hackathonBadge = 'badge-gray';
  if (now >= start && now <= end) { hackathonStatus = 'Live'; hackathonBadge = 'badge-live'; }
  else if (now > end) { hackathonStatus = 'Ended'; hackathonBadge = 'badge-gray'; }

  const recentParticipants = [...participants].slice(-4).reverse();
  const recentSubmissions = [...submissions].slice(-4).reverse();

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">{config.name}</div>
      </div>

      {/* Phase indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderRadius: 8, marginBottom: 20,
        background: phase.bg, border: `1px solid ${phase.color}33`,
      }}>
        <span style={{ fontSize: 16 }}>{phase.icon}</span>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13, color: phase.color }}>Current phase: </span>
          <span style={{ fontWeight: 600, fontSize: 13, color: phase.color }}>{phase.label}</span>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-label">Registered</div>
          <div className="stat-card-value">{participants.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Teams</div>
          <div className="stat-card-value">{teams}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Submissions</div>
          <div className="stat-card-value">{submitted}</div>
        </div>
        <div>
          <Countdown targetDate={config.submission_deadline} expiredLabel="Closed" />
          <div className="stat-card-sub" style={{ marginTop: 8 }}>Submission deadline</div>
        </div>
      </div>

      <div className="status-row" style={{ marginBottom: 24 }}>
        <span className="status-row-label">Status:</span>
        <span className={`badge ${config.registration_open ? 'badge-green' : 'badge-gray'}`}>
          Registration: {config.registration_open ? 'Open' : 'Closed'}
        </span>
        <span className={`badge ${hackathonBadge}`}>
          Hackathon: {hackathonStatus}
        </span>
        <span className={`badge ${config.submissions_open ? 'badge-green' : 'badge-gray'}`}>
          Submissions: {config.submissions_open ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="two-panel">
        <div className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Recent registrations</div>
            <Link to="/admin/participants" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentParticipants.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    {p.participation_type === 'team'
                      ? <span className="badge badge-purple">Team·{p.team_members.length + 1}</span>
                      : <span className="badge badge-gray">Solo</span>
                    }
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(p.registered_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Recent submissions</div>
            <Link to="/admin/submissions" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.map(s => {
                const participant = participants.find(p => p.id === s.participant_id);
                return (
                  <tr key={s.id}>
                    <td>
                      <div>{s.project_title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{participant?.name}</div>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'submitted' ? 'badge-green' : 'badge-amber'}`}>
                        {s.status === 'submitted' ? 'Submitted' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{timeAgo(s.submitted_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
