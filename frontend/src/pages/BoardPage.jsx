import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { boardsAPI, tasksAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import KanbanColumn from '../components/board/KanbanColumn'
import TaskCard from '../components/board/TaskCard'
import TaskModal from '../components/board/TaskModal'

function InviteModal({ boardId, onClose }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await boardsAPI.invite(boardId, { email, role })
      setMsg('Member invited successfully!')
      setEmail('')
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to invite')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-sm p-6">
        <h2 className="text-lg font-display font-semibold text-white mb-4">Invite member</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {msg && <div className={`text-sm rounded-lg px-3 py-2 ${msg.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{msg}</div>}
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Email address</label>
            <input type="email" required className="input" placeholder="teammate@example.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Close</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Inviting...' : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BoardPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [board, setBoard] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showInvite, setShowInvite] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    Promise.all([boardsAPI.get(id), tasksAPI.getByBoard(id)])
      .then(([b, t]) => { setBoard(b.data); setTasks(t.data.tasks || []) })
      .finally(() => setLoading(false))
  }, [id])

  const getTasksByColumn = (columnId) =>
    tasks.filter(t => t.columnId === columnId).sort((a, b) => a.order - b.order)

  const handleAddTask = async (columnId, title) => {
    const res = await tasksAPI.create(id, { title, columnId })
    setTasks(p => [...p, res.data])
  }

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t._id === active.id) || null)
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null)
    if (!over) return

    const activeTask = tasks.find(t => t._id === active.id)
    if (!activeTask) return

    const overId = over.id
    const overTask = tasks.find(t => t._id === overId)
    const targetColumnId = overTask ? overTask.columnId : overId

    if (activeTask.columnId === targetColumnId && !overTask) return

    const newTasks = tasks.map(t => t._id === activeTask._id ? { ...t, columnId: targetColumnId } : t)
    setTasks(newTasks)

    try {
      await tasksAPI.move(activeTask._id, { columnId: targetColumnId, order: overTask?.order ?? 999 })
    } catch { setTasks(tasks) }
  }

  const handleTaskUpdate = (updated) => {
    setTasks(p => p.map(t => t._id === updated._id ? updated : t))
    if (selectedTask?._id === updated._id) setSelectedTask(updated)
  }

  const handleTaskDelete = (taskId) => {
    setTasks(p => p.filter(t => t._id !== taskId))
  }

  if (loading) return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-forge-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!board) return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <p className="text-white/40">Board not found</p>
        <Link to="/dashboard" className="btn-primary">Back to dashboard</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      <Navbar boardTitle={board.title} boardId={id} />

      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5">
        <div className="w-6 h-6 rounded-md" style={{ backgroundColor: board.color }} />
        <h1 className="text-white font-display font-semibold">{board.title}</h1>
        {board.description && <span className="text-white/30 text-sm">— {board.description}</span>}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex -space-x-2">
            {board.members?.slice(0, 5).map(m => (
              <div key={m.user?._id} title={m.user?.name}
                className="w-7 h-7 rounded-full bg-forge-700 border-2 border-surface-900 flex items-center justify-center text-xs text-white font-medium">
                {m.user?.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          {board.owner?._id === user?._id && (
            <button onClick={() => setShowInvite(true)} className="btn-ghost text-sm flex items-center gap-1.5 py-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 7a3 3 0 100-6 3 3 0 000 6zM12 13a3 3 0 00-6 0M1 8.5h4M3 6.5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Invite
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-6 min-w-max">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {board.columns?.sort((a, b) => a.order - b.order).map(col => (
              <KanbanColumn key={col.id} column={col}
                tasks={getTasksByColumn(col.id)}
                onAddTask={handleAddTask}
                onTaskClick={setSelectedTask} />
            ))}
            <DragOverlay>
              {activeTask && <div className="rotate-2 scale-105 opacity-90"><TaskCard task={activeTask} onClick={() => {}} /></div>}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {selectedTask && (
        <TaskModal task={selectedTask} columns={board.columns}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete} />
      )}
      {showInvite && <InviteModal boardId={id} onClose={() => setShowInvite(false)} />}
    </div>
  )
}
