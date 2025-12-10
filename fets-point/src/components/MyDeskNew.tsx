import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  CheckSquare,
  MessageSquare,
  Users,
  TrendingUp,
  Zap,
  Maximize2,
  X,
  Plus,
  QrCode,
  Search,
  FilePlus,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  Circle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDashboardStats } from '../hooks/useCommandCentre'
import { useBranch } from '../hooks/useBranch'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService, Task } from '../services/task.service'
import { toast } from 'react-hot-toast'

// --- Interfaces ---

interface TileProps {
  id: string
  title: string
  icon: React.ElementType
  color?: string
  children: React.ReactNode
  onExpand: () => void
  colSpan?: 1 | 2
}

interface QuickActionProps {
  icon: React.ElementType
  label: string
  onClick: () => void
}

// --- Live Tile Component ---

const LiveTile = ({ id, title, icon: Icon, color = "amber", children, onExpand, colSpan = 1 }: TileProps) => {
  return (
    <motion.div
      layoutId={`tile-container-${id}`}
      className={`neomorphic-card relative group overflow-hidden flex flex-col justify-between cursor-pointer transition-shadow hover:shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] ${colSpan === 2 ? 'md:col-span-2' : ''}`}
      onClick={onExpand}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Decor */}
      <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 text-${color}-900 rotate-12`}>
        <Icon size={200} />
      </div>

      <div className="p-6 h-full flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 shadow-sm border border-${color}-100 group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-700 tracking-tight">{title}</h3>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-gray-600">
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>

      {/* Visual Indicator Bar */}
      <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r from-${color}-400 to-${color}-600 transition-all duration-500 rounded-b-2xl`} />
    </motion.div>
  )
}

// --- Expanded Panel Component ---

const ExpandedPanel = ({ id, title, children, onClose }: { id: string, title: string, children: React.ReactNode, onClose: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/20 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`tile-container-${id}`}
        className="w-full max-w-4xl max-h-[90vh] bg-[#e0e5ec] rounded-3xl shadow-[20px_20px_60px_#bec3c9,-20px_-20px_60px_#ffffff] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 border-b border-gray-200 flex items-center justify-between bg-white/50 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{title}</h2>
            <p className="text-gray-500 mt-1">Detailed View & Management</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-black/5 text-gray-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- sub-components for Tile Content ---

const StatRow = ({ label, value, subtext }: { label: string, value: string | number, subtext?: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-white/40 px-2 -mx-2 rounded-lg transition-colors">
    <span className="text-gray-500 font-medium text-sm">{label}</span>
    <div className="text-right">
      <span className="block text-lg font-bold text-gray-800 leading-none">{value}</span>
      {subtext && <span className="text-xs text-gray-400 font-medium">{subtext}</span>}
    </div>
  </div>
)

const TaskItem = ({ task, onToggle }: { task: Task, onToggle?: (id: string, status: string) => void }) => (
  <div
    className="flex items-center gap-3 py-2 px-2 hover:bg-white/50 rounded-lg cursor-pointer transition-colors group"
    onClick={(e) => {
      e.stopPropagation();
      if (onToggle) onToggle(task.id, task.status === 'completed' ? 'pending' : 'completed');
    }}
  >
    <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'} ring-4 ring-opacity-20 ring-${task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'amber' : 'emerald'}-500`} />
    <span className={`text-sm font-medium flex-1 truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.title}</span>
    {task.status === 'completed' ? <CheckCircle size={14} className="text-emerald-500" /> : <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
  </div>
)

const QuickActionButton = ({ icon: Icon, label, onClick }: QuickActionProps) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#e0e5ec] shadow-[5px_5px_10px_#bec3c9,-5px_-5px_10px_#ffffff] hover:shadow-[inset_5px_5px_10px_#bec3c9,inset_-5px_-5px_10px_#ffffff] active:scale-95 transition-all duration-200 group w-full"
  >
    <Icon size={20} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
    <span className="text-xs font-bold text-gray-600">{label}</span>
  </button>
)

// --- Main Desk Component ---

export function MyDeskNew() {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()
  const { data: stats } = useDashboardStats()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const queryClient = useQueryClient();

  // Tasks Data
  const { data: tasks = [] } = useQuery({
    queryKey: ['myTasks'],
    queryFn: taskService.getMyTasks,
  });

  const createTaskMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      console.log('Task created!');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Task> }) => taskService.updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myTasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myTasks'] })
  });

  // Derived Data
  const sessionCount = stats?.todayCandidates || 0 // Fallback logic
  const candidateCount = stats?.todaysExams?.reduce((acc: any, s: any) => acc + (s.candidate_count || 0), 0) || stats?.todayCandidates || 0;
  const incidentCount = stats?.pendingIncidents || 0
  const unreadMessages = stats?.newMessages || 0;

  // rosterStaff fallback is critical if data is missing
  const rosterStaff: string[] = stats?.todaysRoster?.staff || []

  // Handlers
  const handleExpand = (id: string) => setExpandedId(id)
  const handleClose = () => setExpandedId(null)

  const handleCreateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTaskMutation.mutate({
      title: formData.get('title') as string,
      priority: formData.get('priority') as any || 'medium',
      status: 'pending'
    });
    e.currentTarget.reset();
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec] pt-28 pb-12 px-4 md:px-8">

      {/* Dynamic Header */}
      <div className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-[900] tracking-tight text-gray-800">
            <span className="text-gold-gradient">MY DESK</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${activeBranch === 'calicut' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
            {activeBranch.toUpperCase()} OPERATIONS
          </p>
        </div>

        {/* Real-time Clock Pill */}
        <div className="neomorphic-card px-6 py-3 rounded-full flex items-center gap-3 text-gray-600">
          <Clock size={16} className="text-amber-500" />
          <span className="font-mono font-bold tracking-widest text-sm">
            {format(new Date(), 'HH:mm:ss')}
          </span>
        </div>
      </div>

      {/* Tiles Grid */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

        {/* 1. Today Ops Tile */}
        <LiveTile id="ops" title="Today Ops" icon={Activity} onExpand={() => handleExpand('ops')} color="amber">
          <div className="space-y-1">
            <StatRow
              label="Active Candidates"
              value={candidateCount}
              subtext="Checked In Today"
            />
            <StatRow label="Open Incidents" value={incidentCount} subtext="Requires Attention" />
            <div className="mt-4 pt-3 border-t border-gray-200/50 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase">System Status</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                {stats?.branchStatusData?.system_health || 'OPERATIONAL'}
              </span>
            </div>
          </div>
        </LiveTile>

        {/* 2. Task Queue Tile - REAL DATA */}
        <LiveTile id="tasks" title="Task Queue" icon={CheckSquare} onExpand={() => handleExpand('tasks')} color="emerald">
          <div className="space-y-2 mb-2 flex-1 overflow-hidden">
            {tasks.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4">No pending tasks</div>
            ) : tasks.slice(0, 3).map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleExpand('tasks'); }}
            className="w-full mt-auto py-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-semibold text-sm"
          >
            <Plus size={16} /> Manage Tasks
          </button>
        </LiveTile>

        {/* 3. Messages Tile */}
        <LiveTile id="messages" title="Messages" icon={MessageSquare} onExpand={() => handleExpand('messages')} color="blue">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative">
              <div className={`absolute inset-0 bg-blue-400 blur-xl opacity-20 rounded-full ${unreadMessages > 0 ? 'animate-pulse' : ''}`}></div>
              <MessageSquare size={48} className="text-blue-500 relative z-10" />
              {unreadMessages > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#e0e5ec] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{unreadMessages}</span>
                </div>
              )}
            </div>
            <h4 className="mt-4 text-2xl font-bold text-gray-800">{unreadMessages} New</h4>
            <p className="text-sm text-gray-500 font-medium">Unread Messages</p>
          </div>
        </LiveTile>

        {/* 4. Roster Snapshot Tile */}
        <LiveTile id="roster" title="Roster Snapshot" icon={Users} onExpand={() => handleExpand('roster')} color="purple">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>Scheduled Today</span>
              <span>{rosterStaff.length} Staff</span>
            </div>
            <div className="flex -space-x-3 overflow-hidden py-2 px-1">
              {rosterStaff.slice(0, 5).map((staff: string, i: number) => (
                <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-purple-800" title={staff}>
                  {staff.charAt(0)}
                </div>
              ))}
              {rosterStaff.length === 0 && (
                <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
                  --
                </div>
              )}
            </div>
            {rosterStaff.length > 0 && (
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-xs text-purple-800 font-medium"><span className="font-bold">{rosterStaff[0]}</span> is on shift.</p>
              </div>
            )}
          </div>
        </LiveTile>

        {/* 5. Candidate Flow Tile (Capacity) */}
        <LiveTile id="candidates" title="Capacity" icon={TrendingUp} onExpand={() => handleExpand('candidates')} color="rose">
          <div className="flex items-center justify-between h-full">
            <div className="relative w-24 h-24">
              {/* Circular Progress Mock */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#fecdd3" strokeWidth="8" fill="transparent" />
                <circle cx="48" cy="48" r="40" stroke="#e11d48" strokeWidth="8" fill="transparent" strokeDasharray={`${(candidateCount / 100) * 251} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-900">
                <span className="text-xl font-bold">{candidateCount}</span>
              </div>
            </div>
            <div className="text-right flex-1 pl-4">
              <p className="text-sm font-bold text-gray-400 uppercase">Today's Load</p>
              <p className="text-2xl font-bold text-gray-800">
                {Math.min(100, Math.round((candidateCount / 60) * 100))}%
              </p>
            </div>
          </div>
        </LiveTile>

        {/* 6. Quick Tools Tile */}
        <LiveTile id="tools" title="Quick Tools" icon={Zap} onExpand={() => { }} color="indigo" colSpan={1}>
          <div className="grid grid-cols-2 gap-3 h-full">
            <QuickActionButton icon={QrCode} label="Scan QR" onClick={() => alert('QR Scanner logic would open here')} />
            <QuickActionButton icon={Search} label="Lookup" onClick={() => alert('Candidate Search Modal')} />
            <QuickActionButton icon={FilePlus} label="Incident" onClick={() => alert('New Incident Form')} />
            <QuickActionButton icon={MoreHorizontal} label="More" onClick={() => console.log('More')} />
          </div>
        </LiveTile>

      </div>

      {/* Expanded Overlay Manager */}
      <AnimatePresence>
        {expandedId === 'tasks' && (
          <ExpandedPanel id="tasks" title="Task Manager" onClose={handleClose}>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Task Form */}
              <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <h3 className="font-bold text-gray-800 mb-4">Add New Task</h3>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                    <input name="title" required className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500" placeholder="What needs doing?" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                    <select name="priority" className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500">
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <button type="submit" disabled={createTaskMutation.isPending} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors">
                    {createTaskMutation.isPending ? 'Adding...' : 'Add Task'}
                  </button>
                </form>
              </div>

              {/* Task List */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="font-bold text-gray-800 mb-4">Your Tasks ({tasks.length})</h3>
                {tasks.map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateTaskMutation.mutate({ id: task.id, updates: { status: task.status === 'completed' ? 'pending' : 'completed' } })}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-500'}`}
                      >
                        {task.status === 'completed' && <CheckCircle size={14} />}
                      </button>
                      <div>
                        <p className={`font-semibold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </ExpandedPanel>
        )}

        {/* Placeholder Replacements for other panels */}
        {expandedId === 'ops' && (
          <ExpandedPanel id="ops" title="Operations Detail" onClose={handleClose}>
            <div className="p-12 text-center text-gray-400">
              <Activity size={48} className="mx-auto mb-4 opacity-50" />
              <p>Full Operations Log implementation coming soon.</p>
            </div>
          </ExpandedPanel>
        )}

        {expandedId === 'messages' && (
          <ExpandedPanel id="messages" title="Message Center" onClose={handleClose}>
            <div className="p-12 text-center text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>Communication hub linking to Chat module.</p>
            </div>
          </ExpandedPanel>
        )}

      </AnimatePresence>

    </div>
  )
}

export default MyDeskNew
