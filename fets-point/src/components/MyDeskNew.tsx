import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, LogOut, ShieldCheck, Mail, MapPin, Briefcase, GraduationCap,
  CheckSquare, Info, X, MessageSquare,
  ExternalLink, Brain, BookOpen, Key, History, Sparkles
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { Fetchat } from './Fetchat'
import { ToDoMatrix } from './ToDoMatrix'
import { DigitalNotebook } from './DigitalNotebook'
import { FetsVault } from './FetsVault'
import { DailyLog } from './DailyLog'

// --- Glassmorphism Components ---

const GlassCard = ({ children, className = "", glow = false }: { children: React.ReactNode, className?: string, glow?: boolean }) => (
  <div className={`
    relative backdrop-blur-xl bg-white/10 
    border border-white/20 
    shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
    rounded-3xl overflow-hidden
    ${glow ? 'before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#ffbf00]/10 before:via-transparent before:to-purple-500/10 before:pointer-events-none' : ''}
    ${className}
  `}>
    {children}
  </div>
)

const GlassInset = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`
    backdrop-blur-md bg-black/20 
    border border-white/10 
    rounded-xl
    ${className}
  `}>
    {children}
  </div>
)

const PremiumButton = ({ children, onClick, active = false, className = "", variant = "default" }: { children: React.ReactNode, onClick?: () => void, active?: boolean, className?: string, variant?: "default" | "danger" }) => {
  const baseClasses = `
    relative overflow-hidden
    px-5 py-2.5 rounded-xl
    font-black text-[11px] uppercase tracking-widest
    transition-all duration-300 ease-out
    flex items-center gap-2 justify-center
    border
    cursor-pointer
  `

  const variants = {
    default: active
      ? 'bg-gradient-to-r from-[#ffbf00] to-[#ff9500] text-black border-[#ffbf00]/50 shadow-[0_0_30px_rgba(255,191,0,0.4)]'
      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20',
    danger: 'bg-gradient-to-r from-rose-500/20 to-rose-600/20 text-rose-400 border-rose-500/30 hover:from-rose-500/30 hover:to-rose-600/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {active && <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer" />}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center text-[11px] py-1">
    <span className="font-medium text-white/50 uppercase tracking-wider">{label}</span>
    <span className="font-bold text-white/90 uppercase text-right">{value || '---'}</span>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8" glow>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#ffbf00] to-[#ff9500] rounded-xl">
                <Lock size={18} className="text-black" />
              </div>
              Reset Security
            </h3>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-2">New Password</label>
              <GlassInset>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-transparent p-4 outline-none text-white font-medium placeholder:text-white/30"
                  placeholder="••••••••"
                  required
                />
              </GlassInset>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-2">Confirm Credentials</label>
              <GlassInset>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-transparent p-4 outline-none text-white font-medium placeholder:text-white/30"
                  placeholder="••••••••"
                  required
                />
              </GlassInset>
            </div>
            <PremiumButton className="w-full py-4" active>
              {loading ? 'SECURING...' : 'VERIFY & UPDATE'}
            </PremiumButton>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  )
}

const ProfilePanel = ({ profile, onSignOut }: { profile: any, onSignOut: () => void }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  return (
    <div className="h-full flex flex-col">
      <GlassCard className="flex-1 p-6 flex flex-col" glow>
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#ffbf00]/50 to-transparent" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#ffbf00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center relative z-10 mb-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ffbf00] to-[#ff9500] rounded-full blur-xl opacity-30 animate-pulse" />
            <ProfilePictureUpload
              staffId={profile?.id || ''}
              staffName={profile?.full_name || 'User'}
              currentAvatarUrl={profile?.avatar_url}
              onAvatarUpdate={() => window.location.reload()}
            />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight mb-1 uppercase">{profile?.full_name}</h2>
          <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
            <Mail size={12} className="text-[#ffbf00]" />
            {profile?.email}
          </div>
          {profile?.branch_assigned && (
            <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-medium mt-1">
              <MapPin size={10} />
              {profile?.branch_assigned}
            </div>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
          <GlassInset className="p-3 text-center">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Role</span>
            <span className="text-[#ffbf00] font-black uppercase text-xs">{profile?.role?.replace('_', ' ')}</span>
          </GlassInset>
          <GlassInset className="p-3 text-center">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Status</span>
            <span className="text-emerald-400 font-black uppercase text-xs flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {profile?.status || 'Active'}
            </span>
          </GlassInset>
        </div>

        {/* Info Sections - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 relative z-10 pr-1">
          {/* Employment */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={12} className="text-white/40" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Employment</span>
            </div>
            <GlassInset className="p-3 space-y-1">
              <DetailRow label="Dept" value={profile?.department} />
              <DetailRow label="Position" value={profile?.position} />
            </GlassInset>
          </div>

          {/* Skills */}
          {profile?.skills?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap size={12} className="text-white/40" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Skills</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 4).map((s: string) => (
                  <span key={s} className="px-2 py-1 bg-[#ffbf00]/10 border border-[#ffbf00]/20 rounded-lg text-[9px] font-bold text-[#ffbf00] uppercase">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          {profile?.permissions && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={12} className="text-white/40" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Licenses</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(profile.permissions).filter(([_, val]) => val === true).slice(0, 4).map(([key]) => (
                  <GlassInset key={key} className="p-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <span className="text-[8px] font-bold text-white/70 uppercase truncate">{key.replace('_', ' ')}</span>
                  </GlassInset>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-6 relative z-10">
          <PremiumButton onClick={() => setShowPasswordModal(true)} className="w-full">
            <Lock size={14} /> CREDENTIALS
          </PremiumButton>
          <PremiumButton onClick={onSignOut} variant="danger" className="w-full">
            <LogOut size={14} /> SECURE LOGOUT
          </PremiumButton>
        </div>

        <AnimatePresence>
          {showPasswordModal && (
            <PasswordModal onClose={() => setShowPasswordModal(false)} />
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  )
}

const PageStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .animate-shimmer {
        animation: shimmer 2s infinite;
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 191, 0, 0.3);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 191, 0, 0.5);
      }
    `
  }} />
)

export function MyDeskNew() {
  const { profile, signOut } = useAuth()
  const { activeBranch } = useBranch()
  const [activeRightTab, setActiveRightTab] = useState('todo')
  const [isFetchatDetached, setIsFetchatDetached] = useState(false)

  const menuItems = [
    { id: 'todo', label: 'TO DO', icon: CheckSquare },
    { id: 'fetchat', label: 'FETCHAT', icon: MessageSquare },
    { id: 'notes', label: 'NOTES', icon: BookOpen },
    { id: 'vault', label: 'VAULT', icon: Key },
    { id: 'log', label: 'DAILY LOG', icon: History }
  ]

  return (
    <>
      <PageStyles />
      <div
        className="min-h-screen p-4 lg:p-6 relative overflow-hidden"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)'
        }}
      >
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-[#ffbf00]/8 via-transparent to-transparent blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-purple-500/8 via-transparent to-transparent blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] max-w-[1920px] mx-auto relative z-10">

          {/* LEFT COLUMN: Profile Panel - Compact */}
          <div className="lg:w-[280px] xl:w-[320px] flex-shrink-0 flex flex-col">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-3"
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#ffbf00] to-[#ff9500] shadow-[0_0_30px_rgba(255,191,0,0.3)]">
                <Sparkles size={20} className="text-black" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white uppercase">
                  MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbf00] to-[#ff9500]">DESK</span>
                </h1>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{format(new Date(), 'EEEE, MMM dd')}</p>
              </div>
            </motion.div>

            {/* Profile Panel */}
            <div className="flex-1 min-h-0">
              <ProfilePanel profile={profile} onSignOut={signOut} />
            </div>
          </div>

          {/* RIGHT COLUMN: Feature Hub - Takes Remaining Space */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Menu Bar */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {menuItems.map(item => (
                  <PremiumButton
                    key={item.id}
                    onClick={() => setActiveRightTab(item.id)}
                    active={activeRightTab === item.id}
                  >
                    <item.icon size={14} />
                    <span className="hidden sm:inline">{item.label}</span>
                    {item.id === 'fetchat' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </PremiumButton>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <GlassInset className="px-3 py-1.5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse" />
                  <span className="text-[9px] font-bold text-white/50 uppercase hidden sm:inline">{activeBranch}</span>
                </GlassInset>
                <GlassInset className="px-3 py-1.5">
                  <span className="text-sm font-black text-white/70">{format(new Date(), 'HH:mm')}</span>
                </GlassInset>
              </div>
            </div>

            {/* Feature Content Area - Full Height */}
            <div className="flex-1 min-h-0 overflow-hidden rounded-3xl">
              <AnimatePresence mode="wait">
                {activeRightTab === 'fetchat' && !isFetchatDetached && (
                  <motion.div
                    key="fetchat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <Fetchat onToggleDetach={() => setIsFetchatDetached(true)} />
                  </motion.div>
                )}

                {activeRightTab === 'todo' && (
                  <motion.div
                    key="todo"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <ToDoMatrix />
                  </motion.div>
                )}

                {activeRightTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <DigitalNotebook />
                  </motion.div>
                )}

                {activeRightTab === 'vault' && (
                  <motion.div
                    key="vault"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <FetsVault />
                  </motion.div>
                )}

                {activeRightTab === 'log' && (
                  <motion.div
                    key="log"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <DailyLog />
                  </motion.div>
                )}

                {isFetchatDetached && activeRightTab === 'fetchat' && (
                  <motion.div
                    key="detached-placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <GlassCard className="h-full flex flex-col items-center justify-center" glow>
                      <div className="bg-gradient-to-br from-[#ffbf00] to-[#ff9500] p-6 rounded-full mb-6 shadow-[0_0_40px_rgba(255,191,0,0.4)] animate-pulse">
                        <ExternalLink size={40} className="text-black" />
                      </div>
                      <h4 className="font-black text-lg uppercase tracking-widest text-white mb-2">FETCHAT DETACHED</h4>
                      <p className="text-sm text-white/50 text-center max-w-md mb-8">
                        Communications Hub is active in a floating overlay for cross-module accessibility.
                      </p>
                      <PremiumButton onClick={() => setIsFetchatDetached(false)} active>
                        RESTORE TO GRID
                      </PremiumButton>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* DETACHED FETCHAT PORTAL */}
        {isFetchatDetached && (
          <Fetchat
            isDetached
            onToggleDetach={() => setIsFetchatDetached(false)}
            onClose={() => setIsFetchatDetached(false)}
          />
        )}

        {/* Footer Branding */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-20 pointer-events-none">
          <Brain size={16} className="text-[#ffbf00]" />
          <span className="font-black text-xs uppercase tracking-[0.3em] text-white">FETS PLATFORM</span>
        </div>
      </div>
    </>
  )
}

export default MyDeskNew
