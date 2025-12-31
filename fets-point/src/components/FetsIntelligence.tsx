import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Zap, Search, Newspaper, Activity,
  User, LogOut, ArrowRight, X, Sparkles,
  Maximize2, UserCog, Shield, Building2,
  LayoutDashboard, Menu, ChevronRight,
  Terminal, Database, Radio, Bell
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { askGemini } from '../lib/gemini'

// Feature Components
import { NewsManager } from './NewsManager'
import { UserManagement } from './UserManagement'
import IncidentManager from './IncidentManager'
import { ClientControl } from './ClientControl'

// --- Interfaces ---

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// --- Sidebar Button Component ---
const SidebarButton = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  color = "amber"
}: {
  icon: React.ElementType,
  label: string,
  isActive: boolean,
  onClick: () => void,
  color?: string
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 8, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 group
        ${isActive
          ? `bg-white shadow-[10px_10px_20px_rgba(163,177,198,0.3),-10px_-10px_20px_rgba(255,255,255,0.7)] border border-white`
          : 'bg-white/40 backdrop-blur-md border border-white/40 hover:border-white/80'
        }
      `}
    >
      {/* Active Glow */}
      {isActive && (
        <motion.div
          layoutId="active-glow"
          className={`absolute inset-0 rounded-2xl opacity-20 bg-gradient-to-r from-${color}-400 to-${color}-600 blur-2xl`}
        />
      )}

      <div className={`
        p-3 rounded-xl transition-all duration-700
        ${isActive
          ? `bg-gradient-to-br from-${color}-500 to-${color}-700 text-white shadow-lg rotate-[360deg]`
          : `bg-white shadow-sm text-slate-400 group-hover:text-${color}-600 group-hover:shadow-md`
        }
      `}>
        <Icon size={20} />
      </div>

      <span className={`
        text-sm font-black uppercase tracking-[0.2em] transition-all font-['Rajdhani']
        ${isActive ? 'text-slate-800 translate-x-1' : 'text-slate-500 group-hover:text-slate-700'}
      `}>
        {label}
      </span>

      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className={`ml-auto w-1.5 h-1.5 rounded-full bg-${color}-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]`}
        />
      )}
    </motion.button>
  )
}

// --- Main Content Wrapper ---
const ContentPanel = ({ id, icon: Icon, title, subtitle, children, color = "indigo" }: { id: string, icon: any, title: string, subtitle: string, children: React.ReactNode, color?: string }) => {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      <div className="flex items-center gap-6 mb-8 px-4">
        <div className={`p-5 rounded-[2rem] bg-[#E6E8EC] shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.8)] border border-white/60 text-${color}-600`}>
          <Icon size={32} />
        </div>
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">{title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#E6E8EC] rounded-[3rem] shadow-[inset_12px_12px_24px_rgba(163,177,198,0.4),inset_-12px_-12px_24px_rgba(255,255,255,0.8)] border border-white/40 overflow-hidden relative">
        <div className="h-full overflow-y-auto p-4 md:p-10 custom-scrollbar">
          {children}
        </div>
      </div>
    </motion.div>
  )
}

// --- MAIN COMPONENT ---

export function FetsIntelligence() {
  const { profile } = useAuth()
  const [activeSection, setActiveSection] = useState<string>('intelligence')

  // Intelligence States
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
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
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || "I couldn't process that request.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (error) {
      toast.error('Intelligence Module Offline')
    } finally {
      setIsAiLoading(false)
    }
  }

  const isSuperAdmin = profile?.role === 'super_admin' || profile?.email === 'mithun@fets.in';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col h-screen overflow-hidden gap-12">

      {/* --- PREMIUM HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div className="animate-in fade-in slide-in-from-left duration-700">
          <h1 className="text-6xl font-black tracking-tighter uppercase mb-2 italic">
            FETS <span className="text-indigo-600">INTELLIGENCE</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-12 bg-indigo-500 rounded-full" />
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Command & Control Neural Node</p>
            <div className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-indigo-500 font-black uppercase text-[10px] tracking-widest px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100">Live Grid</span>
          </div>
        </div>

        <div className="flex gap-4 animate-in fade-in slide-in-from-right duration-700">
          <div className="bg-white/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/60 shadow-sm flex items-center gap-3">
            <Activity size={18} className="text-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Neural Connection</span>
              <span className="text-sm font-black text-emerald-600 tracking-tight uppercase font-['Rajdhani']">Stable Link</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Sidebar Navigation */}
        <aside className="w-80 flex flex-col h-full bg-white/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-[20px_20px_40px_rgba(163,177,198,0.2),-20px_-20px_40px_rgba(255,255,255,0.8)] border border-white/80">

          <nav className="flex-1 flex flex-col gap-10 overflow-y-auto no-scrollbar">
            {/* Operational Group */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-['Rajdhani']">Operational</span>
              </div>
              <div className="space-y-3">
                <SidebarButton
                  icon={Brain}
                  label="AI CORE"
                  isActive={activeSection === 'intelligence'}
                  onClick={() => setActiveSection('intelligence')}
                  color="indigo"
                />
                <SidebarButton
                  icon={Newspaper}
                  label="NEWS ROOM"
                  isActive={activeSection === 'news'}
                  onClick={() => setActiveSection('news')}
                  color="emerald"
                />
                <SidebarButton
                  icon={Shield}
                  label="INCIDENT COMMAND"
                  isActive={activeSection === 'incidents'}
                  onClick={() => setActiveSection('incidents')}
                  color="rose"
                />
              </div>
            </div>

            {/* Administration Group */}
            {isSuperAdmin && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2 pt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-['Rajdhani']">Administration</span>
                </div>
                <div className="space-y-3">
                  <SidebarButton
                    icon={UserCog}
                    label="USER CONTROL"
                    isActive={activeSection === 'users'}
                    onClick={() => setActiveSection('users')}
                    color="blue"
                  />
                  <SidebarButton
                    icon={Building2}
                    label="CLIENT MASTER"
                    isActive={activeSection === 'clients'}
                    onClick={() => setActiveSection('clients')}
                    color="purple"
                  />
                </div>
              </div>
            )}
          </nav>

          {/* System Health Footer */}
          <div className="mt-auto pt-8 border-t border-slate-100">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
              <div className="relative">
                <Activity size={18} className="text-emerald-500" />
                <div className="absolute inset-0 bg-emerald-400 blur-md opacity-20" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest font-['Rajdhani']">System Integrity</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lvl 4 Authorization</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 h-full">
          <AnimatePresence mode="wait">

            {/* Intelligence Core */}
            {activeSection === 'intelligence' && (
              <ContentPanel
                id="intelligence"
                icon={Brain}
                title="Intelligence Core"
                subtitle="Neural Processing & Data Analysis"
                color="indigo"
              >
                <div className="flex flex-col h-full gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                    {[
                      { icon: Database, label: 'Data Latency', value: '14ms', color: 'emerald' },
                      { icon: Radio, label: 'Network Pulse', value: 'Nominal', color: 'indigo' },
                      { icon: Zap, label: 'Compute Load', value: '2.4 TFLOPs', color: 'amber' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-[#E6E8EC] p-6 rounded-[2rem] shadow-[6px_6px_12px_rgba(163,177,198,0.4),-6px_-6px_12px_rgba(255,255,255,0.8)] border border-white/60">
                        <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-600 w-fit mb-3`}>
                          <stat.icon size={16} />
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className="text-xl font-black text-slate-800">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 flex flex-col bg-[#E6E8EC] rounded-[2.5rem] shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] border border-white/50 overflow-hidden relative min-h-0">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40">
                          <Sparkles size={64} className="mb-4 animate-pulse" />
                          <p className="font-black uppercase tracking-[0.3em] text-xs text-center">Neural Engine Synchronized<br />Waiting for Instruction</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`
                                            max-w-[80%] p-6 rounded-[2rem] text-sm font-medium leading-relaxed
                                            ${msg.role === 'user'
                                  ? 'bg-slate-800 text-white rounded-tr-none shadow-xl'
                                  : 'bg-[#F0F2F5] text-slate-700 rounded-tl-none border border-white/80 shadow-[4px_4px_12px_rgba(163,177,198,0.5)]'
                                }
                                        `}
                            >
                              {msg.content}
                              <div className={`text-[8px] font-black mt-3 opacity-60 uppercase tracking-widest ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-[#F0F2F5] p-5 rounded-3xl rounded-tl-none border border-white/80 shadow-md flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-[#E6E8EC]/80 backdrop-blur-sm border-t border-white/40">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleSendMessage(searchQuery)
                          setSearchQuery('')
                        }}
                        className="relative flex items-center gap-4"
                      >
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Execute intelligence query..."
                            className="w-full bg-[#E6E8EC] border-none rounded-2xl py-5 pl-8 pr-16
                                                shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.8)]
                                                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-bold uppercase text-xs tracking-widest"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <div className="h-4 w-[1px] bg-slate-200 mx-2" />
                            <span className="text-[10px] font-black text-slate-300 uppercase">CMD</span>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={!searchQuery.trim() || isAiLoading}
                          className="p-5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-[1.5rem] shadow-xl 
                                                disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
                        >
                          <ArrowRight size={24} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </ContentPanel>
            )}

            {/* News Room */}
            {activeSection === 'news' && (
              <ContentPanel
                id="news"
                icon={Newspaper}
                title="News Room"
                subtitle="Organizational Communication Terminal"
                color="emerald"
              >
                <NewsManager />
              </ContentPanel>
            )}

            {/* Incident Command */}
            {activeSection === 'incidents' && (
              <ContentPanel
                id="incidents"
                icon={Shield}
                title="Incident Command"
                subtitle="Operational Failure Tracking & Resolution"
                color="rose"
              >
                <IncidentManager />
              </ContentPanel>
            )}

            {/* User Management */}
            {activeSection === 'users' && isSuperAdmin && (
              <ContentPanel
                id="users"
                icon={UserCog}
                title="User Control"
                subtitle="Personnel Permissions & Access Hierarchies"
                color="blue"
              >
                <UserManagement />
              </ContentPanel>
            )}

            {/* Client Control */}
            {activeSection === 'clients' && isSuperAdmin && (
              <ContentPanel
                id="clients"
                icon={Building2}
                title="Client Master"
                subtitle="Global Client Protocols & Master Data"
                color="purple"
              >
                <ClientControl />
              </ContentPanel>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
