import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import JudgeLogin from './pages/JudgeLogin'
import JudgeHome from './pages/JudgeHome'
import ToastContainer from './components/Toast'

function ProtectedRoute({ children }) {
  const auth = localStorage.getItem('ha_judge_auth')
  if (!auth) return <Navigate to="/judge/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/judge/login" replace />} />
        <Route path="/judge/login" element={<JudgeLogin />} />
        <Route path="/judge/home" element={
          <ProtectedRoute>
            <JudgeHome />
          </ProtectedRoute>
        } />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
