import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Key, Lock, Unlock, Eye, EyeOff, Copy,
  ExternalLink, Search, Plus, Trash2, Edit3,
  Tag, Globe, User, Info, Check, ShieldCheck, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'

interface VaultEntry {
  id: string
  title: string
  category: string
  username?: string
  password?: string
  url?: string
  notes?: string
  tags: string[]
  created_at: string
}

export function FetsVault() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [revealMap, setRevealMap] = useState<Record<string, boolean>>({})

  // Form State
  const [newEntry, setNewEntry] = useState({
    title: '',
    category: 'General',
    username: '',
    password: '',
    url: '',
    notes: '',
    tags: ''
  })

  useEffect(() => {
    if (user?.id) {
      fetchEntries()
    }
  }, [user?.id])

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('fets_vault')
        .select('*')
        .order('title', { ascending: true })

      if (error) throw error
      setEntries(data || [])
    } catch (err: any) {
      toast.error('Failed to load vault: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.title) return

    try {
      const { error } = await supabase
        .from('fets_vault')
        .insert([{
          user_id: user?.id,
          title: newEntry.title,
          category: newEntry.category,
          username: newEntry.username,
          password: newEntry.password,
          url: newEntry.url,
          notes: newEntry.notes,
          tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean)
        }])

      if (error) throw error

      toast.success('Credential Securely Stored')
      setShowAddModal(false)
      setNewEntry({
        title: '',
        category: 'General',
        username: '',
        password: '',
        url: '',
        notes: '',
        tags: ''
      })
      fetchEntries()
    } catch (err: any) {
      toast.error('Security Breach: Failed to store data')
    }
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Permanently wipe this record from the vault?')) return

    try {
      const { error } = await supabase
        .from('fets_vault')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Record Wiped')
      fetchEntries()
    } catch (err: any) {
      toast.error('Operation Failed')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} Copied to Clipboard`)
  }

  const toggleReveal = (id: string) => {
    setRevealMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full bg-[#1a1c1e] text-slate-300 rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
      {/* Encryption Header Overlay */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {/* Header Area */}
      <div className="p-6 border-b border-white/5 bg-[#1e2124]/50 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-[0.3em] uppercase text-white">FETS VAULT</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Secure Knowledge Repository</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            <Plus size={14} /> New Entry
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search credentials, clients, or tags..."
            className="w-full bg-[#0d0e10]/80 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Vault Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <Shield size={48} className="animate-pulse mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Accessing Cryptographic Store...</p>
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredEntries.map((entry) => (
              <motion.div
                layout
                key={entry.id}
                className="group relative bg-[#23272b] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all shadow-lg overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/0 group-hover:bg-blue-500/50 transition-all" />

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-wider">{entry.category}</span>
                      <h3 className="text-sm font-black text-white uppercase tracking-tight">{entry.title}</h3>
                    </div>
                    {entry.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map(tag => (
                          <span key={tag} className="text-[8px] font-bold text-slate-500 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                            <Tag size={8} /> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-500 hover:text-white transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Credentials Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Username */}
                    {entry.username && (
                      <div className="bg-[#0d0e10]/60 rounded-xl p-3 border border-white/5 flex items-center justify-between group/field">
                        <div className="flex items-center gap-3 min-w-0">
                          <User size={12} className="text-slate-500" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Username</p>
                            <p className="text-[11px] font-bold text-slate-200 truncate">{entry.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(entry.username!, 'Username')}
                          className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors opacity-0 group-hover/field:opacity-100"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    )}

                    {/* Password */}
                    {entry.password && (
                      <div className="bg-[#0d0e10]/60 rounded-xl p-3 border border-white/5 flex items-center justify-between group/field">
                        <div className="flex items-center gap-3 min-w-0">
                          <Lock size={12} className={`transition-colors ${revealMap[entry.id] ? 'text-blue-400' : 'text-slate-500'}`} />
                          <div className="min-w-0">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Password</p>
                            <p className="text-[11px] font-bold text-slate-200 truncate">
                              {revealMap[entry.id] ? entry.password : '••••••••••••'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleReveal(entry.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                          >
                            {revealMap[entry.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(entry.password!, 'Password')}
                            className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors opacity-0 group-hover/field:opacity-100"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions & Links */}
                  <div className="flex items-center gap-4 pt-1">
                    {entry.url && (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                      >
                        <Globe size={12} /> Access Portal <ExternalLink size={10} />
                      </a>
                    )}
                    {entry.notes && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-help group/notes relative">
                        <Info size={12} /> View Intelligence
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#0d0e10] p-3 rounded-xl border border-white/10 shadow-2xl invisible group-hover/notes:visible opacity-0 group-hover/notes:opacity-100 transition-all z-20">
                          <p className="text-[9px] font-bold text-slate-400 normal-case leading-relaxed">{entry.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
            <Shield size={64} className="mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.3em]">Vault is clean. No records found.</p>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#1a1c1e] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-[#1e2124] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-blue-400" />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Cryptographic Entry</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddEntry} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Title</label>
                    <input
                      type="text"
                      placeholder="e.g. AWS Production"
                      required
                      value={newEntry.title}
                      onChange={e => setNewEntry({ ...newEntry, title: e.target.value })}
                      className="w-full bg-[#0d0e10] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                    <select
                      value={newEntry.category}
                      onChange={e => setNewEntry({ ...newEntry, category: e.target.value })}
                      className="w-full bg-[#0d0e10] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-500/50 transition-all appearance-none"
                    >
                      <option>General</option>
                      <option>Cloud Infrastructure</option>
                      <option>Client Portal</option>
                      <option>Social Management</option>
                      <option>Financial System</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity (Username)</label>
                    <input
                      type="text"
                      value={newEntry.username}
                      onChange={e => setNewEntry({ ...newEntry, username: e.target.value })}
                      className="w-full bg-[#0d0e10] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secret (Password)</label>
                    <input
                      type="password"
                      value={newEntry.password}
                      onChange={e => setNewEntry({ ...newEntry, password: e.target.value })}
                      className="w-full bg-[#0d0e10] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Knowledge Link (URL)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newEntry.url}
                    onChange={e => setNewEntry({ ...newEntry, url: e.target.value })}
                    className="w-full bg-[#0d0e10] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Intelligence Notes</label>
                  <textarea
                    value={newEntry.notes}
                    onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })}
                    placeholder="Important operational notes..."
                    rows={3}
                    className="w-full bg-[#0d0e10] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-500/50 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="tag1, tag2, tag3"
                    value={newEntry.tags}
                    onChange={e => setNewEntry({ ...newEntry, tags: e.target.value })}
                    className="w-full bg-[#0d0e10] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3"
                >
                  <Lock size={16} /> Secure Entry
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
