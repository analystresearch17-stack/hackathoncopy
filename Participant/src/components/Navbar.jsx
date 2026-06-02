import { Link, useNavigate } from 'react-router-dom'

export default function Navbar({ children }) {
  const navigate = useNavigate()

  const auth = (() => {
    try { return JSON.parse(localStorage.getItem('ha_participant_auth')) } catch { return null }
  })()

  function handleLogout() {
    localStorage.removeItem('ha_participant_auth')
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">HackerArena</Link>
      <div className="navbar-right">
        {auth ? (
          <>
            <Link to="/dashboard" className="navbar-user" style={{ textDecoration: 'none', cursor: 'pointer' }}>{auth.team_name}</Link>
            <button className="btn-ghost" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            {children}
            <Link to="/login" className="btn" style={{ padding: '7px 18px', fontSize: 13, letterSpacing: '0.04em' }}>Login</Link>
          </>
        )}
      </div>
    </nav>
  )
}
