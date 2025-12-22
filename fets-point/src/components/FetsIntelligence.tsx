import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Zap, Search, Newspaper, Activity,
  User, LogOut, ArrowRight, X, Sparkles,
  Maximize2
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { askGemini } from '../lib/gemini'

// Feature Components
import { NewsManager } from './NewsManager'
import { ProfilePictureUpload } from './ProfilePictureUpload'

// --- Interfaces ---

interface TileProps {
  id: string
  title: string
  icon: React.ElementType
  color?: string
  children: React.ReactNode
  onExpand?: () => void
  colSpan?: 1 | 2
}

interface HealthMetric {
  metric_name: string
  value: string
  status: 'ok' | 'warning' | 'critical'
}

// --- Live Tile Component ---

const LiveTile = ({ id, title, icon: Icon, color = "amber", children, onExpand, colSpan = 1 }: TileProps) => {
  return (
    <motion.div
      layoutId={`tile-container-${id}`}
      className={`relative group overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 
        bg-white/80 backdrop-blur-xl border border-white/20 shadow-[8px_8px_16px_rgba(163,177,198,0.1),-8px_-8px_16px_rgba(255,255,255,0.8)]
        rounded-3xl hover:shadow-[12px_12px_24px_rgba(163,177,198,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)] 
        ${colSpan === 2 ? 'md:col-span-2' : ''}`}
      onClick={onExpand}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Decor */}
      <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 text-${color}-600 rotate-12`}>
        <Icon size={180} />
      </div>

      <div className="p-6 h-full flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-500 shadow-sm border border-${color}-100/50 group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-700 tracking-tight">{title}</h3>
          </div>
          {onExpand && (
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-gray-600">
              <Maximize2 size={16} />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </motion.div>
  )
}

// --- Expanded Panel Component ---

const ExpandedPanel = ({ id, title, subtitle, children, onClose }: { id: string, title: string, subtitle?: string, children: React.ReactNode, onClose: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`tile-container-${id}`}
        className="w-full max-w-6xl max-h-[90vh] bg-[#f4f7fb] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 border-b border-gray-200/50 flex items-center justify-between bg-white/80 sticky top-0 z-20 backdrop-blur-md">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              {title}
            </h2>
            {subtitle && <p className="text-slate-500 mt-1 font-medium">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto bg-slate-50/50 flex-1 relative">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- Main FetsIntelligence Component ---

export function FetsIntelligence() {
  const { profile, signOut, hasPermission } = useAuth()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // AI Prompt State
  const [prompt, setPrompt] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)

  // System Health State
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])

  // Profile State
  const [profileData, setProfileData] = useState({ fullName: profile?.full_name || '', bio: profile?.bio || '' })

  // Load Initial Data
  useEffect(() => {
    const fetchHealth = async () => {
      const { data } = await (supabase as any).from('system_health_metrics').select('*')
      if (data) setHealthMetrics(data as HealthMetric[])
    }
    fetchHealth()

    // Set up realtime subscription for health metrics
    const subscription = (supabase as any)
      .channel('health_metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_health_metrics' }, (payload: any) => {
        fetchHealth()
      })
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [])


  // --- Handlers ---

  const handleExpand = (id: string) => setExpandedId(id)
  const handleClose = () => setExpandedId(null)

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    // DEBUG COMMAND
    if (prompt === '/debug-auth') {
      const key = import.meta.env.VITE_AI_API_KEY;
      const status = key ? `Loaded (${key.length} chars)` : 'Missing';
      const prefix = key ? `Prefix: ${key.substring(0, 5)}...` : '';
      const charCheck = key ? `First: '${key[0]}', Last: '${key[key.length - 1]}'` : '';
      setAiResponse(`DEBUG REPORT:\nStatus: ${status}\n${prefix}\n${charCheck}\nTypically invalid if length < 39 or contains quotes.`);
      return;
    }

    setIsAiProcessing(true)
    setAiResponse(null)

    try {
      // 1. Log the prompt (Interaction with Supabase Backend)
      if (profile?.user_id) {
        await (supabase as any).from('ai_prompt_logs').insert({
          user_id: profile.user_id,
          prompt_text: prompt,
        })
      }

      // 2. Call Real Gemini API
      const response = await askGemini(prompt)

      setAiResponse(response)
    } catch (e) {
      console.error(e)
      toast.error('AI Processing Failed: ' + (e as Error).message)
      setAiResponse("System Error: Unable to reach the Neural Engine. Please check your network or API key.")
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true)
      const updates: any = { full_name: profileData.fullName }
      if (profileData.bio !== undefined) updates.bio = profileData.bio

      const { error } = await supabase.from('staff_profiles').update(updates).eq('user_id', profile?.user_id)
      if (error) throw error
      toast.success('Profile updated')
      handleClose()
    } catch (error) { toast.error('Failed to update profile') } finally { setIsLoading(false) }
  }

  const handleAvatarUpdate = (url: string | null) => {
    // This function is passed to ProfilePictureUpload which handles the DB update
  }

  return (
    <div className="min-h-screen bg-[#EEF2F9] pb-12 relative overflow-hidden font-sans text-slate-700">

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-blue-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-amber-100/40 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 pt-12">

        {/* Header - The Brain */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-400/50 mb-6 relative group"
          >
            <Brain className="text-amber-400 group-hover:scale-110 transition-transform duration-500" size={48} />
            <div className="absolute inset-0 rounded-3xl bg-amber-400/20 animate-pulse blur-xl opacity-50" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl font-[900] tracking-tighter text-slate-800 mb-4"
          >
            FETS <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">INTELLIGENCE</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-500 font-medium max-w-2xl mx-auto"
          >
            The central nervous system of your operations.
          </motion.p>
        </div>

        {/* AI Prompt Interface */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-20 relative z-20"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-blue-500 rounded-2xl blur opacity-20 transition duration-1000 group-hover:opacity-100"></div>
            <form onSubmit={handleAiSubmit} className="relative bg-white rounded-2xl shadow-xl p-2 flex items-center gap-2 border border-white/50 ring-1 ring-slate-100 transition-shadow focus-within:shadow-2xl focus-within:ring-amber-200">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                {isAiProcessing ? <Sparkles className="animate-spin text-amber-500" /> : <Search />}
              </div>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask FETS anything (e.g., 'What exams are tomorrow?', 'System Status')..."
                className="flex-1 bg-transparent border-none outline-none text-lg px-2 text-slate-700 placeholder:text-slate-400 font-medium h-12"
              />
              <button
                type="submit"
                disabled={isAiProcessing || !prompt.trim()}
                className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAiProcessing ? 'Thinking...' : <>Analyze <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>

          {/* AI Response Area */}
          <AnimatePresence>
            {aiResponse && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-amber-100/50 shadow-lg relative">
                  <div className="absolute top-0 left-0 w-1 p-8 h-full bg-gradient-to-b from-amber-400 to-transparent rounded-l-2xl" />
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">FETS Insight</h4>
                      <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{aiResponse}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

          {/* 1. Identity Module */}
          <LiveTile id="profile" title="Identity" icon={User} onExpand={() => handleExpand('profile')} color="blue" colSpan={1}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=0F172A&color=fff`} className="w-full h-full object-cover" alt="Profile" />
              </div>
              <div>
                <div className="font-bold text-slate-800">{profile?.full_name || 'User'}</div>
                <div className="text-xs font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  {profile?.role ? profile.role.replace('_', ' ').toUpperCase() : 'STAFF'}
                </div>
              </div>
            </div>
          </LiveTile>

          {/* 2. Newsroom Control - Only for allowed users */}
          {hasPermission('news_edit') && (
            <LiveTile id="news" title="Newsroom" icon={Newspaper} onExpand={() => handleExpand('news')} color="rose" colSpan={1}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Broadcast Status</span>
                  <span className="text-rose-500 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> LIVE</span>
                </div>
                <p className="text-xs text-slate-400">Manage breaking news and scrolling tickers.</p>
              </div>
            </LiveTile>
          )}

          {/* 3. System Health (Dynamic) */}
          <LiveTile id="system" title="System" icon={Activity} onExpand={() => handleExpand('system')} color="slate" colSpan={1}>
            <div className="space-y-2 text-sm">
              {healthMetrics.length > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Database</span>
                    <span className="text-green-500 font-bold">{healthMetrics.find(m => m.metric_name === 'database_latency')?.value || 'OK'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">API</span>
                    <span className="text-green-500 font-bold">{healthMetrics.find(m => m.metric_name === 'api_status')?.value || 'OK'}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="text-slate-400 font-bold">Loading...</span>
                </div>
              )}
            </div>
          </LiveTile>

          {/* 4. Session */}
          <LiveTile id="logout" title="Session" icon={LogOut} onExpand={() => signOut()} color="red" colSpan={1}>
            <button className="w-full text-left text-sm font-bold text-red-500 hover:underline">
              Sign Out Now
            </button>
          </LiveTile>

        </div>

      </div>

      {/* --- Expanded Panels --- */}
      <AnimatePresence>

        {/* PROFILE EDITOR */}
        {expandedId === 'profile' && (
          <ExpandedPanel id="profile" title="Identity Management" subtitle="Manage your digital presence on FETS." onClose={handleClose}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 flex flex-col items-center">
                <div className="mb-6">
                  <ProfilePictureUpload
                    staffId={profile?.id || 'temp'}
                    staffName={profileData.fullName}
                    currentAvatarUrl={profile?.avatar_url}
                    onAvatarUpdate={handleAvatarUpdate}
                    size="lg"
                  />
                </div>
                <p className="text-sm text-slate-400 text-center">Click the camera icon to upload a new avatar.</p>
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
                    <input type="text" value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Bio / Role Description</label>
                    <textarea value={profileData.bio} onChange={e => setProfileData({ ...profileData, bio: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-32" placeholder="Describe your role..." />
                  </div>
                  <div className="flex justify-end pt-4">
                    <button onClick={handleProfileUpdate} disabled={isLoading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ExpandedPanel>
        )}

        {/* NEWSROOM */}
        {expandedId === 'news' && (
          <ExpandedPanel id="news" title="Broadcast Newsroom" subtitle="Manage alerts and tickers visible to all users." onClose={handleClose}>
            <NewsManager />
          </ExpandedPanel>
        )}

        {/* SYSTEM */}
        {expandedId === 'system' && (
          <ExpandedPanel id="system" title="System Diagnostics" onClose={handleClose}>
            <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-sm leading-relaxed overflow-x-auto">
              <h4 className="text-amber-400 font-bold mb-4">Diagnostics Log (Supabase Connected)</h4>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-500">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2">Value</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {healthMetrics.map(m => (
                    <tr key={m.metric_name} className="border-b border-slate-800/50">
                      <td className="py-2 font-bold text-slate-200">{m.metric_name}</td>
                      <td className="py-2 font-mono text-blue-400">{m.value}</td>
                      <td className="py-2">
                        {m.status === 'ok' ? <span className="text-green-500">OK</span> : <span className="text-red-500">{m.status.toUpperCase()}</span>}
                      </td>
                      <td className="py-2 text-xs text-slate-500">{new Date().toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6 text-xs text-slate-500">
                System ID: {profile?.id ? profile.id.split('-')[0] : 'ANON'} | Region: AP-SOUTH-1
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-600">
                AI Connection Status: {import.meta.env.VITE_AI_API_KEY ? 'Active (Key Loaded)' : 'Inactive (Mock Mode)'}
              </div>
            </div>
          </ExpandedPanel>
        )}

      </AnimatePresence>

    </div>
  )
}
