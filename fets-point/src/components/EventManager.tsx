import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, User, Clock, AlertTriangle,
  Monitor, Wrench, Building, Users, UserX, Globe, Zap, MoreHorizontal,
  X, CheckCircle, Circle, Edit3, Trash2, Calendar, Filter
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface Event {
  id: string
  title: string
  description: string
  category: string
  priority: 'critical' | 'major' | 'minor'
  status: 'open' | 'assigned' | 'in_progress' | 'escalated' | 'closed'
  reporter_id: string
  assigned_to?: string
  event_date: string
  created_at: string
  updated_at: string
  closed_at?: string
  closure_remarks?: string
  branch_location: string
}

interface EventStats {
  total_open: number
  total_closed: number
  critical_open: number
  major_open: number
  minor_open: number
  upcoming_this_week: number
  by_category: { [key: string]: number }
}

const EVENT_CATEGORIES = [
  { id: 'computer', name: 'Computer/System', icon: Monitor, color: 'bg-blue-500' },
  { id: 'equipment', name: 'Equipment Failure', icon: Wrench, color: 'bg-orange-500' },
  { id: 'property', name: 'Property Damage', icon: Building, color: 'bg-red-500' },
  { id: 'staff', name: 'Staff Issue', icon: Users, color: 'bg-purple-500' },
  { id: 'candidate', name: 'Candidate Issue', icon: UserX, color: 'bg-pink-500' },
  { id: 'client', name: 'Client/Provider', icon: Globe, color: 'bg-green-500' },
  { id: 'utility', name: 'Environment/Utility', icon: Zap, color: 'bg-yellow-500' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: 'bg-gray-500' }
]

const PRIORITY_CONFIG = {
  critical: { color: 'bg-red-500 text-white', dot: 'bg-red-500', label: 'Critical', border: 'border-red-200' },
  major: { color: 'bg-orange-500 text-white', dot: 'bg-orange-500', label: 'Major', border: 'border-orange-200' },
  minor: { color: 'bg-blue-500 text-white', dot: 'bg-blue-500', label: 'Minor', border: 'border-blue-200' }
}

const STATUS_CONFIG = {
  open: { color: 'bg-blue-100 text-blue-800', label: 'Open', icon: Circle },
  assigned: { color: 'bg-teal-100 text-teal-800', label: 'Assigned', icon: User },
  in_progress: { color: 'bg-amber-100 text-amber-800', label: 'In Progress', icon: Clock },
  escalated: { color: 'bg-red-100 text-red-800', label: 'Escalated', icon: AlertTriangle },
  closed: { color: 'bg-green-100 text-green-800', label: 'Closed', icon: CheckCircle }
}

export default function EventManager() {
  const { profile, hasPermission } = useAuth()
  const { activeBranch } = useBranch()
  const canEdit = hasPermission('event_edit')

  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<EventStats>({
    total_open: 0, total_closed: 0, critical_open: 0, major_open: 0, minor_open: 0,
    upcoming_this_week: 0, by_category: {}
  })
  const [loading, setLoading] = useState(true)
  const [showNewEventModal, setShowNewEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventDetail, setShowEventDetail] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })

      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data, error } = await query
      if (error) throw error

      setEvents((data || []) as Event[])
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [activeBranch])

  const loadStats = useCallback(async () => {
    try {
      let query = supabase
        .from('events')
        .select('status, priority, category, event_date, created_at, closed_at')

      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data, error } = await query
      if (error) throw error

      const openEvents = data?.filter(e => e.status !== 'closed') || []
      const closedEvents = data?.filter(e => e.status === 'closed') || []

      const categoryStats: { [key: string]: number } = {}
      data?.forEach(event => {
        const cat = event.category || 'other'
        categoryStats[cat] = (categoryStats[cat] || 0) + 1
      })

      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcomingThisWeek = data?.filter(e => {
        const eventDate = new Date(e.event_date)
        return eventDate >= now && eventDate <= weekFromNow && e.status !== 'closed'
      }).length || 0

      setStats({
        total_open: openEvents.length,
        total_closed: closedEvents.length,
        critical_open: openEvents.filter(e => e.priority === 'critical').length,
        major_open: openEvents.filter(e => e.priority === 'major').length,
        minor_open: openEvents.filter(e => e.priority === 'minor').length,
        upcoming_this_week: upcomingThisWeek,
        by_category: categoryStats
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [activeBranch])

  // Load events
  useEffect(() => {
    loadEvents()
    loadStats()
  }, [activeBranch, loadEvents, loadStats])

  const filteredEvents = events.filter(event => {
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !event.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter !== 'all' && event.category !== categoryFilter) return false
    if (priorityFilter !== 'all' && event.priority !== priorityFilter) return false
    if (statusFilter !== 'all' && event.status !== statusFilter) return false
    return true
  })

  const getTimeSince = (dateString: string) => {
    const now = new Date().getTime()
    const created = new Date(dateString).getTime()
    const diffHours = Math.floor((now - created) / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Manager</h1>
              <p className="text-gray-600 mt-1">Track, manage, and resolve operational events</p>
            </div>

            <button
              onClick={() => setShowNewEventModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 bg-white"
            >
              <option value="all">All Categories</option>
              {EVENT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 bg-white"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Circle className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-medium text-gray-600">Open</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total_open}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-gray-600">Closed</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total_closed}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-xs font-medium text-red-700">Critical</p>
            </div>
            <p className="text-2xl font-bold text-red-900">{stats.critical_open}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-medium text-orange-700">Major</p>
            </div>
            <p className="text-2xl font-bold text-orange-900">{stats.major_open}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Circle className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-medium text-blue-700">Minor</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.minor_open}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 bg-purple-50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-medium text-purple-700">This Week</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats.upcoming_this_week}</p>
          </div>
        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or create a new event.</p>
            <button
              onClick={() => setShowNewEventModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredEvents.map((event) => {
                const categoryConfig = EVENT_CATEGORIES.find(cat => cat.id === event.category) || EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1]
                const Icon = categoryConfig.icon
                const priorityConfig = PRIORITY_CONFIG[event.priority] || PRIORITY_CONFIG.minor
                const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.open
                const StatusIcon = statusConfig.icon

                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                    onClick={() => {
                      setSelectedEvent(event)
                      setShowEventDetail(true)
                    }}
                  >
                    {/* Card Header - Category Banner */}
                    <div className={`${categoryConfig.color} h-3`}></div>

                    <div className="p-6">
                      {/* Category & Priority */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${categoryConfig.color} rounded-xl flex items-center justify-center shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-yellow-600 transition-colors">
                              {event.title}
                            </h3>
                            <p className="text-xs text-gray-500">{categoryConfig.name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">{event.description}</p>

                      {/* Priority Badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${priorityConfig.color} shadow-sm`}>
                          <div className={`w-2 h-2 rounded-full ${priorityConfig.dot} animate-pulse`}></div>
                          {priorityConfig.label}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          {getTimeSince(event.created_at)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* New Event Modal */}
      {showNewEventModal && (
        <NewEventModal
          onClose={() => setShowNewEventModal(false)}
          onEventCreated={() => {
            loadEvents()
            loadStats()
            setShowNewEventModal(false)
          }}
        />
      )}

      {/* Event Detail Modal */}
      {showEventDetail && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => {
            setShowEventDetail(false)
            setSelectedEvent(null)
          }}
          onEventUpdated={() => {
            loadEvents()
            loadStats()
          }}
        />
      )}
    </div>
  )
}

// New Event Modal Component
function NewEventModal({ onClose, onEventCreated }: {
  onClose: () => void
  onEventCreated: () => void
}) {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'minor' as 'critical' | 'major' | 'minor',
    event_date: new Date().toISOString().split('T')[0]
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          status: 'open',
          reporter_id: profile.user_id,
          event_date: new Date(formData.event_date).toISOString(),
          branch_location: activeBranch === 'global' ? 'calicut' : activeBranch
        })

      if (error) throw error

      toast.success('Event created successfully')
      onEventCreated()
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-yellow-500">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">Create New Event</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Brief description of the event"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                {EVENT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'critical' | 'major' | 'minor' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
              placeholder="Detailed description of the event..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// Event Detail Modal Component
function EventDetailModal({ event, onClose, onEventUpdated }: {
  event: Event
  onClose: () => void
  onEventUpdated: () => void
}) {
  const { profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: event.title,
    description: event.description,
    category: event.category,
    priority: event.priority,
    status: event.status,
    event_date: new Date(event.event_date).toISOString().split('T')[0]
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [updating, setUpdating] = useState(false)

  const categoryConfig = EVENT_CATEGORIES.find(cat => cat.id === event.category) || EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1]
  const Icon = categoryConfig.icon
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('event_edit')

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          priority: editForm.priority,
          status: editForm.status,
          event_date: new Date(editForm.event_date).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id)

      if (error) throw error

      toast.success('Event updated successfully')
      setIsEditing(false)
      onEventUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update event')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', event.id)
      if (error) throw error

      toast.success('Event deleted successfully')
      onEventUpdated()
      onClose()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString()
      }

      const { error } = await supabase.from('events').update(updateData).eq('id', event.id)
      if (error) throw error

      toast.success(`Event ${newStatus === 'closed' ? 'closed' : 'updated'} successfully`)
      onEventUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className={`p-6 border-b border-gray-200 ${categoryConfig.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{event.title}</h2>
                <p className="text-white/80">{categoryConfig.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  title="Edit event"
                >
                  <Edit3 className="w-5 h-5 text-white" />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400"
                  placeholder="Title"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 resize-none"
                  rows={4}
                  placeholder="Description"
                />
                <div className="grid grid-cols-4 gap-4">
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400"
                  >
                    {EVENT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="closed">Closed</option>
                  </select>
                  <input
                    type="date"
                    value={editForm.event_date}
                    onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{event.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Event Date</h4>
                    <p className="text-gray-600">{new Date(event.event_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Created</h4>
                    <p className="text-gray-600">{new Date(event.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Priority</h4>
                    <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium ${PRIORITY_CONFIG[event.priority].color}`}>
                      {PRIORITY_CONFIG[event.priority].label}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[event.status].color}`}>
                      {STATUS_CONFIG[event.status].label}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {updating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="ml-auto px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Event
                    </button>
                  )}
                </>
              ) : (
                <>
                  {event.status !== 'closed' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => handleStatusChange('closed')}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                      >
                        Mark as Closed
                      </button>
                    </>
                  )}
                  {event.status === 'closed' && (
                    <button
                      onClick={() => handleStatusChange('open')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
                    >
                      Reopen Event
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Event</h3>
                <p className="text-sm text-gray-600">Are you sure?</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              This action cannot be undone. The event will be permanently deleted from the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
