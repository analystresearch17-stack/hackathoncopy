import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { participantLogin } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [teamName, setTeamName]   = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  // If already logged in, redirect to resources
  const existing = (() => {
    try { return JSON.parse(localStorage.getItem('ha_participant_auth')) } catch { return null }
  })()
  if (existing) {
    navigate('/dashboard', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!teamName.trim()) { setError('Please enter your team name.'); return }
    if (!password)        { setError('Please enter your password.'); return }
    setLoading(true)
    try {
      const result = await participantLogin(teamName.trim(), password)
      localStorage.setItem('ha_participant_auth', JSON.stringify(result.participant))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid team name or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="participant-login-wrap">
        <div className="participant-login-card">
          <div className="participant-login-logo">HackerArena</div>
          <div className="participant-login-subtitle">Participant Login</div>

          {error && <div className="login-error-box">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">
                Team name <span className="required">*</span>
              </label>
              <input
                className="form-input"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Your team name (username)"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Login →'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
            Not registered yet?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Register here
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
