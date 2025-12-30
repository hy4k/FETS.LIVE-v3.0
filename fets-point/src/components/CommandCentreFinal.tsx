import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Activity, CheckCircle, Play, Sparkles, ListChecks,
    Settings, ChevronRight, Bell, AlertTriangle, Shield, ClipboardCheck,
    CheckCircle2, AlertCircle, Quote, Star, MessageSquare
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { useDashboardStats, useCandidateTrend, useUpcomingSchedule } from '../hooks/useCommandCentre'
import { useNews } from '../hooks/useNewsManager'
import { ExamScheduleWidget } from './ExamScheduleWidget'
import { supabase } from '../lib/supabase'
import { ChecklistFormModal } from './checklist/ChecklistFormModal'
import { NotificationBanner } from './NotificationBanner'
import { ChecklistTemplate } from '../types/checklist'

export default function CommandCentre({ onNavigate }: { onNavigate?: (tab: string) => void }) {
    const { profile } = useAuth()
    const { activeBranch } = useBranch()

    // --- React Query Hooks ---
    const { data: dashboardData, isLoading: isLoadingStats } = useDashboardStats()
    const { data: examSchedule = [], isLoading: isLoadingSchedule } = useUpcomingSchedule()

    // Fetch News for Notice Board
    const { data: newsItems = [] } = useNews()

    const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(null);
    const [showChecklistModal, setShowChecklistModal] = useState(false);

    // --- Integrated Analysis Data Fetching ---
    const [opsMetrics, setOpsMetrics] = useState({ healthScore: 100, critical: 0, open: 0, topIssue: 'None' })
    const [checklistMetrics, setChecklistMetrics] = useState({ total: 0, issues: 0, perfect: 0 })
    const [loadingAnalysis, setLoadingAnalysis] = useState(true)

    // Filter Active News for Notice Board
    const notices = useMemo(() => {
        return newsItems
            .filter((item: any) => item.is_active)
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Newest first
            .slice(0, 5) // Show top 5
    }, [newsItems])

    useEffect(() => {
        // ... (No logic changes, just fetching metrics)
        const fetchAnalysis = async () => {
            try {
                const today = new Date().toISOString().split('T')[0]
                const startOfMonth = new Date(); startOfMonth.setDate(1);

                const { data: events } = await (supabase as any)
                    .from('events')
                    .select('*')
                    .gte('created_at', startOfMonth.toISOString())

                const openEvents = events?.filter((e: any) => e.status !== 'closed') || []
                const critical = openEvents.filter((e: any) => e.priority === 'critical').length
                const major = openEvents.filter((e: any) => e.priority === 'major').length
                const penalty = (critical * 15) + (major * 5) + (openEvents.length * 1)
                const health = Math.max(0, 100 - penalty)

                const categories: Record<string, number> = {}
                events?.forEach((e: any) => { categories[e.category || 'Other'] = (categories[e.category || 'Other'] || 0) + 1 })
                const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]

                setOpsMetrics({
                    healthScore: health,
                    critical,
                    open: openEvents.length,
                    topIssue: topCat ? topCat[0] : 'Stable'
                })

                const { data: checklists } = await (supabase as any)
                    .from('checklist_submissions')
                    .select('answers')
                    .gte('created_at', `${today}T00:00:00`)

                let issues = 0
                checklists?.forEach((Sub: any) => {
                    const ans = Sub.answers?.responses || Sub.answers || {}
                    Object.values(ans).forEach((val: any) => {
                        if (val === false || val === 'No' || val === 'Incomplete') issues++
                    })
                })

                setChecklistMetrics({
                    total: checklists?.length || 0,
                    issues,
                    perfect: (checklists?.length || 0) - (issues > 0 ? 1 : 0)
                })

                setLoadingAnalysis(false)
            } catch (e) {
                console.error("Analysis load failed", e)
                setLoadingAnalysis(false)
            }
        }
        fetchAnalysis()
    }, [])


    const handleOpenChecklist = async (type: 'pre_exam' | 'post_exam' | 'custom') => {
        try {
            const { data, error } = await supabase
                .from('checklist_templates' as any)
                .select('*')
                .eq('type', type)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                toast.error(`No active ${type.replace('_', ' ')} checklist found.`);
                return;
            }

            setActiveTemplate(data as unknown as ChecklistTemplate);
            setShowChecklistModal(true);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load checklist');
        }
    };


    if (isLoadingStats || isLoadingSchedule) {
        return <div className="flex items-center justify-center h-screen bg-[#EEF2F9]"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500"></div></div>
    }

    const bgBase = "bg-[#EEF2F9]"
    const neuCard = "bg-[#EEF2F9] rounded-3xl shadow-[9px_9px_16px_rgb(209,217,230),-9px_-9px_16px_rgba(255,255,255,0.8)] border border-white/50"
    const neuInset = "bg-[#EEF2F9] rounded-2xl shadow-[inset_6px_6px_12px_rgb(209,217,230),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]"
    const neuBtn = "bg-[#EEF2F9] text-slate-600 font-bold rounded-2xl shadow-[6px_6px_10px_rgb(209,217,230),-6px_-6px_10px_rgba(255,255,255,0.8)] hover:shadow-[4px_4px_8px_rgb(209,217,230),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_4px_4px_8px_rgb(209,217,230),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] transition-all border border-white/40"

    return (
        <div className={`min-h-screen ${bgBase} text-slate-700 font-sans pb-12 overflow-x-hidden`} style={{ fontFamily: "'Montserrat', sans-serif" }}>

            <NotificationBanner onNavigate={onNavigate} />

            <div className="max-w-[1800px] mx-auto px-6 pt-8">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col xl:flex-row justify-between items-end mb-10 gap-8"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                                Operational Intelligence {activeBranch !== 'global' && `· ${activeBranch.toUpperCase()}`}
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter uppercase">
                            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600 drop-shadow-sm">Centre</span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className={`${neuCard} pl-6 pr-2 py-2 flex items-center gap-4 min-w-[280px]`}>
                            <div className="flex-1 text-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Officer on Deck</div>
                                <div className="text-sm font-black text-slate-800 truncate max-w-[150px]">{profile?.full_name || 'Guest User'}</div>
                            </div>
                            <div className="w-12 h-12 rounded-full p-1 bg-[#EEF2F9] shadow-[3px_3px_6px_rgb(209,217,230),-3px_-3px_6px_rgba(255,255,255,0.8)]">
                                <img
                                    src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=0F172A&color=EAB308`}
                                    className="w-full h-full object-cover rounded-full"
                                    alt="Profile"
                                />
                            </div>
                        </div>

                        <div className={`${neuCard} px-8 py-4 flex items-center gap-6 hidden md:flex`}>
                            <div className="text-right border-r border-slate-300 pr-6">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</div>
                                <div className="text-md font-bold text-slate-700">
                                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time (IST)</div>
                                <div className="text-lg font-black text-amber-600">
                                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

                    {/* LEFT COLUMN: Checklists -> Metrics -> Calendar */}
                    <div className="xl:col-span-8 flex flex-col gap-8">

                        {/* 1. CHECKLIST (PROTOCOLS) - MOVED TO TOP */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                            className={`${neuCard} p-6`}
                        >
                            <h3 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2 uppercase tracking-tight">
                                <ListChecks className="text-amber-500" size={24} /> Daily Checklist
                            </h3>

                            {/* Horizontal Layout for Actions */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <button
                                    onClick={() => handleOpenChecklist('pre_exam')}
                                    className={`${neuBtn} p-4 flex flex-col items-center justify-center gap-3 h-32 group`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center font-bold shadow-inner group-hover:bg-blue-100 transition-colors">AM</div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Start Protocol</div>
                                        <div className="text-lg font-black text-slate-700 group-hover:text-blue-600 transition-colors">Pre-Exam</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleOpenChecklist('post_exam')}
                                    className={`${neuBtn} p-4 flex flex-col items-center justify-center gap-3 h-32 group`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center font-bold shadow-inner group-hover:bg-purple-100 transition-colors">PM</div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">End Protocol</div>
                                        <div className="text-lg font-black text-slate-700 group-hover:text-purple-600 transition-colors">Post-Exam</div>
                                    </div>
                                </button>

                                <button onClick={() => handleOpenChecklist('custom')} className={`${neuBtn} p-4 flex flex-col items-center justify-center gap-3 h-32 group`}>
                                    <div className={`${neuInset} p-3 text-amber-500 rounded-xl`}>
                                        <Sparkles size={24} />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Special</div>
                                        <div className="text-lg font-black text-slate-700">Custom</div>
                                    </div>
                                </button>

                                <button className={`${neuBtn} p-4 flex flex-col items-center justify-center gap-3 h-32 group`}>
                                    <div className={`${neuInset} p-3 text-slate-400 rounded-xl group-hover:text-slate-600`}>
                                        <Settings size={24} />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">System</div>
                                        <div className="text-lg font-black text-slate-700">Manage</div>
                                    </div>
                                </button>
                            </div>
                        </motion.div>

                        {/* 2. KEY METRICS ROW - MOVED DOWN */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Health Score */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${neuCard} p-6 relative group overflow-hidden`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`${neuInset} p-3 text-amber-600 rounded-xl`}>
                                        <Shield size={20} />
                                    </div>
                                    {opsMetrics.critical > 0 && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>}
                                </div>
                                <div className="text-3xl font-black text-slate-800 mb-1">{Math.round(opsMetrics.healthScore)}<span className="text-sm text-slate-400 font-bold">/100</span></div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Health</div>
                            </motion.div>

                            {/* Checklist Stats */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${neuCard} p-6 relative group overflow-hidden`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`${neuInset} p-3 text-blue-600 rounded-xl`}>
                                        <ClipboardCheck size={20} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-3xl font-black text-slate-800">{checklistMetrics.total}</span>
                                    <span className="text-xs font-medium text-slate-500">Submissions</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex gap-2">
                                    Today's Activity
                                    {checklistMetrics.issues > 0 && <span className="text-red-500 font-bold ml-auto">{checklistMetrics.issues} Issues</span>}
                                </div>
                            </motion.div>

                            {/* Candidates */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`${neuCard} p-6 relative group overflow-hidden`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`${neuInset} p-3 text-green-600 rounded-xl`}>
                                        <Users size={20} />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-800 mb-1">{dashboardData?.todayCandidates || 0}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidates Scheduled</div>
                            </motion.div>
                        </div>

                        {/* 3. CALENDAR WIDGET */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                            className={`${neuCard} p-3 min-h-[400px]`}
                        >
                            <ExamScheduleWidget onNavigate={onNavigate} />
                        </motion.div>

                    </div>


                    {/* RIGHT COLUMN: Notice Board */}
                    <div className="xl:col-span-4 flex flex-col gap-10">

                        {/* NOTICE BOARD */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                            className={`${neuCard} p-8 flex-1 min-h-[500px] relative`}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                                    <Quote className="text-amber-500 rotate-180 fill-current" size={24} /> Notice Board
                                </h3>
                                <div className="w-10 h-10 rounded-full bg-[#EEF2F9] shadow-[inset_3px_3px_6px_rgb(209,217,230),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] flex items-center justify-center text-slate-400">
                                    <Bell size={18} />
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                {notices.length > 0 ? (
                                    notices.map((notice: any, idx: number) => (
                                        <div key={notice.id || idx} className="group cursor-default">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${notice.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {notice.priority === 'high' ? 'Urgent' : 'General'}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {new Date(notice.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-600 leading-relaxed group-hover:text-slate-800 transition-colors">
                                                {notice.content}
                                            </p>
                                            <div className="h-px bg-slate-200 mt-4 w-full" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 flex flex-col items-center gap-3">
                                        <div className={`${neuInset} p-4 rounded-full text-slate-300`}>
                                            <MessageSquare size={32} />
                                        </div>
                                        <p className="text-slate-400 font-medium text-sm">No active notices available.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-4">
                                <button
                                    onClick={() => onNavigate && onNavigate('intelligence')}
                                    className="w-full py-3 text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:gap-3"
                                >
                                    View Intel Feed <ChevronRight size={14} />
                                </button>
                            </div>
                        </motion.div>

                        {/* EMPTY SPACE filler or just let notice board expand? 
                            The notice board is 'flex-1 min-h...', so it will take space. 
                            Since we removed the Protocols from this column, it's just one tall card.
                            This is clean.
                        */}

                    </div>

                </div>

            </div>

            <AnimatePresence>
                {showChecklistModal && activeTemplate && (
                    <ChecklistFormModal
                        template={activeTemplate}
                        onClose={() => setShowChecklistModal(false)}
                        currentUser={profile}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
