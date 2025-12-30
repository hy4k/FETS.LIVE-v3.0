import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, X, Check, Clock, Users, Eye, MapPin, Building } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useBranchFilter } from '../hooks/useBranchFilter'
import { formatDateForIST, getCurrentISTDateString, isToday as isTodayIST, formatDateForDisplay } from '../utils/dateUtils'
import { validateSessionCapacity, getCapacityStatusColor, formatCapacityDisplay, getBranchCapacity } from '../utils/sessionUtils'
import { useCalendarSessions, useSessionMutations } from '../hooks/useCalendarSessions'

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
  branch_location?: 'calicut' | 'cochin'
}

// Subtle client palette for elegant look (neutral background with accent border)
const CLIENT_COLORS = {
  'PEARSON': { bg: '#F8FAFC', text: '#111827', border: '#007AFF', tint: '#EFF6FF' },
  'VUE': { bg: '#F8FAFC', text: '#111827', border: '#34C759', tint: '#ECFDF5' },
  'ETS': { bg: '#F8FAFC', text: '#111827', border: '#FF9500', tint: '#FFF7ED' },
  'PSI': { bg: '#F8FAFC', text: '#111827', border: '#AF52DE', tint: '#F5F3FF' },
  'PROMETRIC': { bg: '#F8FAFC', text: '#111827', border: '#FF3B30', tint: '#FEF2F2' },
  'OTHER': { bg: '#F8FAFC', text: '#111827', border: '#8E8E93', tint: '#F3F4F6' }
}

type ClientType = keyof typeof CLIENT_COLORS

export function FetsCalendar() {
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  const { applyFilter, isGlobalView } = useBranchFilter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const { data: sessions = [], isLoading: loading, isError, error } = useCalendarSessions(currentDate, activeBranch, applyFilter, isGlobalView)
  const { addSession, updateSession, deleteSession, isMutating } = useSessionMutations()
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
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

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }, [currentDate])

  const getSessionsForDate = (date: Date) => {
    const dateStr = formatDateForIST(date)
    return sessions.filter(session => session.date === dateStr)
  }

  const getClientType = (clientName: string): ClientType => {
    const upperName = clientName.toUpperCase()
    if (upperName.includes('PEARSON')) return 'PEARSON'
    if (upperName.includes('VUE')) return 'VUE'
    if (upperName.includes('ETS')) return 'ETS'
    if (upperName.includes('PSI')) return 'PSI'
    if (upperName.includes('PROMETRIC')) return 'PROMETRIC'
    return 'OTHER'
  }

  // Get per-client candidate counts for a date
  const getClientCounts = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    const clientCounts: { [key: string]: number } = {}

    daySessions.forEach(session => {
      clientCounts[session.client_name] = (clientCounts[session.client_name] || 0) + session.candidate_count
    })

    return clientCounts
  }

  // Calculate remaining seats for a session based on branch
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

    // Validate session capacity with branch-specific limits
    const capacityValidation = validateSessionCapacity(formData.candidate_count, activeBranch)

    if (!capacityValidation.isValid) {
      toast.error(capacityValidation.error!)
      return
    }

    if (capacityValidation.warning) {
      toast(capacityValidation.warning, { icon: '⚠️' })
    }

    try {
      // Prevent creating/updating sessions without a specific centre
      if (activeBranch === 'global') {
        toast.error('Please select a centre (Calicut or Cochin) to add or edit sessions.')
        return
      }

      const sessionData: Omit<Session, 'id'> & { created_at?: string } = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
        branch_location: activeBranch
      }

      if (editingSession && editingSession.id) {
        // Update existing session
        await updateSession({ ...sessionData, id: editingSession.id })
      } else {
        // Create session
        await addSession({ ...sessionData, created_at: new Date().toISOString() })
      }

      closeModal()
    } catch (error) {
      console.error('Error saving session:', error)
      // Error is handled by the mutation hook
    }
  }

  const handleDelete = async (sessionId: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    await deleteSession(sessionId)

    // Close details modal if no more sessions for this date
    if (selectedDate) {
      // Check against the main sessions list
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
    // Memoize the days array so it doesn't recalculate on every render
    return getDaysInMonth()
  }, [getDaysInMonth])

  const isToday = (date: Date | null) => {
    if (!date) return false
    return isTodayIST(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E6E8EC]">
        <div className="bg-[#E6E8EC] shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.8)] rounded-2xl p-10 flex flex-col items-center space-y-6 border border-white/40">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-500 border-t-transparent absolute inset-0"></div>
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-semibold text-lg mb-1">Loading Calendar</p>
            <p className="text-slate-500 text-sm">Fetching latest sessions…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E6E8EC] p-8">
      {/* Premium Neumorphic Header */}
      <div className="rounded-3xl bg-[#E6E8EC] shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.8)] border border-white/40 mb-8 p-8 relative overflow-hidden">

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Calendar size={200} className="text-slate-500 rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">

          {/* Brand Section */}
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-[#E6E8EC] text-slate-700 shadow-[6px_6px_12px_rgba(163,177,198,0.5),-6px_-6px_12px_rgba(255,255,255,0.8)]">
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">FETS Calendar</h1>
              <p className="text-slate-500 font-medium">Session Planning & Overview</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            {/* Branch Indicator */}
            <div className="px-6 py-3 rounded-xl bg-[#E6E8EC] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${activeBranch === 'global' ? 'bg-blue-500' : 'bg-emerald-500'} shadow-[0_0_10px_currentColor]`}></div>
              <span className="font-bold text-slate-600 uppercase tracking-wider text-sm">
                {activeBranch === 'calicut' ? 'Calicut' : activeBranch === 'cochin' ? 'Cochin' : 'Global View'}
              </span>
            </div>

            {/* Month Nav */}
            <div className="flex items-center p-2 rounded-xl bg-[#E6E8EC] shadow-[6px_6px_12px_rgba(163,177,198,0.5),-6px_-6px_12px_rgba(255,255,255,0.8)]">
              <button onClick={() => navigateMonth('prev')} className="p-3 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <div className="w-48 text-center font-bold text-lg text-slate-800">
                {monthYear}
              </div>
              <button onClick={() => navigateMonth('next')} className="p-3 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Add Session */}
            <button
              onClick={() => openModal()}
              className="px-6 py-4 rounded-xl bg-[#E6E8EC] text-slate-800 font-bold uppercase tracking-wider text-sm
               shadow-[6px_6px_12px_rgba(163,177,198,0.5),-6px_-6px_12px_rgba(255,255,255,0.8)]
               hover:shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:text-blue-600 transition-all active:translate-y-0.5 active:shadow-inner"
            >
              <span className="flex items-center gap-2">
                <Plus size={18} /> Add Session
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Premium Neumorphic Calendar Grid */}
      <div className="max-w-[1920px] mx-auto">
        <div className="rounded-3xl p-2">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-6 mb-6">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="py-4 text-center bg-[#E6E8EC] rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.8)]">
                <div className="font-black text-slate-400 text-xs uppercase tracking-[0.2em]">{day.substring(0, 3)}</div>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-6">
            {days.map((date, index) => {
              if (!date) {
                return (
                  <div key={index} className="h-44 rounded-3xl opacity-0 pointer-events-none"></div>
                )
              }

              const daySessions = getSessionsForDate(date)
              const clientCounts = getClientCounts(date)
              const isCurrentDay = isToday(date)
              const isSelectedMonth = date.getMonth() === currentDate.getMonth()

              // Only dim dates from other months slightly to keep layout consistent
              const opacityClass = isSelectedMonth ? 'opacity-100' : 'opacity-40 grayscale'

              return (
                <div
                  key={index}
                  onClick={() => openDetailsModal(date)}
                  className={`
                    h-44 p-5 cursor-pointer transition-all duration-300 rounded-[2rem] group flex flex-col justify-between relative overflow-hidden
                    ${opacityClass}
                    ${isCurrentDay
                      ? 'bg-[#E6E8EC] shadow-[inset_5px_5px_10px_rgba(163,177,198,0.6),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] border border-blue-500/20'
                      : 'bg-[#E6E8EC] shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.8)] border border-white/40 hover:-translate-y-1 hover:shadow-[12px_12px_24px_rgba(163,177,198,0.6),-12px_-12px_24px_rgba(255,255,255,0.9)]'
                    }
                  `}
                >
                  <div className="h-full flex flex-col relative z-10">
                    {/* Date Header */}
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-2xl font-black ${isCurrentDay ? 'text-blue-600' : 'text-slate-700'}`}>
                        {date.getDate()}
                      </span>
                      {daySessions.length > 0 && (
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>

                    {/* Sessions List */}
                    <div className="flex-1 flex flex-col gap-2 justify-end">
                      {Object.entries(clientCounts).slice(0, 3).map(([client, count]) => (
                        <div key={client} className={`
                                px-3 py-1.5 rounded-xl flex items-center justify-between text-[10px] font-bold uppercase tracking-wide
                                ${isCurrentDay
                            ? 'bg-blue-500/10 text-blue-900 border border-blue-500/20'
                            : 'bg-[#E6E8EC] shadow-[2px_2px_4px_rgba(163,177,198,0.4),-2px_-2px_4px_rgba(255,255,255,0.8)] text-slate-600'
                          }
                            `}>
                          <span>{client}</span>
                          <span className="bg-slate-200/50 px-1.5 rounded text-slate-900">{count}</span>
                        </div>
                      ))}
                      {Object.keys(clientCounts).length > 3 && (
                        <div className="text-[10px] text-center font-bold text-slate-400">
                          + {Object.keys(clientCounts).length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Premium Apple-style Session Details Modal */}
      {showDetailsModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 backdrop-blur-2xl bg-black/30" onClick={closeModal} />

          <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center mb-1">
                    <Calendar className="h-6 w-6 mr-3 text-gray-700" />
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="flex items-center space-x-6 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5" />
                      <span className="font-semibold">{getSessionsForDate(selectedDate).length} Sessions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold">{getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0)} Total Candidates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span className="font-semibold">{getRemainingSeats(getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0))} Seats Available</span>
                    </div>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Client-wise Sessions Display */}
            <div className="p-8">
              {Object.entries(getClientCounts(selectedDate)).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(getClientCounts(selectedDate)).map(([client, totalCount]) => {
                    const clientSessions = getSessionsForDate(selectedDate).filter(s => s.client_name === client)
                    const clientType = getClientType(client)
                    const clientColor = CLIENT_COLORS[clientType]
                    const remainingSeats = getRemainingSeats(totalCount)

                    return (
                      <div key={client} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Client Header */}
                        <div
                          className="p-5 relative"
                          style={{ borderLeft: `4px solid ${clientColor.border}`, background: clientColor.tint }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xl font-bold text-gray-900 flex items-center mb-1">
                                <Building className="h-5 w-5 mr-3 text-gray-700" />
                                {client}
                              </h4>
                              <div className="flex items-center space-x-4 text-gray-600">
                                <span className="font-semibold">{clientSessions.length} Sessions</span>
                                <span>•</span>
                                <span className="font-semibold">{totalCount} Candidates</span>
                              </div>
                            </div>
                            <div className="text-center bg-gray-50 rounded-xl px-5 py-3 border border-gray-200">
                              <div className="text-gray-600 text-sm font-medium mb-1">Remaining Seats</div>
                              <div className={`text-2xl font-bold ${remainingSeats > 20 ? 'text-green-600' :
                                  remainingSeats > 10 ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                {remainingSeats}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Client Sessions */}
                        <div className="p-6">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {clientSessions.map(session => (
                              <div key={session.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2">{session.exam_name}</h5>
                                    <div className="space-y-3 text-sm">
                                      <div className="flex items-center text-gray-600">
                                        <Clock className="h-4 w-4 mr-3 text-gray-500" />
                                        <span className="font-semibold">{formatTimeRange(session.start_time, session.end_time)}</span>
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <Users className="h-4 w-4 mr-3 text-gray-500" />
                                        <span className="font-semibold">{session.candidate_count} Candidates</span>
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <MapPin className="h-4 w-4 mr-3 text-gray-500" />
                                        <span className="font-semibold">{getRemainingSeats(session.candidate_count)} Seats Available</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-3 pt-4 border-t border-gray-200/50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openModal(selectedDate, session)
                                    }}
                                    className="flex-1 p-3 bg-gray-900 hover:bg-black text-white rounded-xl transition-colors duration-200 flex items-center justify-center font-medium shadow-sm"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (session.id) {
                                        handleDelete(session.id)
                                      }
                                    }}
                                    className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors duration-200 flex items-center justify-center font-medium shadow-sm"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-gray-100 rounded-full p-8 w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No sessions scheduled</h3>
                  <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">No sessions found for this date. Create your first session to get started.</p>
                  <button
                    onClick={() => openModal(selectedDate)}
                    className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-colors duration-200 shadow-sm flex items-center mx-auto"
                  >
                    <Plus className="h-6 w-6 mr-3" />
                    Create session
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            {getSessionsForDate(selectedDate).length > 0 && (
              <div className="px-8 py-6 bg-gray-50/80 backdrop-blur-xl border-t border-gray-200/30">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => openModal(selectedDate)}
                    className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-colors duration-200 shadow-sm flex items-center"
                  >
                    <Plus className="h-6 w-6 mr-3" />
                    Add Another Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Apple-style Add/Edit Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 backdrop-blur-2xl bg-black/40"
            onClick={closeModal}
          />

          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Premium Modal Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {editingSession ? 'Edit Session' : 'Create session'}
                  </h3>
                  <p className="text-gray-600">
                    {editingSession ? 'Update session information' : 'Add a new session to the calendar'}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Premium Form */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-8">
                {/* Client and Exam Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Client Name
                    </label>
                    <select
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                    >
                      <option value="">Select Client</option>
                      <option value="PEARSON">PEARSON</option>
                      <option value="VUE">VUE</option>
                      <option value="ETS">ETS</option>
                      <option value="PSI">PSI</option>
                      <option value="PROMETRIC">PROMETRIC</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Exam Name
                    </label>
                    <input
                      type="text"
                      value={formData.exam_name}
                      onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                      placeholder="Enter exam name"
                    />
                  </div>
                </div>

                {/* Date and Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Candidate Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="80"
                      value={formData.candidate_count}
                      onChange={(e) => setFormData({ ...formData, candidate_count: parseInt(e.target.value) || 1 })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                    />
                  </div>
                </div>

                {/* Time Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-800 tracking-wide uppercase mb-3">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                      className="w-full px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none font-medium transition-colors duration-200 shadow-none"
                    />
                  </div>
                </div>

                {/* Capacity Information Card */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg mb-2 flex items-center">
                        <Users className="h-6 w-6 mr-3" />
                        Capacity Information
                      </h4>
                      <p className="text-gray-600 font-medium">Maximum capacity: 80 candidates per session</p>
                      <p className="text-gray-600 text-sm mt-1">Current session: {formData.candidate_count} candidates</p>
                    </div>
                    <div className="text-center bg-white rounded-2xl px-6 py-4 border border-blue-200/50 shadow-lg">
                      <div className="text-gray-800 text-sm font-medium mb-1">Seats Remaining</div>
                      <div className={`text-4xl font-bold ${getRemainingSeats(formData.candidate_count) > 20 ? 'text-green-600' :
                          getRemainingSeats(formData.candidate_count) > 10 ? 'text-yellow-600' :
                            'text-red-600'
                        }`}>
                        {getRemainingSeats(formData.candidate_count)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center"
                  >
                    {editingSession ? (
                      <>
                        <Edit className="h-5 w-5 mr-3" />
                        Update Session
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-3" />
                        Create Session
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
