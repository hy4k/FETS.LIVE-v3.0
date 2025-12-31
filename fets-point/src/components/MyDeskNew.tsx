import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Lock, LogOut, Clock, Calendar,
  CheckCircle2, AlertCircle, Plus, Trash2,
  ExternalLink, FileText, Target, Zap,
  Settings, Camera, ShieldCheck, Mail,
  ChevronRight, Brain, Briefcase, Bookmark,
  StickyNote, CheckSquare, GraduationCap, MapPin,
  Award, Info, List, X
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ProfilePictureUpload } from './ProfilePictureUpload'

// --- Interfaces ---

interface WorkLog {
  id: string
  log_date: string
  achievements: string
  roadblocks: string
  hours_worked: number
}

interface Shortcut {
  id: string
  title: string
  url: string
  category: string
  icon?: string
}

// --- Sub-Components ---

const NeumorphicCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-3xl border border-white/20 ${className}`}>
    {children}
  </div>
)

const NeumorphicInset = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-[#e0e5ec] shadow-[inset_6px_6px_10px_0_rgba(163,177,198,0.7),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] rounded-2xl border-none ${className}`}>
    {children}
  </div>
)

const NeumorphicButton = ({ children, onClick, className = "", variant = "default", disabled = false }: { children: React.ReactNode, onClick?: () => void, className?: string, variant?: "default" | "danger" | "success" | "warning", disabled?: boolean }) => {
  const baseStyle = "px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.5)] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
  const variants = {
    default: "bg-[#e0e5ec] text-gray-600 hover:text-blue-600",
    danger: "bg-[#e0e5ec] text-red-500 hover:text-red-700",
    success: "bg-[#e0e5ec] text-green-600 hover:text-green-700",
    warning: "bg-[#e0e5ec] text-amber-600 hover:text-amber-700"
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

// --- Feature Panels ---

const ProfilePanel = ({ profile, onSignOut }: { profile: any, onSignOut: () => void }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  return (
    <div className="space-y-8">
      <NeumorphicCard className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <ProfilePictureUpload
              staffId={profile?.id || ''}
              staffName={profile?.full_name || 'User'}
              currentAvatarUrl={profile?.avatar_url}
              onAvatarUpdate={() => window.location.reload()}
            />
          </div>

          <h2 className="text-3xl font-black text-gray-800 tracking-tight mb-2 uppercase">{profile?.full_name}</h2>
          <div className="flex flex-col gap-1 mb-6">
            <div className="flex items-center justify-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-[0.2em]">
              <Mail size={14} className="text-blue-500" />
              {profile?.email}
            </div>
            {profile?.branch_assigned && (
              <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                <MapPin size={12} className="text-amber-500" />
                {profile?.branch_assigned}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <NeumorphicInset className="p-4 flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Role</span>
              <span className="text-blue-600 font-black uppercase text-xs">{profile?.role?.replace('_', ' ')}</span>
            </NeumorphicInset>
            <NeumorphicInset className="p-4 flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</span>
              <span className="text-green-600 font-black uppercase text-xs">{profile?.status || 'Active'}</span>
            </NeumorphicInset>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <NeumorphicButton onClick={() => setShowPasswordModal(true)} className="w-full justify-center">
              <Lock size={18} /> Credentials
            </NeumorphicButton>
            <NeumorphicButton onClick={onSignOut} variant="danger" className="w-full justify-center">
              <LogOut size={18} /> Logout
            </NeumorphicButton>
          </div>
        </div>

        <AnimatePresence>
          {showPasswordModal && (
            <PasswordModal onClose={() => setShowPasswordModal(false)} />
          )}
        </AnimatePresence>
      </NeumorphicCard>

      {/* READ ONLY DETAILS FROM SUPER ADMIN */}
      <NeumorphicCard className="p-6">
        <h3 className="text-sm font-black text-gray-700 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <Info size={16} className="text-blue-500" /> Personal Dossier
        </h3>

        <div className="space-y-6">
          {/* Employment */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase size={12} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Employment</span>
            </div>
            <div className="space-y-2">
              <DetailRow label="Department" value={profile?.department} />
              <DetailRow label="Position" value={profile?.position} />
              <DetailRow label="Joined" value={profile?.joining_date || profile?.hire_date} />
            </div>
          </section>

          {/* Training */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={12} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth & Training</span>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase">Skills</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile?.skills?.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-white shadow-sm rounded-md text-[9px] font-black text-blue-600 uppercase border border-blue-50">{s}</span>
                  )) || <span className="text-[10px] text-gray-400 italic">None logged</span>}
                </div>
              </div>
              {profile?.trainings_attended && (
                <div className="p-2 bg-slate-100/50 rounded-xl border border-white/40">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Recent Training</span>
                  <div className="text-[10px] font-bold text-gray-600 mt-1">
                    {Array.isArray(profile.trainings_attended) ? profile.trainings_attended.slice(0, 1).map((t: any) => t.name || t) : 'View history in HR'}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Permissions */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={12} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Licenses</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {profile?.permissions ? Object.entries(profile.permissions).filter(([_, val]) => val === true).slice(0, 4).map(([key]) => (
                <NeumorphicInset key={key} className="p-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-black text-gray-700 uppercase tracking-tight truncate">{key.replace('_', ' ')}</span>
                </NeumorphicInset>
              )) : <p className="text-[10px] text-gray-400 italic">Standard Access</p>}
            </div>
          </section>
        </div>
      </NeumorphicCard>
    </div>
  )
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center text-[11px]">
    <span className="font-bold text-gray-500 uppercase tracking-wider">{label}</span>
    <span className="font-black text-gray-800 uppercase text-right">{value || '---'}</span>
  </div>
)

const PasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('Passwords do not match')
    if (password.length < 6) return toast.error('Minimum 6 characters required')

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Security Credentials Updated')
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md"
      >
        <NeumorphicCard className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
              <Lock size={20} className="text-amber-500" />
              Reset Security
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">New Password</label>
              <NeumorphicInset>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-transparent p-4 outline-none text-gray-700 font-bold"
                  placeholder="••••••••"
                  required
                />
              </NeumorphicInset>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Confirm Credentials</label>
              <NeumorphicInset>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-transparent p-4 outline-none text-gray-700 font-bold"
                  placeholder="••••••••"
                  required
                />
              </NeumorphicInset>
            </div>
            <NeumorphicButton className="w-full justify-center bg-blue-600 text-white hover:text-white" onClick={() => { }} variant="default">
              {loading ? 'Securing...' : 'Verify & Update'}
            </NeumorphicButton>
          </form>
        </NeumorphicCard>
      </motion.div>
    </div>
  )
}

const PersonalWorkLog = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newLog, setNewLog] = useState({ achievements: '', roadblocks: '', hours: 8 })
  const [loading, setLoading] = useState(false)

  // Shift Notes State
  const [shiftNote, setShiftNote] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)

  // Tasks State
  const [tasks, setTasks] = useState<any[]>([])
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchLogs()
      fetchShiftNote()
      fetchTasks()
    }
  }, [user?.id])

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('user_work_logs')
      .select('*')
      .eq('user_id', user?.id)
      .order('log_date', { ascending: false })
      .limit(5)
    if (data) setLogs(data)
  }

  const fetchShiftNote = async () => {
    const { data } = await supabase
      .from('user_shift_notes')
      .select('content')
      .eq('user_id', user?.id)
      .single()
    if (data) setShiftNote(data.content)
  }

  const saveShiftNote = async () => {
    if (!user?.id) return
    setIsSavingNote(true)
    const { error } = await supabase
      .from('user_shift_notes')
      .upsert({ user_id: user?.id, content: shiftNote, updated_at: new Date() })
    if (!error) toast.success('Shift note recorded')
    else toast.error('Failed to sync note')
    setIsSavingNote(false)
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('user_focus_tasks')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    const { error } = await supabase
      .from('user_focus_tasks')
      .insert([{ user_id: user?.id, content: newTask, is_completed: false }])
    if (!error) {
      setNewTask('')
      fetchTasks()
    }
  }

  const toggleTask = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('user_focus_tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', id)
    fetchTasks()
  }

  const deleteTask = async (id: string) => {
    await supabase.from('user_focus_tasks').delete().eq('id', id)
    fetchTasks()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('user_work_logs').insert([{
      user_id: user?.id,
      achievements: newLog.achievements,
      roadblocks: newLog.roadblocks,
      hours_worked: newLog.hours
    }])

    if (!error) {
      toast.success('Work entry recorded')
      setNewLog({ achievements: '', roadblocks: '', hours: 8 })
      setShowAdd(false)
      fetchLogs()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* SHIFT NOTES - SKETCHBOOK STYLE */}
      <NeumorphicCard className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
            <StickyNote size={24} className="text-amber-500" /> Shift Directives
          </h3>
          <NeumorphicButton
            onClick={saveShiftNote}
            disabled={isSavingNote}
            variant="warning"
            className="!p-3 !rounded-xl"
          >
            {isSavingNote ? <Zap size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
          </NeumorphicButton>
        </div>
        <NeumorphicInset className="p-5">
          <textarea
            value={shiftNote}
            onChange={e => setShiftNote(e.target.value)}
            placeholder="Brief operational notes for current shift..."
            className="w-full bg-transparent outline-none text-gray-700 font-bold text-sm min-h-[120px] resize-none"
          />
        </NeumorphicInset>
      </NeumorphicCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        {/* FOCUS TASKS */}
        <NeumorphicCard className="p-8 flex flex-col">
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3 mb-6">
            <Target size={24} className="text-rose-500" /> Focus Tasks
          </h3>
          <form onSubmit={addTask} className="mb-6">
            <NeumorphicInset className="flex items-center pr-2">
              <input
                type="text"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="Add secondary focus..."
                className="flex-1 bg-transparent p-4 outline-none text-sm font-bold text-gray-700"
              />
              <button type="submit" className="p-2 text-rose-500 hover:scale-110 transition-transform">
                <Plus size={20} />
              </button>
            </NeumorphicInset>
          </form>
          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-4 group">
                <button
                  onClick={() => toggleTask(task.id, task.is_completed)}
                  className={`p-1.5 rounded-lg transition-all ${task.is_completed ? 'bg-emerald-500 text-white' : 'bg-white shadow-sm text-gray-400'}`}
                >
                  <CheckCircle2 size={16} />
                </button>
                <span className={`text-sm font-bold flex-1 uppercase tracking-tight ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {task.content}
                </span>
                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-10">No Tasks set</p>}
          </div>
        </NeumorphicCard>

        {/* MISSION JOURNAL */}
        <NeumorphicCard className="p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
              <Briefcase size={24} className="text-blue-500" /> Mission Log
            </h3>
            <NeumorphicButton onClick={() => setShowAdd(!showAdd)} className="!p-3 !rounded-xl">
              {showAdd ? <X size={18} /> : <Plus size={18} />}
            </NeumorphicButton>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {showAdd ? (
              <form onSubmit={handleSubmit} className="space-y-4 p-2">
                <NeumorphicInset className="p-4">
                  <textarea
                    placeholder="Key Results..."
                    value={newLog.achievements}
                    onChange={e => setNewLog({ ...newLog, achievements: e.target.value })}
                    className="w-full bg-transparent outline-none text-sm font-medium text-gray-700 min-h-[80px] resize-none"
                    required
                  />
                </NeumorphicInset>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <NeumorphicInset className="p-3">
                      <input
                        type="number"
                        value={newLog.hours}
                        onChange={e => setNewLog({ ...newLog, hours: parseFloat(e.target.value) })}
                        className="w-full bg-transparent outline-none text-sm font-bold text-gray-700"
                      />
                    </NeumorphicInset>
                  </div>
                  <NeumorphicButton className="flex-1 justify-center bg-blue-600 text-white" variant="default" onClick={() => { }}>
                    Lock Entry
                  </NeumorphicButton>
                </div>
              </form>
            ) : (
              logs.map(log => (
                <NeumorphicInset key={log.id} className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{format(new Date(log.log_date), 'MMM dd')}</span>
                    <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg">{log.hours_worked}h</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-700 line-clamp-2 uppercase tracking-tight">{log.achievements}</p>
                </NeumorphicInset>
              ))
            )}
            {!showAdd && logs.length === 0 && (
              <div className="text-center py-10 opacity-30">
                <p className="font-bold uppercase text-xs tracking-widest">No history</p>
              </div>
            )}
          </div>
        </NeumorphicCard>
      </div>
    </div>
  )
}

const ShortcutPanel = () => {
  const { user } = useAuth()
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newLink, setNewLink] = useState({ title: '', url: '', category: 'General' })

  useEffect(() => {
    fetchShortcuts()
  }, [])

  const fetchShortcuts = async () => {
    const { data } = await supabase
      .from('user_shortcuts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) setShortcuts(data)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    let url = newLink.url
    if (!url.startsWith('http')) url = 'https://' + url

    const { error } = await supabase.from('user_shortcuts').insert([{
      user_id: user?.id,
      title: newLink.title,
      url: url,
      category: newLink.category
    }])

    if (!error) {
      toast.success('Shortcut Locked')
      setNewLink({ title: '', url: '', category: 'General' })
      setShowAdd(false)
      fetchShortcuts()
    }
  }

  const deleteLink = async (id: string) => {
    await supabase.from('user_shortcuts').delete().eq('id', id)
    fetchShortcuts()
  }

  return (
    <NeumorphicCard className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
          <Bookmark size={24} className="text-amber-500" />
          Neural Links
        </h3>
        <NeumorphicButton onClick={() => setShowAdd(!showAdd)} className="!p-3 !rounded-xl">
          {showAdd ? <X size={18} /> : <Plus size={18} />}
        </NeumorphicButton>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {showAdd && (
          <form onSubmit={handleAdd} className="space-y-4 p-2 mb-4">
            <NeumorphicInset className="p-3">
              <input
                placeholder="Link Title (e.g. Exam SOP)"
                value={newLink.title}
                onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                className="w-full bg-transparent outline-none text-sm font-bold text-gray-700"
                required
              />
            </NeumorphicInset>
            <NeumorphicInset className="p-3">
              <input
                placeholder="URL (e.g. google.com)"
                value={newLink.url}
                onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                className="w-full bg-transparent outline-none text-sm font-bold text-gray-700"
                required
              />
            </NeumorphicInset>
            <NeumorphicButton className="w-full justify-center bg-amber-500 text-white" onClick={() => { }} variant="default">
              Add Link
            </NeumorphicButton>
          </form>
        )}

        <div className="grid grid-cols-1 gap-4">
          {shortcuts.map(link => (
            <motion.div
              layout
              key={link.id}
              className="group flex items-center gap-4 bg-[#e0e5ec] p-4 rounded-2xl shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] transition-all"
            >
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <ExternalLink size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-black text-gray-700 truncate hover:text-blue-600 transition-colors uppercase tracking-tight"
                >
                  {link.title}
                </a>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{link.category}</span>
              </div>
              <button
                onClick={() => deleteLink(link.id)}
                className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>

        {!showAdd && shortcuts.length === 0 && (
          <div className="text-center py-12 opacity-30">
            <Zap size={48} className="mx-auto mb-4" />
            <p className="font-bold uppercase text-xs tracking-widest">No shortcuts available</p>
          </div>
        )}
      </div>
    </NeumorphicCard>
  )
}

// --- Main Page ---

export function MyDeskNew() {
  const { profile, signOut } = useAuth()
  const { activeBranch } = useBranch()

  return (
    <div className="min-h-screen p-8" style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12"
      >
        <div className="flex items-center gap-6">
          <div className="p-5 rounded-2xl bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] text-blue-600">
            <ShieldCheck size={42} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-700 mb-2 uppercase">
              Operational <span className="text-gold-gradient">Command</span>
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-lg text-gray-500 font-medium tracking-tight">Personal Workspace Control</p>
              <div className="h-1 w-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-2 px-3 py-1 bg-white/40 rounded-full border border-white/60">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{activeBranch} Branch</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Grid Version</span>
            <span className="text-xl font-black text-gray-700 tracking-tighter">v4.0.1</span>
          </div>
          <div className="w-[1px] h-10 bg-gray-300/50" />
          <div className="flex flex-col items-end">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Local Time</span>
            <span className="text-xl font-black text-gray-700 tracking-tighter uppercase">{format(new Date(), 'HH:mm')}</span>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1800px] mx-auto">

        {/* Profile Section */}
        <div className="lg:col-span-4 xl:col-span-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ProfilePanel profile={profile} onSignOut={signOut} />
          </motion.div>
        </div>

        {/* Action Center - Work Logs */}
        <div className="lg:col-span-8 xl:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-full"
          >
            <PersonalWorkLog />
          </motion.div>
        </div>

        {/* Utility - Shortcuts */}
        <div className="lg:col-span-12 xl:col-span-3">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="h-full"
          >
            <ShortcutPanel />
          </motion.div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="mt-16 flex justify-center opacity-20 pointer-events-none">
        <FetsBranding />
      </div>
    </div>
  )
}

const FetsBranding = () => (
  <div className="flex items-center gap-4 grayscale">
    <Brain size={24} />
    <span className="font-black text-sm uppercase tracking-[0.5em]">FETS PLATFORM SYSTEMS</span>
  </div>
)

export default MyDeskNew
