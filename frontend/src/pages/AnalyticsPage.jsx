import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { analyticsAPI, boardsAPI } from '../services/api'
import Navbar from '../components/Navbar'

const PRIORITY_COLORS = { low: '#64748b', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' }
const COLUMN_COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-850 border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="text-white font-medium">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsAPI.getBoard(id), boardsAPI.get(id)])
      .then(([a, b]) => { setData(a.data); setBoard(b.data) })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-forge-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  const columnData = board?.columns?.map((col, i) => ({
    name: col.title, value: data?.byColumn?.[col.id] || 0, fill: COLUMN_COLORS[i % COLUMN_COLORS.length]
  })) || []

  const priorityData = Object.entries(data?.byPriority || {}).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1), value: v, fill: PRIORITY_COLORS[k]
  }))

  const trendData = data?.last7Days?.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Created: d.created, Completed: d.completed
  })) || []

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar boardTitle={board?.title} boardId={id} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to={`/board/${id}`} className="text-white/40 hover:text-white/70 transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-semibold text-white">Analytics</h1>
            <p className="text-white/40 text-sm">{board?.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total tasks', value: data?.totalTasks, color: 'text-white' },
            { label: 'Completion rate', value: `${data?.completionRate}%`, color: 'text-green-400' },
            { label: 'Overdue', value: data?.overdue, color: data?.overdue > 0 ? 'text-red-400' : 'text-white' },
            { label: 'Done today', value: data?.completedToday, color: 'text-forge-400' },
          ].map(stat => (
            <div key={stat.label} className="card p-4">
              <p className="text-white/40 text-xs mb-1">{stat.label}</p>
              <p className={`text-2xl font-display font-semibold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-5">
            <h3 className="text-white/70 text-sm font-medium mb-4">Tasks by stage</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={columnData} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {columnData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="text-white/70 text-sm font-medium mb-4">Tasks by priority</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {priorityData.map(p => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
                    <span className="text-white/60 text-xs">{p.name}</span>
                    <span className="text-white text-xs font-medium ml-auto">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-white/70 text-sm font-medium mb-4">Activity — last 7 days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Created" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
              <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-forge-500 rounded" /><span className="text-white/40 text-xs">Created</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-500 rounded" /><span className="text-white/40 text-xs">Completed</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
