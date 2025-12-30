import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Zap, Search, Newspaper, Activity,
  User, LogOut, ArrowRight, X, Sparkles,
  Maximize2, UserCog, Shield
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { askGemini } from '../lib/gemini'

// Feature Components
import { NewsManager } from './NewsManager'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { UserManagement } from './UserManagement'

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

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ... (Rest of interfaces can stay or be omitted if not replacing)

// --- Live Tile Component (Darker Neumorphism) ---
// (Keep LiveTile and ExpandedPanel as is, assumed unchanged in this block)

// ...

// --- MAIN COMPONENT ---

export function FetsIntelligence() {
  const { profile, signOut } = useAuth()
  const [activeTile, setActiveTile] = useState<string | null>(null)

  // Intelligence States
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([]) // Changed from setAiResponse
  const [isAiLoading, setIsAiLoading] = useState(false)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handlers
  const handleSendMessage = async (query: string) => {
    if (!query.trim()) return

    // Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setIsAiLoading(true)

    try {
      const response = await askGemini(query)

      // Add AI Message
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || "I couldn't process that request.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (error) {
      toast.error('Intelligence Module Offline')
      // Optional: Add error message to chat
    } finally {
      setIsAiLoading(false)
    }
  }

  // Handle Initial Search from Tile
  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setActiveTile('ai-core') // Open the modal
    await handleSendMessage(searchQuery)
    setSearchQuery('') // Clear input after sending
  }

  // Permission Check for User Management
  const isSuperAdmin = profile?.role === 'super_admin' || profile?.email === 'mithun@fets.in';

  return (
    <div className="min-h-screen p-8 text-slate-800">

      {/* Header */}
      <div className="flex items-end justify-between mb-12">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-800 mb-2">
            FETS INTEL
            <span className="text-sky-500">.</span>
          </h1>
          <p className="text-xl font-medium text-slate-500">Advanced Operational Intelligence & Control</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Profile Preview */}
          <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-[#E6E8EC] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-bold text-slate-600 uppercase tracking-wider text-sm">
              SYSTEM SECURE
            </span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* 1. AI Intelligence Core */}
        <LiveTile
          id="ai-core"
          title="Intelligence Core"
          icon={Brain}
          color="indigo"
          colSpan={2}
          onExpand={() => setActiveTile('ai-core')}
        >
          <form onSubmit={handleAiSearch} className="relative z-20">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask FETS Intelligence..."
                className="w-full bg-[#E6E8EC] border-none rounded-2xl py-4 pl-12 pr-4 
                        shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)]
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-lg font-medium text-slate-700 placeholder:text-slate-400 transition-all"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="absolute right-2 top-2 p-2 bg-indigo-500 text-white rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </form>

          <div className="mt-4 px-2 flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider opacity-60">
            <Activity size={14} />
            <span>System Online • Ready for Query</span>
          </div>
        </LiveTile>

        {/* 2. News Room */}
        <LiveTile
          id="news-room"
          title="News Room"
          icon={Newspaper}
          color="emerald"
          onExpand={() => setActiveTile('news-room')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#E6E8EC] border border-white/60">
              <span className="text-xs font-bold text-emerald-600 uppercase">Latest</span>
              <span className="text-xs text-slate-400">2m ago</span>
            </div>
            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-emerald-500 rounded-full"></div>
            </div>
            <p className="text-sm text-slate-500 font-medium">Broadcast operational updates across channels.</p>
          </div>
        </LiveTile>

        {/* 3. User Profile */}
        <LiveTile
          id="user-profile"
          title="My Profile"
          icon={User}
          color="violet"
          onExpand={() => setActiveTile('user-profile')}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 overflow-hidden shadow-inner">
                <img
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=random`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{profile?.first_name} {profile?.last_name}</h3>
              <p className="text-xs font-bold text-violet-500 uppercase tracking-widest">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); signOut(); }}
            className="mt-6 w-full py-3 rounded-xl bg-[#E6E8EC] text-slate-500 font-bold text-sm uppercase tracking-wider
                shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)]
                hover:shadow-[2px_2px_4px_rgba(163,177,198,0.5),-2px_-2px_4px_rgba(255,255,255,0.8)] hover:text-red-500 transition-all border border-transparent hover:border-red-100"
          >
            Sign Out
          </button>
        </LiveTile>

        {/* 4. System Health */}
        <LiveTile
          id="system-health"
          title="System Status"
          icon={Activity}
          color="cyan"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-2xl bg-[#E6E8EC] shadow-inner">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Uptime</div>
              <div className="text-xl font-black text-cyan-600">99.9%</div>
            </div>
            <div className="text-center p-3 rounded-2xl bg-[#E6E8EC] shadow-inner">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Latency</div>
              <div className="text-xl font-black text-emerald-500">12ms</div>
            </div>
          </div>
        </LiveTile>

        {/* 5. User Management (SUPER ADMIN ONLY) */}
        {isSuperAdmin && (
          <LiveTile
            id="user-management"
            title="User Control"
            icon={UserCog}
            color="rose"
            colSpan={2}
            onExpand={() => setActiveTile('user-management')}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-slate-600 max-w-sm">
                  Manage staff roles, permissions, and system access levels.
                  <span className="block text-xs text-rose-500 italic mt-1">*Super Admin Restricted Area</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Shield size={16} className="text-rose-500" />
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">High Security Zone</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#E6E8EC] shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] flex items-center justify-center text-rose-500">
                <ArrowRight size={24} />
              </div>
            </div>
          </LiveTile>
        )}

      </div>

      {/* --- EXPANDED MODALS --- */}
      <AnimatePresence>

        {/* AI Core Modal */}
        {activeTile === 'ai-core' && (
          {/* AI Core Modal */ }
        {activeTile === 'ai-core' && (
          <ExpandedPanel id="ai-core" title="Operational Intelligence" onClose={() => setActiveTile(null)}>
            <div className="flex flex-col h-full gap-6">
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-start gap-4 shrink-0">
                <Sparkles className="text-indigo-500 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-indigo-900 text-lg">AI Assistant Online</h3>
                  <p className="text-indigo-700/80">
                    I have full access to current FETS operational data. Ask me about candidate status, roster gaps, or incident summaries.
                  </p>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 flex flex-col bg-[#E6E8EC] rounded-3xl shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] border border-white/50 overflow-hidden relative">

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                      <Brain size={64} className="mb-4" />
                      <p className="font-medium">Ready to analyze operational data.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`
                            max-w-[80%] p-5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm
                            ${msg.role === 'user'
                              ? 'bg-slate-800 text-white rounded-tr-none'
                              : 'bg-[#E6E8EC] text-slate-700 rounded-tl-none border border-white/60 shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.8)]'
                            }
                          `}
                        >
                          {msg.content}
                          <div className={`text-[10px] mt-2 opacity-60 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#E6E8EC] p-4 rounded-2xl rounded-tl-none border border-white/60 shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.8)] flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#E6E8EC] border-t border-white/50">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSendMessage(searchQuery)
                      setSearchQuery('')
                    }}
                    className="relative"
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type your query here..."
                      className="w-full bg-[#E6E8EC] border-none rounded-2xl py-4 pl-6 pr-14
                                  shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]
                                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={!searchQuery.trim() || isAiLoading}
                      className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg 
                                 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </ExpandedPanel>
        )}

        {/* News Room Modal */}
        {activeTile === 'news-room' && (
          <ExpandedPanel id="news-room" title="Global News Room" onClose={() => setActiveTile(null)}>
            <NewsManager />
          </ExpandedPanel>
        )}

        {/* User Profile Modal */}
        {activeTile === 'user-profile' && (
          <ExpandedPanel id="user-profile" title="My Profile Settings" onClose={() => setActiveTile(null)}>
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
                <ProfilePictureUpload
                  staffId={profile?.id || ''}
                  staffName={profile?.full_name || 'User'}
                  currentAvatarUrl={profile?.avatar_url}
                  onAvatarUpdate={(url) => {
                    // Force refresh to show new avatar since we don't have a context updater yet
                    window.location.reload()
                  }}
                />
                <h2 className="text-2xl font-bold text-slate-800 mt-4">{profile?.full_name}</h2>
                <p className="text-slate-500 font-medium">{profile?.email}</p>
                <div className="mt-6 flex justify-center gap-3">
                  <span className="px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-bold text-xs uppercase tracking-wider border border-violet-200">
                    {profile?.role}
                  </span>
                  <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-wider border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </ExpandedPanel>
        )}

        {/* User Management Modal (Super Admin) */}
        {activeTile === 'user-management' && isSuperAdmin && (
          <ExpandedPanel id="user-management" title="User Administration" onClose={() => setActiveTile(null)}>
            <UserManagement />
          </ExpandedPanel>
        )}

      </AnimatePresence>
    </div>
  )
}
