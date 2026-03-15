import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import TaskCard from './TaskCard'

export default function KanbanColumn({ column, tasks, onAddTask, onTaskClick }) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    await onAddTask(column.id, newTitle.trim())
    setNewTitle('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
          <span className="text-white/70 text-sm font-medium">{column.title}</span>
          <span className="text-white/25 text-xs bg-white/5 rounded-full px-1.5 py-0.5 font-mono">
            {tasks.length}
          </span>
        </div>
        <button onClick={() => setAdding(true)}
          className="text-white/25 hover:text-white/70 transition-colors p-1 rounded-md hover:bg-white/5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 min-h-32 transition-colors duration-150 ${isOver ? 'bg-forge-600/10 border border-forge-500/30' : 'bg-white/3 border border-transparent'}`}>
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task)} />
            ))}
          </div>
        </SortableContext>

        {adding ? (
          <form onSubmit={handleAdd} className="mt-2">
            <input autoFocus className="input text-sm mb-2" placeholder="Task title..."
              value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setAdding(false)} />
            <div className="flex gap-1">
              <button type="submit" className="btn-primary text-xs px-3 py-1.5 flex-1">Add</button>
              <button type="button" onClick={() => setAdding(false)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full mt-2 text-white/25 hover:text-white/50 text-xs py-2 flex items-center gap-1.5 justify-center hover:bg-white/3 rounded-lg transition-all">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Add task
          </button>
        )}
      </div>
    </div>
  )
}
