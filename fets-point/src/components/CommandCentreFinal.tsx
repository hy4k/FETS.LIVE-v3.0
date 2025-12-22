import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Calendar, Activity, CheckCircle, UserCheck, Clock,
    AlertTriangle, Bell, TrendingUp, FileText, Shield, Building2,
    Plus, Play, Edit, X, Save, CheckCircle2, Trash2, ClipboardList, ClipboardCheck, Sparkles, ListChecks, User, AlertCircle, Settings, ChevronRight
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { useDashboardStats, useCandidateTrend, useUpcomingSchedule } from '../hooks/useCommandCentre'
import { ExamScheduleWidget } from './ExamScheduleWidget'
import { supabase } from '../lib/supabase'
import { ChecklistFormModal } from './checklist/ChecklistFormModal'
import { ChecklistTemplate } from '../types/checklist'

import { NotificationBanner } from './NotificationBanner'

export default function CommandCentre({ onNavigate }: { onNavigate?: (tab: string) => void }) {
    const { profile } = useAuth()
    const { activeBranch } = useBranch()

    // --- React Query Hooks ---
    const { data: dashboardData, isLoading: isLoadingStats } = useDashboardStats()
    const { data: candidateTrend = [], isLoading: isLoadingTrend } = useCandidateTrend()
    const { data: examSchedule = [], isLoading: isLoadingSchedule } = useUpcomingSchedule()

    const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(null);
    const [showChecklistModal, setShowChecklistModal] = useState(false);

    // --- Integrated Analysis Data Fetching ---
    const [opsMetrics, setOpsMetrics] = useState({ healthScore: 100, critical: 0, open: 0, topIssue: 'None' })
    const [checklistMetrics, setChecklistMetrics] = useState({ total: 0, issues: 0, perfect: 0 })
    const [loadingAnalysis, setLoadingAnalysis] = useState(true)

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const today = new Date().toISOString().split('T')[0]
                const startOfMonth = new Date(); startOfMonth.setDate(1);

                // 1. Fetch Events for Ops Health (Global context for Command Centre)
                const { data: events } = await (supabase as any)
                    .from('events')
                    .select('*')
                    .gte('created_at', startOfMonth.toISOString())

                const openEvents = events?.filter((e: any) => e.status !== 'closed') || []
                const critical = openEvents.filter((e: any) => e.priority === 'critical').length
                const major = openEvents.filter((e: any) => e.priority === 'major').length
                const penalty = (critical * 15) + (major * 5) + (openEvents.length * 1)
                const health = Math.max(0, 100 - penalty)

                // Find top issue category
                const categories: Record<string, number> = {}
                events?.forEach((e: any) => { categories[e.category || 'Other'] = (categories[e.category || 'Other'] || 0) + 1 })
                const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]

                setOpsMetrics({
                    healthScore: health,
                    critical,
                    open: openEvents.length,
                    topIssue: topCat ? topCat[0] : 'Stable'
                })

                // 2. Fetch Checklist Stats (Today)
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
                    perfect: (checklists?.length || 0) - (issues > 0 ? 1 : 0) // Approximation for summary
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

    const formattedExamSchedule = useMemo(() => {
        return examSchedule.map((session: any) => {
            const date = new Date(session.date)
            return {
                exam_name: session.exam_name || 'Unknown Exam',
                client_name: session.client_name || 'Unknown Client',
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                session: session.session_type || 'Morning',
                candidates: session.candidate_count || 0,
                remaining_seats: session.available_seats || 0
            }
        })
    }, [examSchedule])


    if (isLoadingStats || isLoadingTrend || isLoadingSchedule) {
        return <div className="flex items-center justify-center h-screen bg-[#F4F7FE]"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500"></div></div>
    }

    // --- Premium Styles ---
    const glassCard = "backdrop-blur-xl bg-white/80 border border-white/60 shadow-[8px_8px_24px_rgba(163,177,198,0.15),-8px_-8px_24px_rgba(255,255,255,0.8)] rounded-3xl transition-all duration-300 hover:shadow-[12px_12px_32px_rgba(163,177,198,0.2),-12px_-12px_32px_rgba(255,255,255,0.9)]"

    return (
        <div className="min-h-screen bg-[#EEF2F9] relative overflow-x-hidden font-sans text-slate-700 pb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>

            {/* Functional Notification Banner */}
            <NotificationBanner onNavigate={onNavigate} />

            {/* Background Decor */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white/80 to-transparent pointer-events-none -z-0" />
            <div className="fixed -top-40 -right-40 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed top-60 -left-20 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-[1700px] mx-auto px-6 pt-4">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6"
                >
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-2 uppercase">
                            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">Centre</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Operational Intelligence Dashboard {activeBranch !== 'global' && `· ${activeBranch.toUpperCase()}`}
                        </p>
                    </div>

                    <div className={`${glassCard} px-6 py-3 flex items-center gap-6`}>
                        <div className="text-right border-r border-slate-200 pr-6">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Date</div>
                            <div className="text-lg font-bold text-slate-700">
                                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time (IST)</div>
                            <div className="text-xl font-black text-amber-500">
                                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Operations & Calendar (Width 8) */}
                    <div className="xl:col-span-8 flex flex-col gap-8">

                        {/* 1. KEY METRICS ROW (Ops Health + Checklist Summary) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Health Score Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className={`${glassCard} p-6 relative overflow-hidden group`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                                    <Activity size={120} />
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                        <Shield size={24} />
                                    </div>
                                    {opsMetrics.critical > 0 && (
                                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle size={12} /> {opsMetrics.critical} Critical
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Ops Health Score</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl font-black ${opsMetrics.healthScore > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {Math.round(opsMetrics.healthScore)}
                                        </span>
                                        <span className="text-sm font-bold text-slate-300">/ 100</span>
                                    </div>
                                    <div className="mt-3 text-xs font-medium text-slate-500">
                                        Top Issue: <span className="text-slate-700 font-bold">{opsMetrics.topIssue}</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Checklist Status Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className={`${glassCard} p-6 relative overflow-hidden group`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                                    <ClipboardCheck size={120} />
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                        <ListChecks size={24} />
                                    </div>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">Today</span>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Checklist Compliance</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-slate-700">{checklistMetrics.total}</span>
                                        <span className="text-sm font-bold text-slate-400">Submissions</span>
                                    </div>
                                    <div className="mt-3 flex gap-3 text-xs font-medium">
                                        <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> {checklistMetrics.perfect} Perfect</span>
                                        {checklistMetrics.issues > 0 && (
                                            <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {checklistMetrics.issues} Issues</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Volume Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                className={`${glassCard} p-6 relative overflow-hidden group`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                                    <Users size={120} />
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                                        <Users size={24} />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Today's Candidates</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-slate-700">{dashboardData?.todayCandidates || 0}</span>
                                        <span className="text-sm font-bold text-slate-400">Scheduled</span>
                                    </div>
                                    <div className="mt-3 text-xs font-medium text-slate-500">
                                        {formattedExamSchedule.filter((s: any) => s.remaining_seats < 5).length > 0 ? (
                                            <span className="text-amber-600 font-bold">High occupancy in some sessions</span>
                                        ) : (
                                            <span className="text-emerald-600">Capacity available</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* 2. CALENDAR WIDGET (Main Feature) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                            className="flex-1"
                        >
                            <ExamScheduleWidget onNavigate={onNavigate} />
                        </motion.div>

                    </div>


                    {/* RIGHT COLUMN: Actions & Tools (Width 4) */}
                    <div className="xl:col-span-4 flex flex-col gap-6">

                        {/* Visual Quick Actions - Checklist */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                            className={`${glassCard} p-6`}
                        >
                            <h3 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2 uppercase tracking-tight">
                                <Sparkles className="text-amber-500" size={20} /> Protocol Actions
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => handleOpenChecklist('pre_exam')}
                                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-1 shadow-lg transition-all hover:shadow-blue-200/50 hover:scale-[1.02]"
                                >
                                    <div className="relative h-full w-full rounded-xl bg-white/10 p-4 flex items-center justify-between backdrop-blur-sm transition-all group-hover:bg-white/20">
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">Start Protocol</div>
                                            <div className="text-xl font-black text-white">Pre-Exam</div>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                            <Play size={20} fill="currentColor" />
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleOpenChecklist('post_exam')}
                                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-1 shadow-lg transition-all hover:shadow-purple-200/50 hover:scale-[1.02]"
                                >
                                    <div className="relative h-full w-full rounded-xl bg-white/10 p-4 flex items-center justify-between backdrop-blur-sm transition-all group-hover:bg-white/20">
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">End of Day</div>
                                            <div className="text-xl font-black text-white">Post-Exam</div>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                            <CheckCircle size={20} />
                                        </div>
                                    </div>
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleOpenChecklist('custom')}
                                        className="group p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-amber-400 hover:bg-amber-50 transition-all flex flex-col items-center justify-center gap-2"
                                    >
                                        <ListChecks size={24} className="text-slate-400 group-hover:text-amber-500" />
                                        <span className="font-bold text-slate-600 group-hover:text-amber-700 text-sm">Custom</span>
                                    </button>

                                    <button
                                        className="group p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2"
                                    >
                                        <Settings size={24} className="text-slate-400 group-hover:text-slate-600" />
                                        <span className="font-bold text-slate-600 text-sm">Manage</span>
                                    </button>
                                </div>

                            </div>
                        </motion.div>

                        {/* Simplified Activity Feed */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                            className={`${glassCard} p-6 flex-1`}
                        >
                            <h3 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2 uppercase tracking-tight">
                                <Activity className="text-blue-500" size={20} /> Live Activity
                            </h3>

                            <div className="space-y-4">
                                {/* New Metrics Display for Activity */}
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><Bell size={18} /></div>
                                        <span className="font-bold text-slate-600 text-sm">Notifications</span>
                                    </div>
                                    <span className="text-xl font-black text-slate-800">{dashboardData?.newMessages || 0}</span>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500"><AlertTriangle size={18} /></div>
                                        <span className="font-bold text-slate-600 text-sm">Pending Incidents</span>
                                    </div>
                                    <span className="text-xl font-black text-slate-800">{dashboardData?.pendingIncidents || 0}</span>
                                </div>
                            </div>

                            <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-black text-white relative overflow-hidden cursor-pointer hover:shadow-xl transition-shadow group">
                                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TrendingUp size={80} />
                                </div>
                                <h4 className="font-bold text-lg mb-1">Full Analysis</h4>
                                <p className="text-slate-400 text-sm mb-4">View complete operational reports.</p>
                                <div className="flex items-center text-amber-500 text-sm font-bold">
                                    View Dashboard <ChevronRight size={16} />
                                </div>
                            </div>
                        </motion.div>

                    </div>

                </div>

            </div>

            {/* Checklist Filling Modal */}
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
