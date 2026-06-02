import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import HackathonSetup from './pages/admin/HackathonSetup';
import Participants from './pages/admin/Participants';
import Submissions from './pages/admin/Submissions';
import JudgeDashboard from './pages/admin/JudgeDashboard';
import JudgeSetup from './pages/admin/JudgeSetup';
import AdminSidebar from './components/AdminSidebar';
import ToastContainer from './components/Toast';

function ProtectedRoute({ children }) {
  const auth = localStorage.getItem('ha_admin_auth');
  if (!auth) return <Navigate to="/admin/login" replace />;
  return children;
}

function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/setup" element={
          <ProtectedRoute><AdminLayout><HackathonSetup /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/participants" element={
          <ProtectedRoute><AdminLayout><Participants /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/submissions" element={
          <ProtectedRoute><AdminLayout><Submissions /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/judge-dashboard" element={
          <ProtectedRoute><AdminLayout><JudgeDashboard /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/judge-setup" element={
          <ProtectedRoute><AdminLayout><JudgeSetup /></AdminLayout></ProtectedRoute>
        } />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
