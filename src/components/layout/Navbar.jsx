import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [burgerOpen, setBurgerOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function closeAll() {
    setAvatarOpen(false)
    setBurgerOpen(false)
  }

  return (
    <nav className="w-full" style={{ backgroundColor: '#1a365d' }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between relative">

        {/* Mobile: hamburger button — hidden on md+ */}
        {user && (
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => { setBurgerOpen(o => !o); setAvatarOpen(false) }}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {burgerOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        )}

        {/* Desktop left: app label — hidden on mobile */}
        <span className="hidden md:block text-white text-sm font-medium tracking-wide">Dosing Calculator</span>

        {/* Centre: logo */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2" onClick={closeAll}>
          <img src="/simini-logo.png" alt="Simini" className="h-8 object-contain" />
        </Link>

        {/* Right: desktop nav links + avatar */}
        {user && (
          <div className="flex items-center gap-4 relative">
            {/* Desktop nav links — hidden on mobile */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="text-blue-200 hover:text-white text-sm">Patient Input</Link>
              <Link to="/drugs" className="text-blue-200 hover:text-white text-sm">Drug Library</Link>
              {isAdmin && (
                <Link to="/logs" className="text-blue-200 hover:text-white text-sm">Logs</Link>
              )}
              <Link to="/team" className="text-blue-200 hover:text-white text-sm">Team</Link>
            </div>

            {/* Avatar button */}
            <button
              onClick={() => { setAvatarOpen(o => !o); setBurgerOpen(false) }}
              className="w-8 h-8 rounded-full bg-blue-400 text-white text-sm font-semibold flex items-center justify-center focus:outline-none"
            >
              {profile?.full_name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
            </button>

            {/* Avatar dropdown */}
            {avatarOpen && (
              <div className="absolute right-0 top-10 w-44 bg-white rounded shadow-lg py-1 z-50">
                <Link to="/settings" onClick={closeAll} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile hamburger dropdown */}
      {user && burgerOpen && (
        <div className="md:hidden border-t border-blue-800 px-4 py-2 space-y-1" style={{ backgroundColor: '#1a365d' }}>
          <Link to="/" onClick={closeAll} className="block py-2 text-blue-200 hover:text-white text-sm">Patient Input</Link>
          <Link to="/drugs" onClick={closeAll} className="block py-2 text-blue-200 hover:text-white text-sm">Drug Library</Link>
          {isAdmin && (
            <Link to="/logs" onClick={closeAll} className="block py-2 text-blue-200 hover:text-white text-sm">Logs</Link>
          )}
          <Link to="/team" onClick={closeAll} className="block py-2 text-blue-200 hover:text-white text-sm">Team</Link>
          <Link to="/settings" onClick={closeAll} className="block py-2 text-blue-200 hover:text-white text-sm">Settings</Link>
          <button onClick={handleSignOut} className="block w-full text-left py-2 text-blue-200 hover:text-white text-sm">Sign out</button>
        </div>
      )}
    </nav>
  )
}
