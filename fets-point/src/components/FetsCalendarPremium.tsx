import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, X, Check, Clock, Users, Eye, MapPin, Building, Filter, TrendingUp, Target, Award, Shield, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarAnalysis } from './CalendarAnalysis'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useBranchFilter } from '../hooks/useBranchFilter'
import { formatDateForIST, getCurrentISTDateString, isToday as isTodayIST, formatDateForDisplay } from '../utils/dateUtils'
import { validateSessionCapacity, getCapacityStatusColor, formatCapacityDisplay, getBranchCapacity } from '../utils/sessionUtils'
import { useCalendarSessions, useSessionMutations } from '../hooks/useCalendarSessions'
import { toast } from 'react-hot-toast'

interface Session {
  id?: number
  client_name: string
  exam_name: string
  date: string
  candidate_count: number
  start_time: string
  end_time: string
  user_id: string
  created_at?: string
  updated_at?: string
  branch_location?: 'calicut' | 'cochin' | 'kannur'
}

const CLIENT_COLORS = {
  'PEARSON': {
    bg: '#EFF6FF',
    text: '#1E40AF',
    border: '#3B82F6',
    accent: '#DBEAFE',
    shadow: '0 4px 12px -2px rgba(59, 130, 246, 0.15)'
  },
  'VUE': {
    bg: '#ECFDF5',
    text: '#047857',
    border: '#10B981',
    accent: '#D1FAE5',
    shadow: '0 4px 12px -2px rgba(16, 185, 129, 0.15)'
  },
  'ETS': {
    bg: '#FFFBEB',
    text: '#B45309',
    border: '#F59E0B',
    accent: '#FEF3C7',
    shadow: '0 4px 12px -2px rgba(245, 158, 11, 0.15)'
  },
  'PSI': {
    bg: '#F5F3FF',
    text: '#6D28D9',
    border: '#8B5CF6',
    accent: '#EDE9FE',
    shadow: '0 4px 12px -2px rgba(139, 92, 246, 0.15)'
  },
  'PROMETRIC': {
    bg: '#FEF2F2',
    text: '#B91C1C',
    border: '#EF4444',
    accent: '#FEE2E2',
    shadow: '0 4px 12px -2px rgba(239, 68, 68, 0.15)'
  },
  'OTHER': {
    bg: '#F8FAFC',
    text: '#475569',
    border: '#94A3B8',
    accent: '#F1F5F9',
    shadow: '0 4px 12px -2px rgba(100, 116, 139, 0.15)'
  }
}

const CENTRE_COLORS = {
  'calicut': { primary: '#FFFFFF', secondary: '#F1F5F9', light: '#FFFFFF', accent: '#E5E7EB', shadow: 'rgba(0,0,0,0.06)', glass: 'rgba(255,255,255,0.6)' },
  'cochin': { primary: '#FFFFFF', secondary: '#F1F5F9', light: '#FFFFFF', accent: '#E5E7EB', shadow: 'rgba(0,0,0,0.06)', glass: 'rgba(255,255,255,0.6)' },
  'global': { primary: '#FFFFFF', secondary: '#F1F5F9', light: '#FFFFFF', accent: '#E5E7EB', shadow: 'rgba(0,0,0,0.06)', glass: 'rgba(255,255,255,0.6)' }
}

type ClientType = keyof typeof CLIENT_COLORS

export function FetsCalendarPremium() {
  const { user, hasPermission } = useAuth()
  const canEdit = hasPermission('calendar_edit')
  const { activeBranch } = useBranch()
  const { applyFilter, isGlobalView } = useBranchFilter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const { data: sessions = [], isLoading: loading, isError, error } = useCalendarSessions(currentDate, activeBranch, applyFilter, isGlobalView)
  const { addSession, updateSession, deleteSession, isMutating } = useSessionMutations()
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [formData, setFormData] = useState({
    client_name: '',
    exam_name: '',
    date: '',
    candidate_count: 1,
    start_time: '09:00',
    end_time: '17:00'
  })

  useEffect(() => {
    if (isError) {
      toast.error(`Failed to load sessions: ${error.message}`)
    }
  }, [isError, error])

  const getDaysInMonth = useCallback(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }, [currentDate])

  const getSessionsForDate = (date: Date) => {
    const dateStr = formatDateForIST(date)
    return sessions.filter(session => session.date === dateStr)
  }

  const normalizeClientName = (name: string): string => {
    const upper = name.toUpperCase()
    if (upper.includes('PEARSON') || upper.includes('VUE')) return 'PEARSON'
    if (upper.includes('ETS') || upper.includes('TOEFL') || upper.includes('GRE')) return 'ETS'
    if (upper.includes('PROMETRIC')) return 'PROMETRIC'
    if (upper.includes('PSI')) return 'PSI'
    return upper
  }

  const getClientAggregates = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    const aggregates: { [key: string]: { candidates: number, sessions: number, displayName: string } } = {}

    daySessions.forEach(session => {
      const normalizedKey = normalizeClientName(session.client_name)
      if (!aggregates[normalizedKey]) {
        aggregates[normalizedKey] = {
          candidates: 0,
          sessions: 0,
          displayName: session.client_name
        }
      }
      aggregates[normalizedKey].candidates += session.candidate_count
      aggregates[normalizedKey].sessions += 1
    })

    return aggregates
  }

  const getClientType = (clientName: string): ClientType => {
    const normalized = normalizeClientName(clientName)
    if (normalized in CLIENT_COLORS) return normalized as ClientType
    return 'OTHER'
  }

  const getClientLogo = (clientName: string) => {
    const upperName = clientName.toUpperCase()
    if (upperName.includes('PROMETRIC')) return '/client-logos/prometric.png'
    if (upperName.includes('ETS') || upperName.includes('TOEFL') || upperName.includes('GRE')) return '/client-logos/ets.png'
    if (upperName.includes('PEARSON') || upperName.includes('VUE')) return '/client-logos/pearson.png'
    if (upperName.includes('PSI')) return '/client-logos/psi.png'
    return null
  }

  const getShortClient = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('PEARSON')) return 'PV';
    if (n.includes('PROMETRIC')) return 'PROM';
    if (n.includes('VUE')) return 'VUE';
    if (n.includes('ETS')) return 'ETS';
    if (n.includes('PSI')) return 'PSI';
    return n.slice(0, 4);
  }

  const getShortTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const suffix = hour >= 12 ? 'P' : 'A';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}${suffix}`;
  }

  const getShortExam = (name: string) => {
    return name
      .replace(/EXAM/gi, '')
      .replace(/SIMULATION/gi, 'SIM')
      .replace(/INTERNATIONAL/gi, 'INTL')
      .replace(/CERTIFIED/gi, 'CERT')
      .replace(/PROFESSIONAL/gi, 'PRO')
      .trim()
  }

  const getRemainingSeats = (candidateCount: number) => {
    const maxCapacity = getBranchCapacity(activeBranch)
    return Math.max(0, maxCapacity - candidateCount)
  }

  const formatTimeRange = (startTime: string, endTime: string) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'pm' : 'am'
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      return `${displayHour}:${minutes}${ampm}`
    }
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  const openModal = (date?: Date, session?: Session) => {
    if (session) {
      setEditingSession(session)
      setFormData({
        client_name: session.client_name,
        exam_name: session.exam_name,
        date: session.date,
        candidate_count: session.candidate_count,
        start_time: session.start_time,
        end_time: session.end_time
      })
    } else {
      setEditingSession(null)
      const dateStr = date ? formatDateForIST(date) : getCurrentISTDateString()
      setFormData({
        client_name: '',
        exam_name: '',
        date: dateStr,
        candidate_count: 1,
        start_time: '09:00',
        end_time: '17:00'
      })
    }
    setShowModal(true)
  }

  const openDetailsModal = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    if (daySessions.length > 0) {
      setSelectedDate(date)
      setShowDetailsModal(true)
    } else {
      openModal(date)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setShowDetailsModal(false)
    setEditingSession(null)
    setSelectedDate(null)
    setFormData({
      client_name: '',
      exam_name: '',
      date: '',
      candidate_count: 1,
      start_time: '09:00',
      end_time: '17:00'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const capacityValidation = validateSessionCapacity(formData.candidate_count, activeBranch)

    if (!capacityValidation.isValid) {
      toast.error(capacityValidation.error!)
      return
    }

    if (capacityValidation.warning) {
      toast(capacityValidation.warning, { icon: '⚠️' })
    }

    try {
      if (activeBranch === 'global') {
        toast.error('Please select a centre (Calicut, Cochin or Kannur) to add or edit sessions.')
        return
      }

      const sessionData: Omit<Session, 'id'> & { created_at?: string } = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
        branch_location: activeBranch
      }

      if (editingSession && editingSession.id) {
        await updateSession({ ...sessionData, id: editingSession.id })
      } else {
        await addSession({ ...sessionData, created_at: new Date().toISOString() })
      }

      closeModal()
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  const handleDelete = async (sessionId: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    await deleteSession(sessionId)

    if (selectedDate) {
      const remainingSessions = sessions.filter(s => s.date === formatDateForIST(selectedDate) && s.id !== sessionId)
      if (remainingSessions.length === 0) {
        setShowDetailsModal(false)
      }
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const monthYear = currentDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  })

  const days = useMemo(() => {
    return getDaysInMonth()
  }, [getDaysInMonth])

  const isToday = (date: Date | null) => {
    if (!date) return false
    return isTodayIST(date)
  }

  const currentTheme = CENTRE_COLORS[activeBranch] || CENTRE_COLORS['global']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F0F4F8]">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent absolute inset-0"></div>
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-bold text-lg mb-1 font-rajdhani">Loading Calendar</p>
            <p className="text-slate-500 text-sm">Fetching latest sessions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen -mt-32 pt-48 bg-[#e0e5ec]" style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* Functional Notification Banner */}
      <div className="h-6 -mx-8 -mt-12 mb-8"></div>

      <div className="max-w-[1800px] mx-auto px-6">
        {/* Executive Header - Neumorphic */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gold-gradient mb-2 uppercase">
              FETS Calendar
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              {activeBranch && activeBranch !== 'global' ? `${activeBranch.charAt(0).toUpperCase() + activeBranch.slice(1)} · ` : ''}Session Planning & Overview
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 font-semibold uppercase tracking-wider text-sm">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </motion.div>

        {/* Control Toolbar - Neumorphic */}
        <div className="neomorphic-card p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Month Navigation */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigateMonth('prev')}
                className="neomorphic-btn-icon"
                title="Previous month"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="text-xl font-bold text-gray-700 min-w-[200px] text-center">
                {monthYear}
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="neomorphic-btn-icon"
                title="Next month"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Analysis Button */}
            <button
              onClick={() => setShowAnalysis(true)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span>Analysis</span>
            </button>

            {/* Add Session Button */}
            <button
              onClick={() => openModal()}
              disabled={!canEdit}
              className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center space-x-2 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span>Add Session</span>
            </button>
          </div>
        </div>

        {/* Main Grid Conatiner - Clean & Premium */}
        <div className="bg-[#F0F4F8] rounded-3xl p-6 min-h-[600px]">
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-4">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div key={day} className="text-center">
                <div className="font-bold text-slate-500 text-xs uppercase tracking-widest mb-1">{day.substring(0, 3)}</div>
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-300 rounded-2xl shadow-xl border border-slate-300 overflow-hidden">
            {days.map((date, index) => {
              if (!date) {
                return (
                  <div key={index} className="h-52 bg-transparent opacity-0 pointer-events-none"></div>
                )
              }

              const daySessions = getSessionsForDate(date)
              const clientAggregates = getClientAggregates(date)
              const isCurrentDay = isToday(date)
              const isSelectedMonth = date.getMonth() === currentDate.getMonth()

              // Only dim dates from other months slightly to keep layout consistent
              const opacityClass = isSelectedMonth ? 'opacity-100' : 'opacity-30 grayscale'

              const totalCandidates = daySessions.reduce((sum, s) => sum + s.candidate_count, 0)

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, scale: 1.03 }}
                  onClick={() => openDetailsModal(date)}
                  className={`
                    h-56 p-4 cursor-pointer transition-all duration-400 rounded-[2rem] group flex flex-col relative overflow-hidden backdrop-blur-sm
                    ${opacityClass}
                    ${isCurrentDay
                      ? 'bg-white shadow-[0_20px_50px_rgba(245,158,11,0.15)] ring-2 ring-amber-400 ring-offset-2'
                      : 'bg-white/80 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]'
                    }
                  `}
                >
                  {/* Weekend Subtle Pattern */}
                  {(date.getDay() === 0 || date.getDay() === 6) && (
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:10px_10px]" />
                  )}

                  <div className="h-full flex flex-col relative z-10">
                    {/* Date Header - PREMIUM INSTRUMENT PANEL */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black leading-none tracking-tighter ${isCurrentDay ? 'text-amber-500' : 'text-slate-400/80 group-hover:text-slate-600 transition-colors'}`}>
                          {date.getDate()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-slate-400">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>

                      {daySessions.length > 0 && (
                        <div className="flex flex-col items-end">
                          <div className={`px-3 py-1 rounded-full text-sm font-black tracking-tight shadow-sm ${totalCandidates >= 70 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {totalCandidates} <span className="text-[10px] font-bold opacity-80">CAND</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sessions List - VIBRANT BENTO CARDS */}
                    <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar pb-2">
                      {daySessions.slice(0, 3).map((session, sIdx) => {
                        const clientColor = CLIENT_COLORS[getClientType(session.client_name)] || CLIENT_COLORS['OTHER']
                        return (
                          <motion.div
                            key={session.id || sIdx}
                            className="flex-shrink-0 relative overflow-hidden rounded-lg transition-all py-2 px-2.5 border-l-3 group/session hover:translate-x-0.5"
                            style={{
                              background: clientColor.bg,
                              borderLeftWidth: '3px',
                              borderLeftColor: clientColor.border,
                              boxShadow: clientColor.shadow
                            }}
                          >
                            <div className="flex justify-between items-center mb-0.5 pointer-events-none">
                              <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: clientColor.text }}>
                                {getShortClient(session.client_name)}
                              </span>
                              <div className="flex items-center gap-1">
                                <Clock size={8} style={{ color: clientColor.border }} />
                                <span className="text-[9px] font-bold text-slate-600">{getShortTime(session.start_time)}</span>
                              </div>
                            </div>
                            <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{getShortExam(session.exam_name)}</p>
                          </motion.div>
                        )
                      })}
                      {daySessions.length > 3 && (
                        <div className="text-[10px] font-black text-slate-500 py-1 text-center bg-slate-100/50 rounded-lg border border-dashed border-slate-300 group-hover:bg-slate-100 transition-colors">
                          + {daySessions.length - 3} MORE
                        </div>
                      )}
                    </div>

                    {/* CAPACITY HEALTH BAR */}
                    {totalCandidates > 0 && (
                      <div className="mt-auto pt-2">
                        <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
                          <span>Capacity</span>
                          <span>{Math.round((totalCandidates / 80) * 100)}%</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(totalCandidates / 80) * 100}%` }}
                            className={`h-full rounded-full ${totalCandidates >= 70 ? 'bg-rose-500' : totalCandidates >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tactile Highlight for Today */}
                  {isCurrentDay && (
                    <div className="absolute top-0 right-0 p-3">
                      <div className="flex items-center gap-1.5 bg-amber-500 px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/30">
                        <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Premium Neumorphic Daily Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl bg-slate-900/40"
              onClick={closeModal}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-[#EEF2F9] rounded-[3rem] shadow-[25px_25px_50px_#bec3c9,-25px_-25px_50px_#ffffff] border border-white/60 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Premium Modal Header */}
              <div className="px-12 py-10 border-b border-slate-200 bg-white/30 backdrop-blur-md relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-500 shadow-xl">
                        <Calendar size={20} />
                      </div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Daily Operations Overview</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                  </div>
                  <button onClick={closeModal} className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors border border-slate-100">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* HIGH-END STATS TILES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                  <div className="bg-[#EEF2F9] rounded-3xl p-6 shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/50 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                      <Building size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sessions</p>
                      <p className="text-2xl font-black text-slate-800">{getSessionsForDate(selectedDate).length}</p>
                    </div>
                  </div>
                  <div className="bg-[#EEF2F9] rounded-3xl p-6 shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/50 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Candidates</p>
                      <p className="text-2xl font-black text-slate-800">{getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0)}</p>
                    </div>
                  </div>
                  <div className="bg-[#EEF2F9] rounded-3xl p-6 shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border border-white/50 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                      <Shield size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Load</p>
                      <p className="text-2xl font-black text-slate-800">
                        {Math.round((getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0) / (getBranchCapacity(activeBranch) * 3)) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TICKET-STYLE SESSION LIST */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-8">
                {Object.entries(getClientAggregates(selectedDate)).length > 0 ? (
                  Object.entries(getClientAggregates(selectedDate)).map(([key, stat]) => {
                    const clientSessions = getSessionsForDate(selectedDate).filter(s => normalizeClientName(s.client_name) === key)
                    const clientType = getClientType(stat.displayName)
                    const clientColor = CLIENT_COLORS[clientType] || CLIENT_COLORS['OTHER']

                    return (
                      <div key={key} className="space-y-4">
                        <div className="flex items-center gap-4 px-4">
                          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: clientColor.border }} />
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{stat.displayName} Intelligence</h4>
                          <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {clientSessions.map((session, sIdx) => (
                            <motion.div
                              key={session.id || sIdx}
                              whileHover={{ y: -5 }}
                              className="rounded-[2rem] shadow-lg border overflow-hidden flex flex-col"
                              style={{
                                background: clientColor.bg,
                                borderColor: clientColor.accent
                              }}
                            >
                              <div className="p-8 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: clientColor.accent, color: clientColor.text }}>
                                      <Award size={20} />
                                    </div>
                                    <div>
                                      <h5 className="font-black uppercase tracking-tight leading-none" style={{ color: clientColor.text }}>{session.exam_name}</h5>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Industrial Phase Verification</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock size={12} style={{ color: clientColor.border }} />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time Slot</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-700">{formatTimeRange(session.start_time, session.end_time)}</p>
                                  </div>
                                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Users size={12} style={{ color: clientColor.border }} />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capacity</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-700">{session.candidate_count} CAND</p>
                                  </div>
                                </div>
                              </div>

                              {/* Premium Reveal Actions */}
                              <div className="p-6 bg-white/50 border-t border-slate-100 flex items-center justify-end gap-3 px-8">
                                <button
                                  disabled={!canEdit}
                                  onClick={() => openModal(selectedDate, session)}
                                  className="p-3 rounded-xl bg-white shadow-sm text-slate-500 hover:text-amber-500 hover:shadow-md transition-all border border-slate-200 active:scale-95 disabled:opacity-30"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  disabled={!canEdit}
                                  onClick={() => session.id && handleDelete(session.id)}
                                  className="p-3 rounded-xl bg-white shadow-sm text-slate-500 hover:text-rose-500 hover:shadow-md transition-all border border-slate-200 active:scale-95 disabled:opacity-30"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 opacity-60">
                    <div className="w-24 h-24 rounded-[2rem] bg-[#EEF2F9] shadow-[12px_12px_24px_#bec3c9,-12px_-12px_24px_#ffffff] flex items-center justify-center text-slate-300 mb-6">
                      <Calendar size={40} />
                    </div>
                    <p className="text-xl font-black text-slate-400 uppercase tracking-widest">No Strategic Sessions</p>
                  </div>
                )}
              </div>

              {/* Bottom Action Deck */}
              <div className="p-10 border-t border-slate-200 bg-white/30 backdrop-blur-md flex justify-center">
                <button
                  disabled={!canEdit}
                  onClick={() => openModal(selectedDate)}
                  className="px-12 py-5 rounded-2xl bg-slate-800 text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:scale-105 transition-all text-xs flex items-center gap-4 disabled:opacity-30"
                >
                  <Plus size={18} /> Add Strategic Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-rajdhani text-slate-800">
                  {editingSession ? 'Edit Session' : 'Create Session'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {editingSession ? 'Update session details.' : 'Add a new session to the current calendar.'}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                {/* Client and Exam */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client Name</label>
                    <select
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      required
                    >
                      <option value="">Select Client</option>
                      {Object.keys(CLIENT_COLORS).map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Exam Name</label>
                    <input
                      type="text"
                      value={formData.exam_name}
                      onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      placeholder="e.g., CMA US Exam"
                      required
                    />
                  </div>
                </div>

                {/* Date and Candidate Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Candidate Count</label>
                    <input
                      type="number"
                      value={formData.candidate_count}
                      onChange={(e) => setFormData({ ...formData, candidate_count: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-8 pt-6 border-t border-slate-50">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="flex-1 px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isMutating ? (
                    <span className="flex items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Saving...</span>
                  ) : editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Analysis Modal */}
      <AnimatePresence>
        {showAnalysis && (
          <CalendarAnalysis
            onClose={() => setShowAnalysis(false)}
            activeBranch={activeBranch}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default FetsCalendarPremium
