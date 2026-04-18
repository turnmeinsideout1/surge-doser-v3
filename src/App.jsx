import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CalculatorPage from './pages/CalculatorPage'
import DrugLibraryPage from './pages/DrugLibraryPage'
import LogsPage from './pages/LogsPage'
import SettingsPage from './pages/SettingsPage'
import TeamPage from './pages/TeamPage'

const queryClient = new QueryClient()

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { path: '/', element: <CalculatorPage /> },
      { path: '/drugs', element: <DrugLibraryPage /> },
      { path: '/logs', element: <ProtectedRoute adminOnly><LogsPage /></ProtectedRoute> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/team', element: <TeamPage /> },
    ],
  },
])

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
