import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar({ boardTitle, boardId }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className="h-14 border-b border-white/8 bg-surface-900/80 backdrop-blur-md flex items-center px-4 gap-4 sticky top-0 z-40">
      <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 bg-forge-600 rounded-md flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM11 11v-2M11 9h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-white font-display font-semibold text-base tracking-tight hidden sm:block">FlowForge</span>
      </Link>

      {boardTitle && (
        <>
          <span className="text-white/20">/</span>
          <span className="text-white/70 text-sm truncate max-w-48">{boardTitle}</span>
          {boardId && (
            <Link to={`/board/${boardId}/analytics`}
              className="ml-auto mr-2 text-white/50 hover:text-white/80 text-sm transition-colors flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 14V8M6 14V5M10 14V9M14 14V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Analytics
            </Link>
          )}
        </>
      )}

      <div className={`${boardTitle && boardId ? '' : 'ml-auto'} flex items-center gap-2`}>
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
          <div className="w-6 h-6 bg-forge-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-white/70 text-sm hidden sm:block">{user?.name}</span>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-sm px-3 py-1.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </nav>
  )
}
