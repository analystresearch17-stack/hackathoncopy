import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Discovery from './pages/Discovery'
import Register from './pages/Register'
import Login from './pages/Login'
import Resources from './pages/Resources'
import Submit from './pages/Submit'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Discovery />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/submit" element={<Submit />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
