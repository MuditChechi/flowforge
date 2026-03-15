import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { boardsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']

function CreateBoardModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '', color: COLORS[0] })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await onCreate(form) } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-md p-6">
        <h2 className="text-lg font-display font-semibold text-white mb-4">New board</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Board name</label>
            <input className="input" required placeholder="e.g. Sprint 12, Product Roadmap..."
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Description (optional)</label>
            <input className="input" placeholder="What's this board for?"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button type="button" key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 relative"
                  style={{ backgroundColor: c }}>
                  {form.color === c && <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    boardsAPI.getAll()
      .then(res => setBoards(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (form) => {
    const res = await boardsAPI.create(form)
    setBoards(p => [res.data, ...p])
    setShowCreate(false)
    navigate(`/board/${res.data._id}`)
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-semibold text-white">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-white/40 text-sm mt-1">{boards.length} board{boards.length !== 1 ? 's' : ''} in your workspace</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New board
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-36 animate-pulse bg-white/3" />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-white/20"/>
                <rect x="15" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-white/20"/>
                <rect x="3" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-white/20"/>
                <path d="M20 17v6M17 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-forge-400"/>
              </svg>
            </div>
            <h3 className="text-white/60 font-medium mb-1">No boards yet</h3>
            <p className="text-white/30 text-sm mb-4">Create your first board to get started</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">Create a board</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map(board => (
              <Link key={board._id} to={`/board/${board._id}`}
                className="card p-5 hover:bg-white/8 transition-all duration-150 group block">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-semibold text-lg shrink-0"
                    style={{ backgroundColor: board.color + '33', color: board.color }}>
                    {board.title[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-medium truncate group-hover:text-forge-300 transition-colors">{board.title}</h3>
                    {board.description && <p className="text-white/40 text-xs mt-0.5 truncate">{board.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <span>{board.members?.length || 1} member{board.members?.length !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                  {board.owner?._id === user?._id && (
                    <><span>·</span><span className="text-forge-400">Owner</span></>
                  )}
                </div>
              </Link>
            ))}
            <button onClick={() => setShowCreate(true)}
              className="card p-5 border-dashed border-white/10 hover:border-forge-500/50 hover:bg-forge-600/5 transition-all duration-150 flex flex-col items-center justify-center gap-2 text-white/30 hover:text-forge-400 group">
              <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-forge-600/10 flex items-center justify-center transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-sm font-medium">New board</span>
            </button>
          </div>
        )}
      </div>
      {showCreate && <CreateBoardModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  )
}
