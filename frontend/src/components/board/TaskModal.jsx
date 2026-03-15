import { useState } from 'react'
import { tasksAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const PRIORITY_COLORS = { low: 'text-slate-400', medium: 'text-amber-400', high: 'text-orange-400', urgent: 'text-red-400' }

export default function TaskModal({ task, columns, onClose, onUpdate, onDelete }) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: task.title, description: task.description || '', priority: task.priority, dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '' })
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [taskData, setTaskData] = useState(task)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await tasksAPI.update(task._id, { ...form, dueDate: form.dueDate || null })
      setTaskData(res.data)
      onUpdate(res.data)
      setEditing(false)
    } finally { setSaving(false) }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setCommenting(true)
    try {
      const res = await tasksAPI.addComment(task._id, { text: comment })
      setTaskData(res.data)
      setComment('')
    } finally { setCommenting(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    await tasksAPI.delete(task._id)
    onDelete(task._id)
    onClose()
  }

  const handleMoveColumn = async (columnId) => {
    const res = await tasksAPI.move(task._id, { columnId, order: taskData.order })
    setTaskData(res.data)
    onUpdate(res.data)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            {editing ? (
              <input className="input text-lg font-medium flex-1" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
            ) : (
              <h2 className="text-lg font-display font-semibold text-white flex-1 leading-snug">{taskData.title}</h2>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-white/40 text-xs mb-1.5">Status</p>
              <select className="input text-sm"
                value={taskData.columnId} onChange={e => handleMoveColumn(e.target.value)}>
                {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
              </select>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1.5">Priority</p>
              {editing ? (
                <select className="input text-sm" value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              ) : (
                <span className={`text-sm font-medium ${PRIORITY_COLORS[taskData.priority]}`}>
                  {taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1)}
                </span>
              )}
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1.5">Due date</p>
              {editing ? (
                <input type="date" className="input text-sm" value={form.dueDate}
                  onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
              ) : (
                <span className="text-sm text-white/70">
                  {taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              )}
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1.5">Created by</p>
              <span className="text-sm text-white/70">{taskData.createdBy?.name || 'Unknown'}</span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-white/40 text-xs mb-1.5">Description</p>
            {editing ? (
              <textarea className="input text-sm resize-none" rows={3} placeholder="Add a description..."
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            ) : (
              <p className="text-white/60 text-sm leading-relaxed">
                {taskData.description || <span className="text-white/25 italic">No description</span>}
              </p>
            )}
          </div>

          {editing ? (
            <div className="flex gap-2 mb-6">
              <button onClick={() => setEditing(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-6">
              <button onClick={() => setEditing(true)} className="btn-ghost text-sm flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 10.5L10.5 2l1.5 1.5-8.5 8.5H2v-1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                Edit
              </button>
              <button onClick={handleDelete} className="btn-danger text-sm flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 3.5h10M5 3.5V2.5h4v1M4 3.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Delete
              </button>
            </div>
          )}

          <div>
            <p className="text-white/40 text-xs mb-3">Comments ({taskData.comments?.length || 0})</p>
            <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
              {taskData.comments?.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-forge-700 flex items-center justify-center text-xs text-white shrink-0">
                    {c.author?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <span className="text-xs text-white/40">{c.author?.name} · {new Date(c.createdAt).toLocaleDateString()}</span>
                    <p className="text-sm text-white/70 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="flex gap-2">
              <input className="input text-sm flex-1" placeholder="Add a comment..." value={comment}
                onChange={e => setComment(e.target.value)} />
              <button type="submit" disabled={commenting || !comment.trim()} className="btn-primary px-3">
                {commenting ? '...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
