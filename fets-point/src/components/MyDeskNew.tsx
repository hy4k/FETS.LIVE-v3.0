import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  FolderLock,
  Lightbulb,
  Clock,
  Calendar as CalendarIcon,
  Pin,
  ChevronRight,
  MoreHorizontal,
  Search
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBrainstormEvents } from '../hooks/useBrainstorm'
import { useBranch } from '../hooks/useBranch'
import FetsConnectNew from './FetsConnectNew'
import ResourceCentre from './ResourceCentre'
import Brainstorm from './Brainstorm'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

// --- Helper Components ---

const ClockWidget = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center space-x-2 text-gray-600 bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 shadow-sm">
      <Clock size={18} className="text-amber-600" />
      <span className="font-medium font-mono">
        {format(time, 'EEE, MMM d • h:mm a')}
      </span>
    </div>
  )
}

const QuickAccessWidget = () => {
  const { profile } = useAuth()
  const [pins, setPins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const fetchPins = async () => {
      try {
        const { data: pinData } = await supabase
          .from('vault_item_pins')
          .select('item_id')
          .eq('user_id', profile.id)

        if (pinData && pinData.length > 0) {
          const itemIds = pinData.map(p => p.item_id)
          const { data: items } = await supabase
            .from('vault')
            .select('id, title, type')
            .in('id', itemIds)
            .limit(5)

          setPins(items || [])
        }
      } catch (error) {
        console.error('Error fetching pins:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPins()
  }, [profile])

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded-xl"></div>
  if (pins.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Pin size={16} className="text-amber-500" />
          Quick Access
        </h3>
      </div>
      <div className="space-y-2">
        {pins.map((pin) => (
          <div key={pin.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <FolderLock size={14} />
            </div>
            <span className="text-sm text-gray-700 font-medium truncate flex-1">{pin.title}</span>
            <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  )
}

const UpcomingEventsWidget = () => {
  const { activeBranch } = useBranch()
  const { data: events = [] } = useBrainstormEvents(activeBranch)

  // Filter for future events and sort by date
  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3)

  if (upcomingEvents.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon size={16} className="text-amber-500" />
          Upcoming
        </h3>
      </div>
      <div className="space-y-3">
        {upcomingEvents.map((event) => (
          <div key={event.id} className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-50 rounded-lg flex flex-col items-center justify-center text-amber-700 border border-amber-100">
              <span className="text-xs font-bold uppercase">{format(new Date(event.event_date), 'MMM')}</span>
              <span className="text-sm font-bold">{format(new Date(event.event_date), 'd')}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 line-clamp-1">{event.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{format(new Date(event.event_date), 'EEEE')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Main Component ---

export function MyDeskNew() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'connect' | 'resources' | 'brainstorm'>('connect')

  const menuItems = [
    { id: 'connect' as const, label: 'Connect', icon: MessageSquare, description: 'Team updates & discussions' },
    { id: 'resources' as const, label: 'Resources', icon: FolderLock, description: 'Documents & SOPs' },
    { id: 'brainstorm' as const, label: 'Brainstorm', icon: Lightbulb, description: 'Ideas & Planning' }
  ]

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Personalized Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                {profile?.full_name ? `${profile.full_name.split(' ')[0]}'s Desk` : 'My Desk'}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back to your workspace</p>
          </div>
          <ClockWidget />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Sidebar - Navigation */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{profile?.full_name}</h2>
              <p className="text-sm text-gray-500 mb-4">{profile?.role || 'Staff Member'}</p>
              <div className="flex justify-center gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                <div className="text-center">
                  <span className="block font-bold text-gray-900">12</span>
                  <span className="text-xs">Posts</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-gray-900">5</span>
                  <span className="text-xs">Ideas</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-gray-900">8</span>
                  <span className="text-xs">Tasks</span>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive
                        ? 'bg-amber-50 text-amber-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                      <Icon size={20} className={isActive ? 'text-amber-600' : 'text-gray-500'} />
                    </div>
                    <div className="text-left">
                      <span className="block font-semibold">{item.label}</span>
                      <span className="text-xs opacity-80 hidden xl:block">{item.description}</span>
                    </div>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Center Column - Feed/Content */}
          <div className="lg:col-span-6 space-y-6">
            {/* Mobile Navigation (Visible only on small screens) */}
            <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${isActive
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'connect' && <FetsConnectNew />}
                {activeTab === 'resources' && <ResourceCentre />}
                {activeTab === 'brainstorm' && <Brainstorm />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Sidebar - Widgets */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <QuickAccessWidget />
            <UpcomingEventsWidget />

            {/* Daily Quote or Tip Widget */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <h3 className="font-bold text-lg mb-2 relative z-10">Did you know?</h3>
              <p className="text-indigo-100 text-sm relative z-10">
                You can pin your most used resources for quick access right here on your desk.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default MyDeskNew
