import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { session, isAdmin, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return children
}
