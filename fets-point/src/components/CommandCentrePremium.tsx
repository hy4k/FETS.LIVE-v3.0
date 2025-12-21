import { GlassCard } from './iCloud/GlassCard'
import { Users, Calendar, Activity, CheckCircle, TrendingUp, AlertCircle, Shield, Bell, Clock, Sparkles, ClipboardList, ClipboardCheck, CheckCircle2, X, Plus, Trash2, ChevronRight, Zap, Target, Briefcase, Calendar as CalendarIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useDashboardStats, useChecklistTemplates } from '../hooks/useCommandCentre'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// Removed dead imports ChecklistFillModal and CreateCustomChecklistModal
import { CustomChecklistSelector } from './CustomChecklistSelector'
import { CommandCentreGraphs } from './CommandCentreGraphs'
import { NewsTickerBar } from './NewsTickerBar'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

interface ChecklistItem {
  id: string
  name: string
  completed: boolean
  responsible_person: string
  completion_time: string | null
}

interface ChecklistTemplate {
  id: string
  title: string
  type: 'pre_exam' | 'post_exam' | 'custom'
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  description?: string
  questions?: ChecklistTemplateItem[]
  name?: string // alias for title used in some places
}

interface ChecklistTemplateItem {
  id: string
  title: string // mapped from text
  description?: string
  priority: 'low' | 'medium' | 'high'
  estimated_time_minutes?: number
  responsible_role?: string
  sort_order?: number
  notes?: string
  question_type?: 'checkbox' | 'text' | 'number' | 'dropdown' | 'date' | 'time' | 'textarea' | 'radio' | 'yes_no' // mapped from type
  dropdown_options?: string[] // mapped from options
  required?: boolean
  text?: string // raw from db
  type?: string // raw from db
  options?: string[] // raw from db
}

interface RosterSession {
  id: string
  date: string
  shift_code: string
  staff_assigned: number
  overtime_hours: number
  center_name: string
}

const PRIORITY_CONFIG = {
  high: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'High' },
  medium: { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'Medium' },
  low: { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Low' }
}

// Animated Progress Circle Component
const ProgressCircle = ({ percentage, label, value, icon: Icon, color }: any) => (
  <div className="flex flex-col items-center justify-center">
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          initial={{ strokeDasharray: '0 339.29' }}
          animate={{ strokeDasharray: `${(percentage / 100) * 339.29} 339.29` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {Icon && <Icon className="w-8 h-8" style={{ color }} />}
      </div>
    </div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-4 text-center"
    >
      <div className="text-2xl font-bold" style={{ color }}>{Math.round(percentage)}%</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
      {value && <div className="text-xs text-gray-500 mt-1">{Math.round(value)}</div>}
    </motion.div>
  </div>
)

export default function CommandCentrePremium() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const { data: stats, isLoading } = useDashboardStats()
  const { data: templates, isLoading: isLoadingTemplates } = useChecklistTemplates()
  const { preExamTemplate, postExamTemplate, customTemplates } = templates || {}



  // Helper to map questions to items
  const mapQuestionsToItems = (questions: any[]): ChecklistTemplateItem[] => {
    return (questions || []).map((q: any) => {
      const questionType = q.type || q.question_type || 'checkbox';
      return {
        id: q.id || crypto.randomUUID(),
        title: q.text || q.title || q.label || '',
        description: q.description || '',
        priority: q.priority || 'medium',
        estimated_time_minutes: q.estimated_time_minutes || 5,
        responsible_role: q.responsible_role || 'staff',
        question_type: questionType,
        type: questionType, // Set both fields for compatibility
        dropdown_options: q.options || q.dropdown_options || [],
        required: q.required ?? false
      } as any;
    })
  }

  const preExamItems = useMemo(() =>
    preExamTemplate?.questions ? mapQuestionsToItems(preExamTemplate.questions) : [],
    [preExamTemplate]
  )

  const postExamItems = useMemo(() =>
    postExamTemplate?.questions ? mapQuestionsToItems(postExamTemplate.questions) : [],
    [postExamTemplate]
  )

  const [showPreExamModal, setShowPreExamModal] = useState(false)
  const [showPostExamModal, setShowPostExamModal] = useState(false)
  const [showCustomChecklistModal, setShowCustomChecklistModal] = useState(false)
  const [showCustomSelector, setShowCustomSelector] = useState(false)
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<ChecklistTemplate | null>(null)
  const [selectedCustomItems, setSelectedCustomItems] = useState<ChecklistTemplateItem[]>([])
  const [showCustomFillModal, setShowCustomFillModal] = useState(false)
  const [fillData, setFillData] = useState({ exam_date: '', items: {} as Record<string, any> })
  const [rosterSessions, setRosterSessions] = useState<RosterSession[]>([])

  const selectedTemplate = showPreExamModal ? preExamTemplate :
    showPostExamModal ? postExamTemplate :
      showCustomFillModal ? selectedCustomTemplate : null

  const selectedTemplateItems = useMemo(() =>
    showPreExamModal ? preExamItems :
      showPostExamModal ? postExamItems :
        showCustomFillModal ? selectedCustomItems : [],
    [showPreExamModal, showPostExamModal, showCustomFillModal, preExamItems, postExamItems, selectedCustomItems]
  )

  useEffect(() => {
    // Only reset fill data when the modal OPEN state changes to true
    if ((showPreExamModal || showPostExamModal || showCustomFillModal) && selectedTemplate) {
      const initialItems: Record<string, any> = {}
      selectedTemplateItems.forEach(item => {
        const type = item.type || item.question_type || 'checkbox';
        if (type === 'checkbox') {
          initialItems[item.id.toString()] = false;
        } else if (type === 'yes_no') {
          initialItems[item.id.toString()] = null;
        } else {
          initialItems[item.id.toString()] = '';
        }
      })
      setFillData({ exam_date: new Date().toISOString().split('T')[0], items: initialItems })
    }
  }, [showPreExamModal, showPostExamModal, showCustomFillModal, selectedTemplate, selectedTemplateItems]) // Only run when modal visibility changes

  // Fetch 7-day roster preview
  useEffect(() => {
    const fetchRosterPreview = async () => {
      try {
        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .gte('date', today.toISOString().split('T')[0])
          .lte('date', nextWeek.toISOString().split('T')[0])
          .limit(7)

        if (!error && data) {
          const sessions = data.map((session: any) => ({
            id: session.id,
            date: session.session_date,
            shift_code: session.shift_code || 'Regular',
            staff_assigned: Math.floor(Math.random() * 10) + 5,
            overtime_hours: Math.floor(Math.random() * 8),
            center_name: session.center_name || 'Main Center'
          }))
          setRosterSessions(sessions)
        }
      } catch (err) {
        console.error('Error fetching roster preview:', err)
        // Set mock data as fallback
        const mockSessions = Array.from({ length: 7 }, (_, i) => ({
          id: `mock-${i}`,
          date: new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          shift_code: ['Morning', 'Afternoon', 'Evening'][i % 3],
          staff_assigned: Math.floor(Math.random() * 10) + 5,
          overtime_hours: Math.floor(Math.random() * 8),
          center_name: (activeBranch as any)?.name || activeBranch || 'Main Center'
        }))
        setRosterSessions(mockSessions)
      }
    }

    fetchRosterPreview()
  }, [activeBranch])
  const [customChecklistData, setCustomChecklistData] = useState({
    name: '',
    description: '',
    questions: [] as Array<{
      id: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimated_time_minutes: number;
      question_type: 'checkbox' | 'text' | 'number' | 'dropdown' | 'date' | 'time' | 'radio' | 'yes_no' | 'textarea';
      dropdown_options: string[];
    }>
  })

  const handleOpenPreExam = () => {
    if (!preExamTemplate || (!preExamTemplate.questions && preExamItems.length === 0)) {
      toast.error('Pre-exam checklist template not found')
      return
    }
    setShowPreExamModal(true)
  }

  const handleOpenPostExam = () => {
    if (!postExamTemplate || (!postExamTemplate.questions && postExamItems.length === 0)) {
      toast.error('Post-exam checklist template not found')
      return
    }
    setShowPostExamModal(true)
  }

  const addCustomQuestion = () => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `temp-${Date.now()}`,
          title: '',
          description: '',
          priority: 'medium',
          estimated_time_minutes: 5,
          question_type: 'checkbox',
          dropdown_options: []
        }
      ]
    }))
  }

  const updateCustomQuestion = (id: string, updates: any) => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }))
  }

  const deleteCustomQuestion = (id: string) => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }))
  }

  const submitChecklist = async (data: { exam_date: string; items: { [key: string]: boolean | string | number } }, template: ChecklistTemplate | null) => {
    console.log('submitChecklist called', { data, template, profile })

    if (!profile) {
      console.error('No profile found')
      toast.error('User profile not found. Please refresh the page.')
      return
    }

    if (!template) {
      console.error('No template found')
      toast.error('Checklist template not found')
      return
    }

    // Use selectedTemplateItems directly - it's already computed based on which modal is open
    const itemsForTemplate = selectedTemplateItems

    console.log('Items for template:', itemsForTemplate, 'Template type:', template.type)

    if (itemsForTemplate.length === 0) {
      console.error('No items found for template')
      toast.error('No checklist items found')
      return
    }

    const missingRequired = itemsForTemplate.filter(item => {
      if (!item.required) return false;
      const itemValue = data.items[item.id.toString()];
      const questionType = item.question_type || 'checkbox';
      if (questionType === 'checkbox') return itemValue !== true;
      return !itemValue;
    });

    if (missingRequired.length > 0) {
      toast.error(`Required: ${missingRequired.map(i => i.title).join(', ')}`);
      return;
    }

    const allCompleted = itemsForTemplate.every(item => {
      const itemValue = data.items[item.id.toString()]
      const questionType = item.question_type || 'checkbox'

      if (questionType === 'checkbox') {
        return itemValue === true
      } else {
        return !!itemValue
      }
    })

    if (!allCompleted) {
      const proceed = confirm('Some optional items are empty. Submit anyway?')
      if (!proceed) return
    }

    try {
      const submission: any = {
        template_id: template.id,
        submitted_by: profile.user_id,
        branch_id: typeof activeBranch === 'string'
          ? (activeBranch === 'global' ? 'calicut' : activeBranch)
          : ((activeBranch as any)?.name || 'calicut'),
        submitted_at: new Date().toISOString(),
        answers: {
          exam_date: data.exam_date,
          responses: data.items
        },
        status: allCompleted ? 'completed' : 'in_progress'
      };

      const { data: instance, error: instanceError } = await supabase
        .from('checklist_submissions')
        .insert(submission)
        .select()
        .single()

      if (instanceError) {
        console.error('Submission error:', instanceError);
        toast.error(`Failed to submit checklist: ${instanceError.message}`)
        throw instanceError;
      }

      console.log('Checklist submitted successfully!')
      toast.success('Checklist submitted successfully')

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })

      setShowPreExamModal(false)
      setShowPostExamModal(false)
      setShowCustomFillModal(false)
      setSelectedCustomTemplate(null)
    } catch (error: any) {
      console.error('Error submitting checklist:', error)
      toast.error(error.message || 'Failed to submit checklist')
    }
  }

  const createCustomChecklist = async (customChecklistData: any) => {
    if (!profile || !customChecklistData.name.trim()) {
      toast.error('Checklist name is required')
      return
    }

    if (customChecklistData.questions.length === 0) {
      toast.error('At least one question is required')
      return
    }

    const questions = customChecklistData.questions.map((q: any, index: number) => ({
      id: crypto.randomUUID(),
      text: q.title, // Map title to text
      description: q.description,
      priority: q.priority,
      estimated_time_minutes: q.estimated_time_minutes,
      type: q.question_type, // Map question_type to type
      options: q.dropdown_options,
      required: true
    }))

    try {
      const { data: template, error: templateError } = await supabase
        .from('checklist_templates')
        .insert({
          title: customChecklistData.name, // Fixed: name -> title
          description: customChecklistData.description,
          type: 'custom', // Fixed: category -> type (enum)
          questions: questions,
          is_active: true,
          created_by: profile.user_id
        })
        .select()
        .single()

      if (templateError) throw templateError

      toast.success('Custom checklist created successfully')
      queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] })
      setShowCustomChecklistModal(false)
      setCustomChecklistData({ name: '', description: '', questions: [] })
    } catch (error: any) {
      console.error('Error creating custom checklist:', error)
      toast.error('Failed to create custom checklist: ' + error.message)
    }
  }

  const handleSelectCustomTemplate = async (template: ChecklistTemplate) => {
    try {
      // Use questions from template directly
      const questions = template.questions || []
      const items = mapQuestionsToItems(questions)

      setSelectedCustomTemplate(template)
      setSelectedCustomItems(items)

      // Initialize fillData for custom template
      const initialItems: Record<string, any> = {}
      items.forEach(item => {
        const type = item.type || item.question_type || 'checkbox';
        if (type === 'checkbox') {
          initialItems[item.id.toString()] = false;
        } else if (type === 'yes_no') {
          initialItems[item.id.toString()] = null;
        } else {
          initialItems[item.id.toString()] = '';
        }
      })
      setFillData({ exam_date: new Date().toISOString().split('T')[0], items: initialItems })

      setShowCustomFillModal(true)
    } catch (error: any) {
      console.error('Error loading custom template:', error)
      toast.error('Failed to load checklist template')
    }
  }

  return (
    <>
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
                Command Centre
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                {activeBranch && activeBranch !== 'global' ? `${activeBranch.charAt(0).toUpperCase() + activeBranch.slice(1)} · ` : ''}Welcome back, {profile?.full_name || 'User'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 font-semibold uppercase tracking-wider text-sm">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </motion.div>

          {/* News Ticker Bar - Just above Hero Section */}
          <NewsTickerBar />

          {/* Hero Run Checklist Section - Neumorphic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="neomorphic-card p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="indicator-dot active"></div>
                <h2 className="text-2xl font-bold text-gray-700 uppercase tracking-wide flex items-center gap-3">
                  <Target className="text-yellow-600 w-6 h-6" />
                  Daily Checklists
                </h2>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-6 ml-6">
                Complete your essential tasks to keep operations running smoothly
              </p>

              {/* Checklist Buttons Grid - Neumorphic */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pre-Exam Checklist */}
                <motion.button
                  onClick={handleOpenPreExam}
                  whileHover={{ translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="neomorphic-btn flex-col items-start p-6 h-auto group hover:text-yellow-600"
                >
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center">
                      <ClipboardList className="text-gray-600 w-6 h-6 group-hover:text-yellow-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase bg-gray-200/50 px-2 py-1 rounded">Pre-Exam</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2 group-hover:text-yellow-600">
                    {preExamTemplate?.title || 'Pre-Exam Checklist'}
                  </h3>
                  <p className="text-xs text-gray-500 text-left leading-relaxed">
                    {preExamTemplate?.description || 'Verify all systems before session starts'}
                  </p>
                </motion.button>

                {/* Post-Exam Checklist */}
                <motion.button
                  onClick={handleOpenPostExam}
                  whileHover={{ translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="neomorphic-btn flex-col items-start p-6 h-auto group hover:text-yellow-600"
                >
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center">
                      <ClipboardCheck className="text-gray-600 w-6 h-6 group-hover:text-yellow-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase bg-gray-200/50 px-2 py-1 rounded">Post-Exam</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2 group-hover:text-yellow-600">
                    {postExamTemplate?.title || 'Post-Exam Checklist'}
                  </h3>
                  <p className="text-xs text-gray-500 text-left leading-relaxed">
                    {postExamTemplate?.description || 'Verify completion and cleanup procedures'}
                  </p>
                </motion.button>

                {/* Custom Checklist */}
                <motion.button
                  onClick={() => setShowCustomSelector(true)}
                  whileHover={{ translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="neomorphic-btn flex-col items-start p-6 h-auto group hover:text-yellow-600"
                >
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center">
                      <Sparkles className="text-gray-600 w-6 h-6 group-hover:text-yellow-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase bg-gray-200/50 px-2 py-1 rounded">Custom</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2 group-hover:text-yellow-600">Custom Checklists</h3>
                  <p className="text-xs text-gray-500 text-left leading-relaxed">Fill out your custom task templates</p>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Enhanced KPI Cards with Animated Widgets - Neumorphic */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Total Candidates - Progress Circle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="neomorphic-card p-6 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Users size={60} />
              </div>
              <ProgressCircle
                percentage={Math.min(((stats?.totalCandidates || 0) / 1000) * 100, 100)}
                label="Total Candidates"
                value={Math.floor(stats?.totalCandidates || 0)}
                icon={Users}
                color="#f59e0b"
              />
            </motion.div>

            {/* Today's Sessions - Progress Circle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="neomorphic-card p-6 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Calendar size={60} />
              </div>
              <ProgressCircle
                percentage={Math.min(((stats?.todayCandidates || 0) / 100) * 100, 100)}
                label="Today's Sessions"
                value={stats?.todayCandidates || 0}
                icon={Calendar}
                color="#d97706"
              />
            </motion.div>

            {/* Active Events - Progress Circle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="neomorphic-card p-6 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Activity size={60} />
              </div>
              <ProgressCircle
                percentage={Math.min(((stats?.openEvents || 0) / 50) * 100, 100)}
                label="Active Events"
                value={stats?.openEvents || 0}
                icon={Activity}
                color="#b45309"
              />
            </motion.div>

            {/* Pending Tasks - Progress Circle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="neomorphic-card p-6 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <CheckCircle size={60} />
              </div>
              <ProgressCircle
                percentage={Math.min(((stats?.pendingChecklists || 0) / 50) * 100, 100)}
                label="Pending Tasks"
                value={stats?.pendingChecklists || 0}
                icon={CheckCircle}
                color="#78350f"
              />
            </motion.div>
          </div>

          {/* Graphical Analytics Section */}
          <CommandCentreGraphs />

          {/* Copyright Footer */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl neomorphic-card">
              <p className="text-gray-500 text-xs font-medium">
                © 2025-2026 Forun Testing and Educational Service
              </p>
            </div>
          </div>
        </div >

        {/* Pre/Post Exam Checklist Modal - Enhanced Neumorphic Design */}
        <AnimatePresence>
          {
            (showPreExamModal || showPostExamModal) && selectedTemplate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gradient-to-br from-slate-900/60 via-blue-900/40 to-purple-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-[#e0e5ec] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-[20px_20px_60px_#bec3c9,-20px_-20px_60px_#ffffff]"
                >
                  {/* Header with Gradient Accent */}
                  <div className={`p-6 relative overflow-hidden ${showPreExamModal ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500' : 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500'}`}>
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                          {showPreExamModal ?
                            <ClipboardList className="w-7 h-7 text-white" /> :
                            <ClipboardCheck className="w-7 h-7 text-white" />
                          }
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white tracking-tight">{selectedTemplate.title}</h2>
                          <p className="text-white/80 text-sm font-medium">{showPreExamModal ? 'Pre-Exam Protocol' : 'Post-Exam Protocol'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowPreExamModal(false); setShowPostExamModal(false); }}
                        className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Content Area with Neumorphic Styling */}
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)] bg-[#e0e5ec]">
                    {/* Date Input - Neumorphic */}
                    <div className="mb-8">
                      <label className="block text-gray-700 font-semibold mb-3 uppercase text-sm tracking-wider">Exam Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={fillData.exam_date}
                          onChange={(e) => setFillData(prev => ({ ...prev, exam_date: e.target.value }))}
                          className="w-full px-5 py-4 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 font-medium shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_8px_8px_16px_#bec3c9,inset_-8px_-8px_16px_#ffffff] transition-all"
                        />
                        <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Checklist Items - Neumorphic Cards */}
                    <div className="space-y-4">
                      {selectedTemplateItems.length === 0 ? (
                        <div className="text-center py-12 px-6 rounded-2xl bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff]">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No checklist items found</p>
                          <p className="text-gray-400 text-sm mt-1">Please create items in the checklist template first</p>
                        </div>
                      ) : (
                        selectedTemplateItems.map((item, index) => {
                          const itemValue = fillData.items[item.id.toString()];
                          // Normalize type detection - check both fields
                          const qType = (item as any).type || (item as any).question_type || item.question_type || 'checkbox';

                          const isCompleted = qType === 'checkbox'
                            ? itemValue === true
                            : (Array.isArray(itemValue) ? itemValue.length > 0 : !!itemValue && itemValue !== '');

                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`p-5 rounded-2xl transition-all duration-300 ${isCompleted
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] border-2 border-green-300'
                                : 'bg-[#e0e5ec] shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] hover:shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] border-2 border-transparent'
                                }`}
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className={`font-bold text-lg transition-colors flex-1 ${isCompleted ? 'text-green-700' : 'text-gray-800'}`}>
                                    {index + 1}. {item.title} {item.required && <span className="text-red-500">*</span>}
                                  </h4>
                                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide flex-shrink-0 ${item.priority === 'high'
                                    ? 'bg-red-100 text-red-600 shadow-sm'
                                    : item.priority === 'medium'
                                      ? 'bg-amber-100 text-amber-600 shadow-sm'
                                      : 'bg-blue-100 text-blue-600 shadow-sm'
                                    }`}>
                                    {item.priority}
                                  </span>
                                </div>
                                {item.description && (
                                  <p className="text-gray-500 text-sm leading-relaxed mb-1">{item.description}</p>
                                )}

                                {/* Dynamic Input Rendering */}
                                <div className="mt-2">
                                  {(!item.question_type || item.question_type === 'checkbox') && (
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                      <div
                                        onClick={() => setFillData(prev => ({
                                          ...prev,
                                          items: { ...prev.items, [item.id.toString()]: !itemValue }
                                        }))}
                                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${itemValue === true
                                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-md'
                                          : 'bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#bec3c9,inset_-3px_-3px_6px_#ffffff] group-hover:shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff]'
                                          }`}
                                      >
                                        {itemValue === true && <CheckCircle2 className="w-5 h-5 text-white" />}
                                      </div>
                                      <span className="text-gray-600 font-medium select-none group-hover:text-gray-800">Mark as Complete</span>
                                    </label>
                                  )}

                                  {qType === 'text' && (
                                    <input
                                      type="text"
                                      placeholder="Enter your answer..."
                                      value={(itemValue as string) || ''}
                                      onChange={(e) => setFillData(prev => ({
                                        ...prev,
                                        items: { ...prev.items, [item.id.toString()]: e.target.value }
                                      }))}
                                      className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all border border-transparent focus:border-blue-300/30"
                                    />
                                  )}

                                  {qType === 'textarea' && (
                                    <textarea
                                      rows={3}
                                      placeholder="Enter detailed response..."
                                      value={(itemValue as string) || ''}
                                      onChange={(e) => setFillData(prev => ({
                                        ...prev,
                                        items: { ...prev.items, [item.id.toString()]: e.target.value }
                                      }))}
                                      className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all border border-transparent focus:border-blue-300/30 resize-none"
                                    />
                                  )}

                                  {qType === 'number' && (
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={(itemValue as string) || ''}
                                      onChange={(e) => setFillData(prev => ({
                                        ...prev,
                                        items: { ...prev.items, [item.id.toString()]: e.target.value }
                                      }))}
                                      className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all border border-transparent focus:border-blue-300/30"
                                    />
                                  )}

                                  {qType === 'date' && (
                                    <input
                                      type="date"
                                      value={(itemValue as string) || ''}
                                      onChange={(e) => setFillData(prev => ({
                                        ...prev,
                                        items: { ...prev.items, [item.id.toString()]: e.target.value }
                                      }))}
                                      className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all border border-transparent focus:border-blue-300/30"
                                    />
                                  )}

                                  {qType === 'time' && (
                                    <input
                                      type="time"
                                      value={(itemValue as string) || ''}
                                      onChange={(e) => setFillData(prev => ({
                                        ...prev,
                                        items: { ...prev.items, [item.id.toString()]: e.target.value }
                                      }))}
                                      className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all border border-transparent focus:border-blue-300/30"
                                    />
                                  )}

                                  {qType === 'dropdown' && (
                                    <div className="relative">
                                      <select
                                        value={(itemValue as string) || ''}
                                        onChange={(e) => setFillData(prev => ({
                                          ...prev,
                                          items: { ...prev.items, [item.id.toString()]: e.target.value }
                                        }))}
                                        className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] appearance-none cursor-pointer focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all border border-transparent focus:border-blue-300/30"
                                      >
                                        <option value="" disabled>Select an option</option>
                                        {(item.dropdown_options || item.options)?.map((opt, i) => (
                                          <option key={i} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
                                    </div>
                                  )}

                                  {qType === 'radio' && (
                                    <div className="flex flex-col gap-2 mt-1">
                                      {(item.dropdown_options || item.options)?.map((opt, i) => {
                                        const isSelected = itemValue === opt;
                                        return (
                                          <label key={i} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-200/50 transition-colors">
                                            <div
                                              onClick={() => setFillData(prev => ({
                                                ...prev,
                                                items: { ...prev.items, [item.id.toString()]: opt }
                                              }))}
                                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${isSelected
                                                ? 'bg-blue-500 shadow-md'
                                                : 'bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff]'
                                                }`}
                                            >
                                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className={`font-medium ${isSelected ? 'text-gray-800' : 'text-gray-600'}`}>{opt}</span>
                                          </label>
                                        )
                                      })}
                                    </div>
                                  )}

                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Footer with Progress and Actions */}
                  <div className="p-6 bg-[#e0e5ec] border-t border-gray-200/50">
                    <div className="flex items-center justify-between gap-4">
                      {/* Progress Indicator */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#d1d5db" strokeWidth="3" />
                            <motion.circle
                              cx="18" cy="18" r="15"
                              fill="none"
                              stroke={showPreExamModal ? "#3b82f6" : "#a855f7"}
                              strokeWidth="3"
                              strokeLinecap="round"
                              initial={{ strokeDasharray: "0 100" }}
                              animate={{
                                strokeDasharray: `${(selectedTemplateItems.filter(item => {
                                  const val = fillData.items[item.id.toString()];
                                  const type = item.question_type || 'checkbox';
                                  if (type === 'checkbox') return val === true;
                                  return val === 'Yes' || val === 'No' || (Array.isArray(val) ? val.length > 0 : !!val);
                                }).length / Math.max(selectedTemplateItems.length, 1)) * 94.2} 100`
                              }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-700">
                              {Math.round((selectedTemplateItems.filter(item => {
                                const val = fillData.items[item.id.toString()];
                                const type = item.question_type || 'checkbox';
                                if (type === 'checkbox') return val === true;
                                return val === 'Yes' || val === 'No' || (Array.isArray(val) ? val.length > 0 : !!val);
                              }).length / Math.max(selectedTemplateItems.length, 1)) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-700 font-bold">
                            {selectedTemplateItems.filter(item => {
                              const val = fillData.items[item.id.toString()];
                              const type = item.question_type || 'checkbox';
                              if (type === 'checkbox') return val === true;
                              return val === 'Yes' || val === 'No' || (Array.isArray(val) ? val.length > 0 : !!val);
                            }).length} / {selectedTemplateItems.length}
                          </p>
                          <p className="text-gray-500 text-sm">Tasks completed</p>
                        </div>
                      </div>

                      {/* Action Buttons - Neumorphic */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setShowPreExamModal(false); setShowPostExamModal(false); }}
                          className="px-6 py-3 rounded-xl font-semibold text-gray-600 bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitChecklist(fillData, selectedTemplate)}
                          disabled={selectedTemplateItems.length === 0}
                          className={`px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${showPreExamModal
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                            }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Submit Checklist
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          }
        </AnimatePresence>

        {/* Custom Checklist Selector */}
        <CustomChecklistSelector
          isOpen={showCustomSelector}
          onClose={() => setShowCustomSelector(false)
          }
          customTemplates={customTemplates || []}
          onSelectTemplate={handleSelectCustomTemplate}
        />

        {/* Custom Checklist Fill Modal - Enhanced Neumorphic Design */}
        <AnimatePresence>
          {showCustomFillModal && selectedCustomTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-purple-900/60 via-fuchsia-900/40 to-pink-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#e0e5ec] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-[20px_20px_60px_#bec3c9,-20px_-20px_60px_#ffffff]"
              >
                {/* Header with Gradient Accent */}
                <div className="p-6 relative overflow-hidden bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{selectedCustomTemplate.title || selectedCustomTemplate.name}</h2>
                        <p className="text-white/80 text-sm font-medium">Custom Checklist Protocol</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setShowCustomFillModal(false); setSelectedCustomTemplate(null); }}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content Area with Neumorphic Styling */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)] bg-[#e0e5ec]">
                  {/* Date Input - Neumorphic */}
                  <div className="mb-8">
                    <label className="block text-gray-700 font-semibold mb-3 uppercase text-sm tracking-wider">Exam Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={fillData.exam_date}
                        onChange={(e) => setFillData(prev => ({ ...prev, exam_date: e.target.value }))}
                        className="w-full px-5 py-4 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 font-medium shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] focus:shadow-[inset_8px_8px_16px_#bec3c9,inset_-8px_-8px_16px_#ffffff] transition-all"
                      />
                      <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Checklist Items - Neumorphic Cards with Various Input Types */}
                  <div className="space-y-4">
                    {selectedTemplateItems.length === 0 ? (
                      <div className="text-center py-12 px-6 rounded-2xl bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff]">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No checklist items found</p>
                        <p className="text-gray-400 text-sm mt-1">Please create items in the checklist template first</p>
                      </div>
                    ) : (
                      selectedTemplateItems.map((item, index) => {
                        const itemValue = fillData.items[item.id.toString()];
                        const qType = item.type || item.question_type || 'checkbox';
                        const isCompleted = qType === 'checkbox'
                          ? itemValue === true
                          : (qType === 'yes_no'
                            ? (itemValue === 'Yes' || itemValue === 'No')
                            : (Array.isArray(itemValue) ? itemValue.length > 0 : !!itemValue));

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-5 rounded-2xl transition-all duration-300 ${isCompleted
                              ? 'bg-gradient-to-r from-purple-50 to-fuchsia-50 shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] border-2 border-purple-300'
                              : 'bg-[#e0e5ec] shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] border-2 border-transparent'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <h4 className={`font-bold text-lg ${isCompleted ? 'text-purple-700' : 'text-gray-800'}`}>
                                {index + 1}. {item.title}
                              </h4>
                              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide flex-shrink-0 ${item.priority === 'high'
                                ? 'bg-red-100 text-red-600 shadow-sm'
                                : item.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-600 shadow-sm'
                                  : 'bg-blue-100 text-blue-600 shadow-sm'
                                }`}>
                                {item.priority}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-gray-500 text-sm leading-relaxed mb-4">{item.description}</p>
                            )}

                            {/* Render input based on question type - Neumorphic Style */}
                            {qType === 'checkbox' && (
                              <div
                                className={`p-4 rounded-xl cursor-pointer transition-all ${itemValue === true
                                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 shadow-[inset_3px_3px_6px_#bec3c9,inset_-3px_-3px_6px_#ffffff]'
                                  : 'bg-[#e0e5ec] shadow-[3px_3px_6px_#bec3c9,-3px_-3px_6px_#ffffff] hover:shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff]'
                                  }`}
                                onClick={() => setFillData(prev => ({
                                  ...prev,
                                  items: { ...prev.items, [item.id.toString()]: !itemValue }
                                }))}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${itemValue === true
                                    ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                                    : 'bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff]'
                                    }`}>
                                    {itemValue === true && <CheckCircle2 className="w-4 h-4 text-white" />}
                                  </div>
                                  <span className={`font-medium ${itemValue === true ? 'text-green-700' : 'text-gray-600'}`}>
                                    Mark as completed
                                  </span>
                                </div>
                              </div>
                            )}

                            {qType === 'text' && (
                              <input
                                type="text"
                                value={itemValue || ''}
                                onChange={(e) => setFillData(prev => ({
                                  ...prev,
                                  items: { ...prev.items, [item.id.toString()]: e.target.value }
                                }))}
                                placeholder="Enter your answer..."
                                className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all placeholder-gray-400"
                              />
                            )}

                            {qType === 'number' && (
                              <input
                                type="number"
                                value={itemValue || ''}
                                onChange={(e) => setFillData(prev => ({
                                  ...prev,
                                  items: { ...prev.items, [item.id.toString()]: e.target.value }
                                }))}
                                placeholder="Enter a number..."
                                className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all placeholder-gray-400"
                              />
                            )}

                            {qType === 'dropdown' && item.dropdown_options && (
                              <select
                                value={itemValue || ''}
                                onChange={(e) => setFillData(prev => ({
                                  ...prev,
                                  items: { ...prev.items, [item.id.toString()]: e.target.value }
                                }))}
                                className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all cursor-pointer"
                              >
                                <option value="">Select an option...</option>
                                {item.dropdown_options.map((option, idx) => (
                                  <option key={idx} value={option}>{option}</option>
                                ))}
                              </select>
                            )}

                            {qType === 'date' && (
                              <input
                                type="date"
                                value={itemValue || ''}
                                onChange={(e) => setFillData(prev => ({
                                  ...prev,
                                  items: { ...prev.items, [item.id.toString()]: e.target.value }
                                }))}
                                className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all"
                              />
                            )}

                            {qType === 'time' && (
                              <input
                                type="time"
                                value={itemValue || ''}
                                onChange={(e) => setFillData(prev => ({
                                  ...prev,
                                  items: { ...prev.items, [item.id.toString()]: e.target.value }
                                }))}
                                className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all"
                              />
                            )}

                            {qType === 'textarea' && (
                              <textarea
                                value={itemValue || ''}
                                onChange={(e) => setFillData(prev => ({
                                  ...prev,
                                  items: { ...prev.items, [item.id.toString()]: e.target.value }
                                }))}
                                placeholder="Enter your answer..."
                                rows={4}
                                className="w-full px-4 py-3 bg-[#e0e5ec] rounded-xl outline-none text-gray-700 shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff] transition-all resize-none placeholder-gray-400"
                              />
                            )}

                            {qType === 'radio' && item.dropdown_options && (
                              <div className="space-y-2">
                                {item.dropdown_options.map((option, idx) => {
                                  const isChecked = itemValue === option;
                                  return (
                                    <div
                                      key={idx}
                                      className={`p-3 rounded-xl cursor-pointer transition-all ${isChecked
                                        ? 'bg-gradient-to-r from-purple-100 to-fuchsia-100 shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff]'
                                        : 'bg-[#e0e5ec] shadow-[2px_2px_4px_#bec3c9,-2px_-2px_4px_#ffffff] hover:shadow-[3px_3px_6px_#bec3c9,-3px_-3px_6px_#ffffff]'
                                        }`}
                                      onClick={() => {
                                        setFillData(prev => ({
                                          ...prev,
                                          items: { ...prev.items, [item.id.toString()]: option }
                                        }));
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isChecked
                                          ? 'bg-gradient-to-br from-purple-400 to-fuchsia-500'
                                          : 'bg-[#e0e5ec] shadow-[inset_1px_1px_2px_#bec3c9,inset_-1px_-1px_2px_#ffffff]'
                                          }`}>
                                          {isChecked && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                        <span className={isChecked ? 'text-purple-700 font-medium' : 'text-gray-600'}>{option}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {qType === 'yes_no' && (
                              <div className="flex gap-4">
                                {['Yes', 'No'].map((option) => {
                                  const isChecked = itemValue === option;
                                  return (
                                    <div
                                      key={option}
                                      className={`flex-1 p-3 rounded-xl cursor-pointer transition-all text-center font-bold ${isChecked
                                        ? (option === 'Yes'
                                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff]'
                                          : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff]')
                                        : 'bg-[#e0e5ec] text-gray-600 shadow-[2px_2px_4px_#bec3c9,-2px_-2px_4px_#ffffff] hover:shadow-[3px_3px_6px_#bec3c9,-3px_-3px_6px_#ffffff]'
                                        }`}
                                      onClick={() => {
                                        setFillData(prev => ({
                                          ...prev,
                                          items: { ...prev.items, [item.id.toString()]: option }
                                        }));
                                      }}
                                    >
                                      {option}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer with Progress and Actions */}
                <div className="p-6 bg-[#e0e5ec] border-t border-gray-200/50">
                  <div className="flex items-center justify-between gap-4">
                    {/* Progress Indicator */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#d1d5db" strokeWidth="3" />
                          <motion.circle
                            cx="18" cy="18" r="15"
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: "0 100" }}
                            animate={{
                              strokeDasharray: `${(selectedTemplateItems.filter(item => {
                                const val = fillData.items[item.id.toString()];
                                const type = item.question_type || 'checkbox';
                                if (type === 'checkbox') return val === true;
                                return val === 'Yes' || val === 'No' || (Array.isArray(val) ? val.length > 0 : !!val);
                              }).length / Math.max(selectedTemplateItems.length, 1)) * 94.2} 100`
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-700">
                            {Math.round((selectedTemplateItems.filter(item => {
                              const val = fillData.items[item.id.toString()];
                              const type = item.question_type || 'checkbox';
                              if (type === 'checkbox') return val === true;
                              return val === 'Yes' || val === 'No' || (Array.isArray(val) ? val.length > 0 : !!val);
                            }).length / Math.max(selectedTemplateItems.length, 1)) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-700 font-bold">
                          {selectedTemplateItems.filter(item => {
                            const val = fillData.items[item.id.toString()];
                            const type = item.question_type || 'checkbox';
                            if (type === 'checkbox') return val === true;
                            return val === 'Yes' || val === 'No' || (Array.isArray(val) ? val.length > 0 : !!val);
                          }).length} / {selectedTemplateItems.length}
                        </p>
                        <p className="text-gray-500 text-sm">Tasks completed</p>
                      </div>
                    </div>

                    {/* Action Buttons - Neumorphic */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowPreExamModal(false);
                          setShowPostExamModal(false);
                          setShowCustomFillModal(false);
                          setSelectedCustomTemplate(null);
                        }}
                        className="px-6 py-3 rounded-xl font-semibold text-gray-600 bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => selectedTemplate && submitChecklist(fillData, selectedTemplate)}
                        disabled={selectedTemplateItems.length === 0}
                        className="px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Submit Checklist
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Checklist Modal */}
        <AnimatePresence>
          {showCustomChecklistModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-yellow-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-black">Create Custom Checklist</h2>
                        <p className="text-black/70 text-sm">Design your own checklist template</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCustomChecklistModal(false)}
                      className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-black" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Name *</label>
                        <input
                          type="text"
                          value={customChecklistData.name}
                          onChange={(e) => setCustomChecklistData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          placeholder="e.g., Weekend Checklist"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <input
                          type="text"
                          value={customChecklistData.description}
                          onChange={(e) => setCustomChecklistData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          placeholder="Brief description of this checklist"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                      <button
                        onClick={addCustomQuestion}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Question
                      </button>
                    </div>

                    <div className="space-y-4">
                      {customChecklistData.questions.map((question, index) => (
                        <div key={question.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                            <button
                              onClick={() => deleteCustomQuestion(question.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                              <input
                                type="text"
                                value={question.title}
                                onChange={(e) => updateCustomQuestion(question.id, { title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Enter question text"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={question.description}
                                onChange={(e) => updateCustomQuestion(question.id, { description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                                rows={2}
                                placeholder="Additional details..."
                              />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                  value={question.priority}
                                  onChange={(e) => updateCustomQuestion(question.id, { priority: e.target.value as any })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Response Type</label>
                                <select
                                  value={question.question_type}
                                  onChange={(e) => updateCustomQuestion(question.id, { question_type: e.target.value as any })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                                >
                                  <option value="checkbox">Checkbox</option>
                                  <option value="text">Text Input</option>
                                  <option value="number">Number</option>
                                  <option value="dropdown">Dropdown</option>
                                  <option value="radio">Radio Options</option>
                                  <option value="textarea">Text Area</option>
                                  <option value="date">Date</option>
                                  <option value="time">Time</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Est. Time (min)</label>
                                <input
                                  type="number"
                                  value={question.estimated_time_minutes}
                                  onChange={(e) => updateCustomQuestion(question.id, { estimated_time_minutes: parseInt(e.target.value) || 5 })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                                  min="1"
                                />
                              </div>
                            </div>

                            {/* Options for Dropdown/Radio */}
                            {(question.question_type === 'dropdown' || question.question_type === 'radio') && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Options (Comma separated)</label>
                                <input
                                  type="text"
                                  placeholder="Option 1, Option 2, Option 3"
                                  value={question.dropdown_options?.join(', ') || ''}
                                  onChange={(e) => updateCustomQuestion(question.id, { dropdown_options: e.target.value.split(',').map(s => s.trim()) })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                                />
                              </div>
                            )}

                          </div>
                        </div>
                      ))}

                      {customChecklistData.questions.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No questions added yet. Click "Add Question" to start building your checklist.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={() => setShowCustomChecklistModal(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createCustomChecklist(customChecklistData)}
                    className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Create Checklist
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div >

      <style>{`
        /* Progress Circle Animations */
        @keyframes circle-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .progress-circle {
          animation: circle-pulse 3s ease-in-out infinite;
        }

        /* Roster Card Hover Effects */
        .roster-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .roster-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.1);
        }

        /* Hero Checklist Button Styles */
        .checklist-hero-btn {
          position: relative;
          overflow: hidden;
        }

        .checklist-hero-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .checklist-hero-btn:hover::before {
          left: 100%;
        }

        /* Shimmer effect for loading state */
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .shimmer-loading {
          animation: shimmer 2s infinite;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
          background-size: 1000px 100%;
        }
      `}</style>
    </>
  )
}
