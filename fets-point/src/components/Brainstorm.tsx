import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Plus,
  Calendar as CalendarIcon,
  User,
  Trash2,
  Edit3,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  HelpCircle,
  Star,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import {
  useBrainstormSessions,
  useBrainstormNotes,
  useCreateBrainstormNote,
  useUpdateBrainstormNote,
  useDeleteBrainstormNote,
  useBrainstormEvents,
  useCreateBrainstormEvent,
  useDeleteBrainstormEvent,
  type BrainstormNote,
  type BrainstormEvent,
} from '../hooks/useBrainstorm'

type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange'
type NoteCategory = 'idea' | 'priority' | 'action' | 'question'

const colorClasses: Record<NoteColor, { bg: string; border: string; text: string }> = {
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
  green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
  pink: { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' },
}

const categoryIcons: Record<NoteCategory, React.ReactNode> = {
  idea: <Lightbulb size={16} />,
  priority: <Flag size={16} />,
  action: <Star size={16} />,
  question: <HelpCircle size={16} />,
}

export function Brainstorm() {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()

  // Fetch data
  const { data: sessions = [] } = useBrainstormSessions(activeBranch)
  const activeSession = sessions[0] // Use first active session

  const { data: notes = [] } = useBrainstormNotes(activeSession?.id || '')
  const { data: events = [] } = useBrainstormEvents(activeBranch)

  // Mutations
  const createNote = useCreateBrainstormNote()
  const updateNote = useUpdateBrainstormNote()
  const deleteNote = useDeleteBrainstormNote()
  const createEvent = useCreateBrainstormEvent()
  const deleteEvent = useDeleteBrainstormEvent()

  // Local state
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteColor, setNewNoteColor] = useState<NoteColor>('yellow')
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>('idea')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [showNewEventModal, setShowNewEventModal] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventType, setNewEventType] = useState<'deadline' | 'milestone' | 'meeting' | 'reminder'>('deadline')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Group notes by user
  const notesByUser = useMemo(() => {
    const grouped: Record<string, BrainstormNote[]> = {}
    notes.forEach((note) => {
      const userId = note.user_id
      if (!grouped[userId]) {
        grouped[userId] = []
      }
      grouped[userId].push(note)
    })
    return grouped
  }, [notes])

  // Handle adding a new note
  const handleAddNote = () => {
    if (!newNoteContent.trim() || !activeSession || !profile) return

    createNote.mutate({
      session_id: activeSession.id,
      user_id: profile.id,
      content: newNoteContent,
      color: newNoteColor,
      category: newNoteCategory,
    })

    setNewNoteContent('')
  }

  // Handle updating a note
  const handleUpdateNote = (noteId: string) => {
    if (!editingContent.trim() || !activeSession) return

    updateNote.mutate({
      id: noteId,
      updates: { content: editingContent },
      sessionId: activeSession.id,
    })

    setEditingNoteId(null)
    setEditingContent('')
  }

  // Handle deleting a note
  const handleDeleteNote = (noteId: string) => {
    if (!activeSession) return
    deleteNote.mutate({ id: noteId, sessionId: activeSession.id })
  }

  // Handle adding an event
  const handleAddEvent = () => {
    if (!newEventTitle.trim() || !newEventDate || !activeSession || !profile) return

    createEvent.mutate({
      session_id: activeSession.id,
      title: newEventTitle,
      event_date: newEventDate,
      event_type: newEventType,
      created_by: profile.id,
      branch_location: activeBranch || 'global',
    })

    setNewEventTitle('')
    setNewEventDate('')
    setShowNewEventModal(false)
  }

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth)

  const eventsOnDate = (date: number) => {
    const dateStr = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      date
    ).toISOString().split('T')[0]
    return events.filter((e) => e.event_date.startsWith(dateStr))
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Lightbulb size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No active brainstorm session</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="text-amber-600" />
            {activeSession.title}
          </h2>
          {activeSession.description && (
            <p className="text-gray-600 mt-1">{activeSession.description}</p>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Updates/Ideas Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Ideas</h3>

            {/* Add New Note */}
            <div className="mb-6 space-y-3">
              <div className="flex gap-2">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Share your idea..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddNote()
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {(Object.keys(colorClasses) as NoteColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewNoteColor(color)}
                      className={`w-6 h-6 rounded-full border-2 ${colorClasses[color].bg} ${
                        newNoteColor === color ? 'ring-2 ring-amber-500' : ''
                      }`}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex gap-2 ml-auto">
                  {(Object.keys(categoryIcons) as NoteCategory[]).map((category) => (
                    <button
                      key={category}
                      onClick={() => setNewNoteCategory(category)}
                      className={`p-2 rounded ${
                        newNoteCategory === category
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={category}
                    >
                      {categoryIcons[category]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            {/* Notes by User */}
            <div className="space-y-6">
              {Object.entries(notesByUser).map(([userId, userNotes]) => {
                const user = userNotes[0]?.user
                return (
                  <div key={userId} className="space-y-3">
                    {/* User Header */}
                    <div className="flex items-center gap-2">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                          {user?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{user?.full_name || 'Unknown'}</span>
                    </div>

                    {/* User's Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {userNotes.map((note) => {
                          const colors = colorClasses[note.color as NoteColor] || colorClasses.yellow
                          const isEditing = editingNoteId === note.id
                          const isOwner = profile?.id === note.user_id

                          return (
                            <motion.div
                              key={note.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative group`}
                            >
                              {note.category && (
                                <div className={`absolute top-2 right-2 ${colors.text}`}>
                                  {categoryIcons[note.category as NoteCategory]}
                                </div>
                              )}

                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    className={`w-full px-2 py-1 ${colors.bg} ${colors.text} border border-gray-300 rounded resize-none`}
                                    rows={3}
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleUpdateNote(note.id)}
                                      className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingNoteId(null)
                                        setEditingContent('')
                                      }}
                                      className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className={`${colors.text} text-sm whitespace-pre-wrap pr-6`}>
                                    {note.content}
                                  </p>

                                  {isOwner && (
                                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => {
                                          setEditingNoteId(note.id)
                                          setEditingContent(note.content)
                                        }}
                                        className="p-1 bg-white rounded shadow hover:bg-gray-100"
                                      >
                                        <Edit3 size={12} className="text-gray-600" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="p-1 bg-white rounded shadow hover:bg-red-100"
                                      >
                                        <Trash2 size={12} className="text-red-600" />
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                )
              })}

              {notes.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No ideas yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Calendar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Important Dates</h3>
              <button
                onClick={() => setShowNewEventModal(true)}
                className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                title="Add event"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={goToPreviousMonth} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft size={20} />
              </button>
              <span className="font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-xs font-semibold text-gray-600 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the 1st */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = eventsOnDate(day)
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === currentMonth.getMonth() &&
                  new Date().getFullYear() === currentMonth.getFullYear()

                return (
                  <div
                    key={day}
                    className={`aspect-square border rounded text-center text-sm flex flex-col items-center justify-center relative ${
                      isToday ? 'bg-amber-100 border-amber-600 font-bold' : 'border-gray-200'
                    }`}
                  >
                    <span className="text-gray-900">{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-0.5 w-1 h-1 bg-red-500 rounded-full" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Upcoming Events */}
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Upcoming Events</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="p-3 bg-gray-50 rounded border border-gray-200 text-sm group relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {profile?.id === event.created_by && (
                        <button
                          onClick={() => deleteEvent.mutate(event.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No events scheduled</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      <AnimatePresence>
        {showNewEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Add Important Date</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="deadline">Deadline</option>
                    <option value="milestone">Milestone</option>
                    <option value="meeting">Meeting</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowNewEventModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEvent}
                    disabled={!newEventTitle.trim() || !newEventDate}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Brainstorm
