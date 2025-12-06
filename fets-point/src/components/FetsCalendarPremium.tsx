import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, X, Check, Clock, Users, Eye, MapPin, Building, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
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
  branch_location?: 'calicut' | 'cochin'
}

const CLIENT_COLORS = {
  'PEARSON': { bg: '#F8FAFC', text: '#111827', border: '#007AFF', tint: '#EFF6FF' },
  'VUE': { bg: '#F8FAFC', text: '#111827', border: '#34C759', tint: '#ECFDF5' },
  'ETS': { bg: '#F8FAFC', text: '#111827', border: '#FF9500', tint: '#FFF7ED' },
  'PSI': { bg: '#F8FAFC', text: '#111827', border: '#AF52DE', tint: '#F5F3FF' },
  'PROMETRIC': { bg: '#F8FAFC', text: '#111827', border: '#FF3B30', tint: '#FEF2F2' },
  'OTHER': { bg: '#F8FAFC', text: '#111827', border: '#8E8E93', tint: '#F3F4F6' }
}

const CENTRE_COLORS = {
  'calicut': { primary: '#FFFFFF', secondary: '#F1F5F9', light: '#FFFFFF', accent: '#E5E7EB', shadow: 'rgba(0,0,0,0.06)', glass: 'rgba(255,255,255,0.6)' },
  'cochin': { primary: '#FFFFFF', secondary: '#F1F5F9', light: '#FFFFFF', accent: '#E5E7EB', shadow: 'rgba(0,0,0,0.06)', glass: 'rgba(255,255,255,0.6)' },
  'global': { primary: '#FFFFFF', secondary: '#F1F5F9', light: '#FFFFFF', accent: '#E5E7EB', shadow: 'rgba(0,0,0,0.06)', glass: 'rgba(255,255,255,0.6)' }
}

type ClientType = keyof typeof CLIENT_COLORS

export function FetsCalendarPremium() {
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

  const getClientType = (clientName: string): ClientType => {
    const upperName = clientName.toUpperCase()
    if (upperName.includes('PEARSON')) return 'PEARSON'
    if (upperName.includes('VUE')) return 'VUE'
    if (upperName.includes('ETS')) return 'ETS'
    if (upperName.includes('PSI')) return 'PSI'
    if (upperName.includes('PROMETRIC')) return 'PROMETRIC'
    return 'OTHER'
  }

  const getClientCounts = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    const clientCounts: { [key: string]: number } = {}

    daySessions.forEach(session => {
      clientCounts[session.client_name] = (clientCounts[session.client_name] || 0) + session.candidate_count
    })

    return clientCounts
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
      <div className="flex items-center justify-center min-h-screen bg-[#e0e5ec]">
        <div className="neomorphic-card p-8 flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent absolute inset-0"></div>
          </div>
          <div className="text-center">
            <p className="text-gray-800 font-semibold text-lg mb-1">Loading Calendar</p>
            <p className="text-gray-500 text-sm">Fetching latest sessions...</p>
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
              {activeBranch?.name ? `${activeBranch.name} · ` : ''}Session Planning & Overview
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
              className="neomorphic-btn px-4 py-2 text-sm font-semibold text-gray-600"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Add Session Button */}
            <button
              onClick={() => openModal()}
              className="neomorphic-btn px-4 py-2 text-rose-700 flex items-center space-x-2 font-bold hover:text-rose-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Session</span>
            </button>
          </div>
        </div>

        {/* Main Grid Conatiner - Neumorphic */}
        <div className="neomorphic-card p-6 min-h-[600px] border-t-4 border-t-rose-500">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div key={day} className="p-6 text-center">
                <div className="font-bold text-rose-700 text-sm uppercase tracking-widest mb-1">{day.substring(0, 3)}</div>
                <div className="text-rose-600 text-xs font-medium">{day}</div>
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-rose-100">
            {days.map((date, index) => {
              if (!date) {
                return (
                  <div key={index} className="h-36 bg-gray-50/50"></div>
                )
              }

              const daySessions = getSessionsForDate(date)
              const clientCounts = getClientCounts(date)
              const isCurrentDay = isToday(date)
              const hasEvents = Object.keys(clientCounts).length > 0

              return (
                <div
                  key={index}
                  onClick={() => openDetailsModal(date)}
                  className={`h-36 p-4 cursor-pointer transition-all duration-200 group ${isCurrentDay
                      ? 'bg-gradient-to-br from-rose-50 to-pink-50 ring-2 ring-rose-400 ring-inset'
                      : hasEvents
                        ? 'bg-white hover:bg-rose-50/50'
                        : 'bg-gray-50'
                    }`}
                >
                  <div className="h-full flex flex-col">
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`text-lg font-bold transition-colors ${isCurrentDay
                          ? 'text-rose-700'
                          : date.getMonth() === currentDate.getMonth()
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}>
                        {date.getDate()}
                      </div>
                      {isCurrentDay && <div className="w-2 h-2 bg-rose-700 rounded-full"></div>}
                      {hasEvents && !isCurrentDay && (<div className="w-2 h-2 bg-rose-300 rounded-full"></div>)}
                    </div>

                    {/* Session Indicators */}
                    <div className="flex-1 space-y-2 overflow-hidden">
                      {Object.entries(clientCounts).slice(0, 2).map(([client, count]) => {
                        const clientType = getClientType(client)
                        const clientColor = CLIENT_COLORS[clientType]

                        return (
                          <div
                            key={client}
                            className="text-xs rounded-lg px-3 py-2 font-medium truncate transition-all duration-200 border border-rose-200"
                            style={{ borderLeft: `4px solid ${clientColor.border}`, color: clientColor.text, background: clientColor.tint }}
                            title={`${client}: ${count} candidates`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate text-gray-800">{client.substring(0, 10)}</span>
                              <span className="ml-2 font-semibold text-gray-900">{count}</span>
                            </div>
                          </div>
                        )
                      })}

                      {Object.keys(clientCounts).length > 2 && (
                        <div className="text-xs text-gray-500 font-medium px-3 py-1 bg-rose-100/50 rounded-lg">
                          +{Object.keys(clientCounts).length - 2} more
                        </div>
                      )}

                      {daySessions.length === 0 && date.getMonth() === currentDate.getMonth() && (
                        <div className="text-xs text-gray-400 px-3 py-2 italic text-center">
                          No sessions
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

      {/* Session Details Modal */}
      {showDetailsModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 backdrop-blur-2xl bg-black/30" onClick={closeModal} />

          <div className="relative w-full max-w-6xl unified-card rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto border-t-4 border-t-rose-500">
            <div className="px-8 py-6 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-h3 font-bold text-gray-900 flex items-center mb-1">
                    <Calendar className="h-6 w-6 mr-3 text-rose-600" />
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="flex items-center space-x-6 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-rose-600" />
                      <span className="font-semibold">{getSessionsForDate(selectedDate).length} Sessions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-rose-600" />
                      <span className="font-semibold">{getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0)} Total Candidates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-rose-600" />
                      <span className="font-semibold">{getRemainingSeats(getSessionsForDate(selectedDate).reduce((sum, s) => sum + s.candidate_count, 0))} Seats Available</span>
                    </div>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-rose-100 rounded-lg">
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Client Sessions Display */}
            <div className="p-8">
              {Object.entries(getClientCounts(selectedDate)).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(getClientCounts(selectedDate)).map(([client, totalCount]) => {
                    const clientSessions = getSessionsForDate(selectedDate).filter(s => s.client_name === client)
                    const clientType = getClientType(client)
                    const clientColor = CLIENT_COLORS[clientType]
                    const remainingSeats = getRemainingSeats(totalCount)

                    return (
                      <div key={client} className="unified-card rounded-2xl border-l-4 border-l-rose-500 overflow-hidden">
                        {/* Client Header */}
                        <div
                          className="p-5 relative border-b border-rose-100"
                          style={{ borderLeft: `4px solid ${clientColor.border}`, background: clientColor.tint }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xl font-bold text-gray-900 flex items-center mb-1">
                                <Building className="h-5 w-5 mr-3 text-rose-600" />
                                {client}
                              </h4>
                              <div className="flex items-center space-x-4 text-gray-600">
                                <span className="font-semibold">{clientSessions.length} Sessions</span>
                                <span>•</span>
                                <span className="font-semibold">{totalCount} Candidates</span>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-xl px-5 py-3 border border-rose-200">
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
                              <div key={session.id} className="unified-card rounded-xl border-t-2 border-t-rose-400 p-6 hover:shadow-md transition-all duration-200">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2">{session.exam_name}</h5>
                                    <div className="space-y-3 text-sm">
                                      <div className="flex items-center text-gray-600">
                                        <Clock className="h-4 w-4 mr-3 text-rose-600" />
                                        <span className="font-semibold">{formatTimeRange(session.start_time, session.end_time)}</span>
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <Users className="h-4 w-4 mr-3 text-rose-600" />
                                        <span className="font-semibold">{session.candidate_count} Candidates</span>
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <MapPin className="h-4 w-4 mr-3 text-rose-600" />
                                        <span className="font-semibold">{getRemainingSeats(session.candidate_count)} Seats Available</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-3 pt-4 border-t border-rose-100">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openModal(selectedDate, session)
                                    }}
                                    className="flex-1 p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center font-medium"
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
                                    className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center font-medium"
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
                  <div className="bg-rose-100 rounded-full p-8 w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-rose-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No sessions scheduled</h3>
                  <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">No sessions found for this date. Create your first session to get started.</p>
                  <button
                    onClick={() => openModal(selectedDate)}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center mx-auto"
                  >
                    <Plus className="h-6 w-6 mr-3" />
                    Create session
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            {getSessionsForDate(selectedDate).length > 0 && (
              <div className="px-8 py-6 bg-rose-50/80 backdrop-blur-xl border-t border-rose-100">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => openModal(selectedDate)}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center"
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

      {/* Add/Edit Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 backdrop-blur-2xl bg-black/40"
            onClick={closeModal}
          />

          <div className="relative w-full max-w-3xl unified-card rounded-2xl shadow-xl overflow-hidden border-t-4 border-t-rose-500">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-h3 font-bold text-gray-900 mb-2">
                    {editingSession ? 'Edit Session' : 'Create session'}
                  </h3>
                  <p className="text-gray-600">
                    {editingSession ? 'Update session information' : 'Add a new session to the calendar'}
                  </p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-rose-100 rounded-lg">
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                {/* Client and Exam */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client Name *</label>
                    <input
                      type="text"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="e.g., Pearson VUE"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Name *</label>
                    <input
                      type="text"
                      value={formData.exam_name}
                      onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                      className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="e.g., CMA US Exam"
                      required
                    />
                  </div>
                </div>

                {/* Date and Candidate Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Candidate Count *</label>
                    <input
                      type="number"
                      value={formData.candidate_count}
                      onChange={(e) => setFormData({ ...formData, candidate_count: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-rose-300 text-rose-700 font-semibold rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isMutating ? 'Saving...' : editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FetsCalendarPremium
