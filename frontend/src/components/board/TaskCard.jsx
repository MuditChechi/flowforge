import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PRIORITY_STYLES = {
  low:    { dot: 'bg-slate-400', text: 'text-slate-400', label: 'Low' },
  medium: { dot: 'bg-amber-400', text: 'text-amber-400', label: 'Medium' },
  high:   { dot: 'bg-orange-400', text: 'text-orange-400', label: 'High' },
  urgent: { dot: 'bg-red-400', text: 'text-red-400', label: 'Urgent' },
}

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.columnId !== 'done'

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={onClick}
      className="bg-surface-850 border border-white/8 hover:border-white/15 rounded-xl p-3 cursor-pointer group transition-all duration-150 hover:shadow-lg hover:shadow-black/20 active:scale-98">

      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-forge-600/20 text-forge-300 border border-forge-500/20">
              {label}
            </span>
          ))}
        </div>
      )}

      <p className="text-white/90 text-sm font-medium leading-snug mb-2 group-hover:text-white transition-colors">
        {task.title}
      </p>

      {task.description && (
        <p className="text-white/40 text-xs leading-relaxed mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          <span className={`text-xs ${priority.text}`}>{priority.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-white/30'} flex items-center gap-1`}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.assignees?.length > 0 && (
            <div className="flex -space-x-1.5">
              {task.assignees.slice(0, 3).map(a => (
                <div key={a._id} className="w-5 h-5 rounded-full bg-forge-700 border border-surface-850 flex items-center justify-center text-white text-xs font-medium">
                  {a.name?.[0]?.toUpperCase()}
                </div>
              ))}
            </div>
          )}
          {task.comments?.length > 0 && (
            <span className="text-white/25 text-xs flex items-center gap-0.5">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 2h8a1 1 0 011 1v5a1 1 0 01-1 1H4l-2 2V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              {task.comments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
