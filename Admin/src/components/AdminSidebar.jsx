import { NavLink, useNavigate } from 'react-router-dom';

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('ha_admin_auth');
    navigate('/admin/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">HackerArena</div>
      <nav className="sidebar-nav">

        <div className="sidebar-section-label">HackerArena</div>
        <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          Dashboard
        </NavLink>
        <NavLink to="/admin/setup" className={({ isActive }) => isActive ? 'active' : ''}>
          Hackathon setup
        </NavLink>
        <NavLink to="/admin/participants" className={({ isActive }) => isActive ? 'active' : ''}>
          Participants
        </NavLink>
        <NavLink to="/admin/submissions" className={({ isActive }) => isActive ? 'active' : ''}>
          Submissions
        </NavLink>

        <hr className="sidebar-section-divider" />
        <div className="sidebar-section-label">JuryArena</div>
        <NavLink to="/admin/judge-dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          Judge Dashboard
        </NavLink>
        <NavLink to="/admin/judge-setup" className={({ isActive }) => isActive ? 'active' : ''}>
          Judge Setup
        </NavLink>

      </nav>
      <div className="sidebar-logout">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </aside>
  );
}
