import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    History, Send, Clock, User,
    ChevronRight, Trash2, Calendar,
    AlertCircle, CheckCircle2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import { format, isToday } from 'date-fns'

interface LogEntry {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles?: {
        full_name: string
    }
}

export function DailyLog() {
    const { user } = useAuth()
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [newEntry, setNewEntry] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchLogs()

        // Real-time subscription for immediate updates (useful for handovers)
        const subscription = supabase
            .channel('daily_logs_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, () => {
                fetchLogs()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [])

    const fetchLogs = async () => {
        try {
            // Joining with profiles to show who wrote what
            const { data, error } = await supabase
                .from('daily_logs')
                .select(`
          *,
          profiles:user_id ( full_name )
        `)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            setLogs(data || [])
        } catch (err: any) {
            console.error('Error fetching logs:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEntry.trim() || submitting) return

        setSubmitting(true)
        try {
            const { error } = await supabase
                .from('daily_logs')
                .insert([{
                    user_id: user?.id,
                    content: newEntry.trim()
                }])

            if (error) throw error

            setNewEntry('')
            toast.success('Operational Update Logged')
            fetchLogs()
        } catch (err: any) {
            toast.error('Logging failed: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const deleteEntry = async (id: string) => {
        try {
            const { error } = await supabase
                .from('daily_logs')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Entry removed')
            fetchLogs()
        } catch (err: any) {
            toast.error('Delete failed')
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] text-slate-700 rounded-3xl overflow-hidden border border-slate-200/60 shadow-xl relative">
            {/* Header Area */}
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-xl text-white">
                        <History size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black tracking-[0.2em] uppercase text-slate-900">Daily Log</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Operational Continuity Timeline</p>
                    </div>
                </div>
            </div>

            {/* Entry Input Area */}
            <div className="p-6 bg-white/50 backdrop-blur-sm border-b border-slate-100">
                <form onSubmit={handleAddEntry} className="relative">
                    <textarea
                        value={newEntry}
                        onChange={(e) => setNewEntry(e.target.value)}
                        placeholder="Record observation, shift update, or handover note..."
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-4 pr-14 text-sm font-medium outline-none focus:border-slate-900 focus:bg-white transition-all resize-none placeholder:text-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={!newEntry.trim() || submitting}
                        className="absolute right-3 bottom-4 p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all shadow-lg"
                    >
                        {submitting ? (
                            <Clock size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </form>
            </div>

            {/* Timeline Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Accessing Logs...</p>
                    </div>
                ) : logs.length > 0 ? (
                    <div className="relative">
                        {/* The Vertical Line */}
                        <div className="absolute left-3.5 top-0 bottom-0 w-[2px] bg-slate-200" />

                        <div className="space-y-8 relative">
                            <AnimatePresence initial={false}>
                                {logs.map((log) => {
                                    const isEntryToday = isToday(new Date(log.created_at));
                                    const isOwnEntry = log.user_id === user?.id;

                                    return (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`relative pl-10 group ${isEntryToday ? '' : 'opacity-80'}`}
                                        >
                                            {/* Timeline Dot */}
                                            <div className={`absolute left-0 top-1.5 w-7 h-7 rounded-full border-4 border-[#f8fafc] flex items-center justify-center transition-all z-10 
                        ${isEntryToday ? 'bg-slate-900 shadow-md' : 'bg-slate-300'}`}
                                            >
                                                {isEntryToday ? (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                ) : null}
                                            </div>

                                            <div className={`p-5 rounded-2xl transition-all border
                        ${isEntryToday
                                                    ? 'bg-white border-slate-200 shadow-sm'
                                                    : 'bg-white/40 border-transparent hover:border-slate-200 hover:bg-white'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                                                            {log.profiles?.full_name || 'System User'}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                            {format(new Date(log.created_at), 'HH:mm')} • {format(new Date(log.created_at), 'MMM dd')}
                                                        </span>
                                                    </div>
                                                    {isOwnEntry && (
                                                        <button
                                                            onClick={() => deleteEntry(log.id)}
                                                            className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                    {log.content}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
                        <History size={48} className="mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Timeline is pristine.</p>
                        <p className="text-[9px] font-bold uppercase mt-1 tracking-wider">No operational updates recorded yet.</p>
                    </div>
                )}
            </div>

            {/* Bottom Status */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Sync Active</span>
                </div>
            </div>
        </div>
    )
}
