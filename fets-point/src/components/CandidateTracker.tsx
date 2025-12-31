import { useState } from 'react'
import { Users, Plus, Search, Filter, Eye, Edit, UserCheck, UserX, Clock, Phone, Mail, X, Calendar, Upload, Trash2, MoreVertical, MapPin, Database } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useBranchFilter } from '../hooks/useBranchFilter'
import { useCandidates, useCreateCandidate, useUpdateCandidateStatus, useClients } from '../hooks/useQueries'
import { useIsMobile } from '../hooks/use-mobile'
import { toast } from 'react-hot-toast'

interface Candidate {
  id: string
  fullName: string
  address: string
  phone?: string
  examDate?: Date
  examName?: string
  status: 'registered' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled'
  confirmationNumber: string
  checkInTime?: Date
  notes?: string
  createdAt: Date
  clientName?: string
  branchLocation?: string
}

interface ModernStatsCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  status?: 'positive' | 'warning' | 'neutral' | 'primary'
  onClick?: () => void
  clickable?: boolean
}

interface EditCandidateData {
  fullName: string
  address: string
  phone: string
  examDate: string
  examName: string
  notes: string
  clientName: string
  status: Candidate['status']
  confirmationNumber: string
}

function ModernStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  status = 'primary',
  onClick,
  clickable = false
}: ModernStatsCardProps) {
  const statusClass = {
    positive: 'status-positive',
    warning: 'status-warning',
    neutral: 'status-neutral',
    primary: 'status-warning' // Default to primary gradient
  }[status]

  return (
    <div
      className={`stats-card ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="stats-card-title">{title}</div>
      <div className="stats-card-number">{value}</div>
      <div className="stats-card-subtitle">{subtitle}</div>
      <div className={`stats-icon ${statusClass}`}>
        <Icon />
      </div>
    </div>
  )
}

export function CandidateTracker() {
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  const { applyFilter, isGlobalView } = useBranchFilter()
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [showNewCandidateModal, setShowNewCandidateModal] = useState(false)
  const [showEditCandidateModal, setShowEditCandidateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterClient, setFilterClient] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'export'>('grid')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadResults, setUploadResults] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] })
  const { data: clients } = useClients()
  const [newCandidate, setNewCandidate] = useState({
    fullName: '',
    address: '',
    phone: '',
    examDate: new Date().toISOString().slice(0, 10),
    examName: '',
    notes: '',
    clientName: '',
    confirmationNumber: ''
  })
  const [editCandidate, setEditCandidate] = useState<EditCandidateData>({
    fullName: '',
    address: '',
    phone: '',
    examDate: '',
    examName: '',
    notes: '',
    clientName: '',
    status: 'registered',
    confirmationNumber: ''
  })

  // React Query hooks - add branch filter
  const filters = {
    date: filterDate || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    branch_location: !isGlobalView ? activeBranch : undefined
  }
  const { data: candidatesData, isLoading: loading, refetch } = useCandidates(filters)
  const createCandidateMutation = useCreateCandidate()
  const updateStatusMutation = useUpdateCandidateStatus()

  // Transform the data for component use
  const deriveClientFromExamName = (name?: string): string => {
    const n = (name || '').toUpperCase()
    if (n.includes('CMA US')) return 'PROMETRIC'
    if (n.includes('GRE') || n.includes('TOEFL')) return 'ETS'
    if (n.includes('VUE') || n.includes('PEARSON')) return 'PEARSON VUE'
    return 'PEARSON VUE'
  }

  const CLIENT_STYLE: Record<string, { border: string; tint: string; text: string }> = {
    'PROMETRIC': { border: '#FF3B30', tint: '#FEF2F2', text: '#7F1D1D' },
    'ETS': { border: '#FF9500', tint: '#FFF7ED', text: '#7C2D12' },
    'PEARSON VUE': { border: '#007AFF', tint: '#EFF6FF', text: '#1E3A8A' },
    'PSI': { border: '#AF52DE', tint: '#F5F3FF', text: '#5B21B6' },
    'OTHERS': { border: '#9CA3AF', tint: '#F3F4F6', text: '#374151' }
  }
  const getClientStyle = (client: string) => CLIENT_STYLE[client] || CLIENT_STYLE['OTHERS']

  const candidates: Candidate[] = candidatesData?.map(candidate => ({
    id: candidate.id,
    fullName: candidate.full_name,
    address: candidate.address,
    phone: candidate.phone,
    examDate: candidate.exam_date ? new Date(candidate.exam_date) : undefined,
    examName: candidate.exam_name || 'Exam Session',
    status: candidate.status as Candidate['status'],
    confirmationNumber: candidate.confirmation_number || generateConfirmationNumber(),
    checkInTime: candidate.check_in_time ? new Date(candidate.check_in_time) : undefined,
    notes: candidate.notes,
    createdAt: new Date(candidate.created_at),
    clientName: candidate.client_name || deriveClientFromExamName(candidate.exam_name),
    branchLocation: candidate.branch_location
  })) || []
  const generateConfirmationNumber = () => {
    const prefix = 'EXAM'
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}-${timestamp}-${random}`
  }

  const handleCreateCandidate = async () => {
    const candidateData: any = {
      full_name: newCandidate.fullName,
      address: newCandidate.address || null,
      phone: newCandidate.phone || null,
      exam_date: newCandidate.examDate ? new Date(newCandidate.examDate).toISOString() : null,
      exam_name: newCandidate.examName || null,
      status: 'registered',
      confirmation_number: generateConfirmationNumber(),
      notes: newCandidate.notes || null,
      user_id: user?.id,
      client_name: newCandidate.clientName || null
    }

    // Add branch location if not in global view
    if (!isGlobalView) {
      candidateData.branch_location = activeBranch
    }

    createCandidateMutation.mutate(candidateData, {
      onSuccess: () => {
        setNewCandidate({ fullName: '', address: '', phone: '', examDate: new Date().toISOString().slice(0, 10), examName: '', notes: '', clientName: '', confirmationNumber: '' })
        setShowNewCandidateModal(false)
      }
    })
  }

  const handleEditCandidate = async () => {
    if (!selectedCandidate) return

    try {
      console.log('Updating candidate...')
      const { error } = await supabase
        .from('candidates')
        .update({
          full_name: editCandidate.fullName,
          address: editCandidate.address,
          phone: editCandidate.phone || null,
          exam_date: editCandidate.examDate ? new Date(editCandidate.examDate).toISOString() : null,
          exam_name: editCandidate.examName || null,
          notes: editCandidate.notes || null,
          client_name: editCandidate.clientName || null
        })
        .eq('id', selectedCandidate.id)

      if (error) {
        console.error('Error updating candidate:', error)
        toast.error('Failed to update candidate: ' + error.message)
        return
      }

      console.log('Candidate updated successfully!')
      refetch()
      setShowEditCandidateModal(false)
      setSelectedCandidate(null)
      toast.success('Candidate updated successfully!')
    } catch (error) {
      console.error('Error updating candidate:', error)
      alert('Failed to update candidate. Please try again.')
    }
  }

  const handleDeleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!window.confirm(`Are you sure you want to delete candidate "${candidateName}"? This action cannot be undone.`)) {
      return
    }

    try {
      console.log('Deleting candidate...')
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId)

      if (error) {
        console.error('Error deleting candidate:', error)
        toast.error('Failed to delete candidate: ' + error.message)
        return
      }

      console.log('Candidate deleted successfully!')
      refetch()
      toast.success('Candidate deleted successfully!')
    } catch (error) {
      console.error('Error deleting candidate:', error)
      alert('Failed to delete candidate. Please try again.')
    }
  }

  const openEditModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setEditCandidate({
      fullName: candidate.fullName,
      address: candidate.address,
      phone: candidate.phone || '',
      examDate: candidate.examDate ? candidate.examDate.toISOString().slice(0, 16) : '',
      examName: candidate.examName || '',
      notes: candidate.notes || '',
      clientName: candidate.clientName || '',
      status: candidate.status,
      confirmationNumber: candidate.confirmationNumber
    })
    setShowEditCandidateModal(true)
  }

  const handleUpdateStatus = async (candidateId: string, newStatus: Candidate['status']) => {
    const updates: any = { status: newStatus }
    if (newStatus === 'checked_in') {
      updates.check_in_time = new Date().toISOString()
    }

    updateStatusMutation.mutate({ id: candidateId, status: newStatus })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      if (validTypes.includes(file.type) || file.name.endsWith('.csv')) {
        setUploadFile(file)
        setUploadStatus('idle')
        setUploadResults({ success: 0, errors: [] })
      } else {
        alert('Please select a valid CSV or Excel file')
      }
    }
  }

  const processBulkUpload = async () => {
    if (!uploadFile || !user) return

    setUploadStatus('uploading')
    setUploadProgress(0)
    const errors: string[] = []
    let successCount = 0

    try {
      // Record the upload attempt
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('candidate_roster_uploads')
        .insert({
          filename: uploadFile.name,
          total_candidates: 0, // Will update this after processing
          uploaded_by_user_id: user.id,
          status: 'processing',
          exam_provider: 'Bulk Upload', // Default value
          file_type: uploadFile.type || 'text/csv'
        })
        .select()
        .single()

      if (uploadError) {
        console.error('Error creating upload record:', uploadError)
      }

      const text = await uploadFile.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        throw new Error('File must contain at least a header row and one data row')
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const dataLines = lines.slice(1)

      // Validate required headers
      const requiredHeaders = ['full_name']
      const missingHeaders = requiredHeaders.filter(h => !headers.some(header => header.includes(h.replace('_', ''))))
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
      }

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.trim())
          const candidateData: any = {}

          headers.forEach((header, index) => {
            const value = values[index] || ''
            if (header.includes('name') || header.includes('full')) candidateData.full_name = value
            if (header.includes('address')) candidateData.address = value
            if (header.includes('phone')) candidateData.phone = value || null
            if (header.includes('exam') && header.includes('name')) candidateData.exam_name = value || null
            if (header.includes('exam') && header.includes('date')) {
              candidateData.exam_date = value ? new Date(value).toISOString() : null
            }
            if (header.includes('note')) candidateData.notes = value || null
          })

          // Validate required fields
          if (!candidateData.full_name) {
            errors.push(`Row ${i + 2}: Missing name`)
            continue
          }

          candidateData.status = 'registered'
          candidateData.confirmation_number = generateConfirmationNumber()
          candidateData.user_id = user.id

          const { error } = await supabase
            .from('candidates')
            .insert(candidateData)

          if (error) {
            errors.push(`Row ${i + 2}: Database error - ${error.message}`)
          } else {
            successCount++
          }
        } catch (rowError: any) {
          errors.push(`Row ${i + 2}: ${rowError.message}`)
        }

        setUploadProgress(Math.round(((i + 1) / dataLines.length) * 100))
      }

      // Update upload record
      if (uploadRecord) {
        await supabase
          .from('candidate_roster_uploads')
          .update({
            total_candidates: dataLines.length,
            processed_candidates: successCount,
            failed_candidates: errors.length,
            status: errors.length === dataLines.length ? 'failed' : 'completed',
            error_log: errors.length > 0 ? errors.join('\n') : null,
            processed_date: new Date().toISOString()
          })
          .eq('id', uploadRecord.id)
      }

      setUploadResults({ success: successCount, errors })
      setUploadStatus(errors.length === dataLines.length ? 'error' : 'success')

      if (successCount > 0) {
        refetch()
      }
    } catch (error: any) {
      setUploadStatus('error')
      setUploadResults({ success: 0, errors: [error.message] })
    }
  }

  const exportToCsv = () => {
    const headers = ['#', 'Name', 'Phone', 'Client', 'Exam', 'Date'];
    const rows = filteredCandidates.map((candidate, index) => {
      const client = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase();
      return [
        index + 1,
        candidate.fullName,
        candidate.phone || '-',
        client,
        candidate.examName || '-',
        candidate.examDate ? new Date(candidate.examDate).toLocaleDateString() : '-'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = 'candidates.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const resetBulkUpload = () => {
    setUploadFile(null)
    setUploadStatus('idle')
    setUploadProgress(0)
    setUploadResults({ success: 0, errors: [] })
    setShowBulkUploadModal(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'text-blue-600 bg-blue-50 border border-blue-200'
      case 'checked_in': return 'text-yellow-600 bg-yellow-50 border border-yellow-200'
      case 'in_progress': return 'text-orange-600 bg-orange-50 border border-orange-200'
      case 'completed': return 'text-green-600 bg-green-50 border border-green-200'
      case 'no_show': return 'text-red-600 bg-red-50 border border-red-200'
      case 'cancelled': return 'text-gray-600 bg-gray-50 border border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checked_in': return <UserCheck className="h-4 w-4" />
      case 'completed': return <UserCheck className="h-4 w-4" />
      case 'no_show': return <UserX className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getTodaysCandidates = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return candidates.filter(candidate => {
      const createdDate = new Date(candidate.createdAt)
      createdDate.setHours(0, 0, 0, 0)
      return createdDate.getTime() === today.getTime()
    })
  }

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch =
      candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.confirmationNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const clientComputed = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase()
    const matchesClient = filterClient === 'all' || clientComputed === filterClient.toUpperCase()

    return matchesSearch && matchesClient
  })

  const todaysCandidates = getTodaysCandidates()



  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accessing candidate grid...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen -mt-32 pt-48 bg-[#e0e5ec] pb-20 md:pb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>

        <div className="max-w-[1800px] mx-auto px-4 md:px-6">
          {/* Executive Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 uppercase bg-gradient-to-r from-amber-600 to-amber-900 bg-clip-text text-transparent">
                Fets Register
              </h1>
              <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                <MapPin size={10} className="text-amber-600" />
                <span>{activeBranch || 'Global'} Operations Grid</span>
              </div>
            </div>

            <div className="w-full md:w-auto grid grid-cols-2 md:flex md:gap-10 p-5 bg-[#e0e5ec] shadow-[inset_6px_6px_10px_#bec3c9,inset_-6px_-6px_10px_#ffffff] rounded-3xl">
              <div className="text-center md:text-right border-r border-gray-300 md:pr-10">
                <p className="text-2xl md:text-3xl font-black text-gray-800 leading-none">{candidates.length}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Assets</p>
              </div>
              <div className="text-center md:text-right md:pl-0 pl-10">
                <p className="text-2xl md:text-3xl font-black text-amber-600 leading-none">{todaysCandidates.length}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Daily Flow</p>
              </div>
            </div>
          </motion.div>

          {/* Controls Bar */}
          <div className="neomorphic-card p-4 md:p-6 mb-10 flex flex-col gap-6 sticky top-24 z-30">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Query Candidate Name / ID..."
                  className="w-full pl-14 pr-6 py-4 border-none rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 placeholder-gray-400 font-bold uppercase tracking-wider text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowNewCandidateModal(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-900/20 font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">New Register</span>
                  <span className="sm:hidden">Add</span>
                </button>
                <button
                  onClick={() => setShowBulkUploadModal(true)}
                  className="p-4 bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] rounded-2xl text-gray-600 active:shadow-inner"
                >
                  <Upload size={18} />
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'export' ? 'grid' : 'export')}
                  className={`p-4 rounded-2xl transition-all ${viewMode === 'export' ? 'bg-amber-100 text-amber-600 shadow-inner' : 'bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-gray-600'}`}
                >
                  <Database size={18} />
                </button>
              </div>
            </div>

            {/* Client Filter Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 shrink-0">Filter:</span>
              {['all', 'PROMETRIC', 'ETS', 'PEARSON VUE', 'PSI', 'OTHERS'].map(c => {
                const label = c.toUpperCase()
                const active = filterClient.toUpperCase() === label
                return (
                  <button
                    key={c}
                    onClick={() => setFilterClient(c)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all uppercase tracking-widest ${active
                      ? 'bg-amber-100 text-amber-700 shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff]'
                      : 'bg-[#e0e5ec] text-gray-500 hover:text-amber-600'
                      }`}
                  >
                    {label === 'ALL' ? 'GLOBAL' : label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dynamic Component Content */}
          <AnimatePresence mode="wait">
            {viewMode === 'export' ? (
              <motion.div
                key="export"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="animate-in fade-in duration-500"
              >
                <div className="flex justify-end mb-6">
                  <button onClick={exportToCsv} className="px-8 py-3 bg-green-600 text-white rounded-xl shadow-lg font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                    Extract CSV Payload
                  </button>
                </div>
                <div className="neomorphic-card p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Serial</th>
                          <th className="px-6 py-4">Identity</th>
                          <th className="px-6 py-4">Channel</th>
                          <th className="px-6 py-4">Protocol</th>
                          <th className="px-6 py-4">Mission</th>
                          <th className="px-6 py-4">Window</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredCandidates.map((candidate, index) => {
                          const client = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase()
                          return (
                            <tr key={candidate.id} className="hover:bg-white/30 transition-colors">
                              <td className="px-6 py-4 text-xs font-bold text-gray-400">{index + 1}</td>
                              <td className="px-6 py-4 text-xs font-black text-gray-800">{candidate.fullName}</td>
                              <td className="px-6 py-4 text-xs font-bold text-gray-600">{candidate.phone || 'NO CHANNEL'}</td>
                              <td className="px-6 py-4 text-xs font-black text-amber-600">{client}</td>
                              <td className="px-6 py-4 text-xs font-bold text-gray-600">{candidate.examName || '-'}</td>
                              <td className="px-6 py-4 text-xs font-bold text-gray-600">
                                {candidate.examDate ? new Date(candidate.examDate).toLocaleDateString() : 'NOT SET'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                  {filteredCandidates.map((candidate, idx) => {
                    const client = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase()
                    const style = CLIENT_STYLE[client] || CLIENT_STYLE['OTHERS']

                    return (
                      <motion.div
                        key={candidate.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="neomorphic-card p-6 flex flex-col group relative overflow-hidden active:scale-[0.98] transition-all"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: style.border }}></div>

                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <h3 className="text-lg font-black text-gray-800 leading-tight uppercase tracking-tight group-hover:text-amber-600 transition-colors line-clamp-2">
                              {candidate.fullName}
                            </h3>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">
                              {candidate.confirmationNumber}
                            </p>
                          </div>
                          <button
                            onClick={() => setOpenMenu(openMenu === candidate.id ? null : candidate.id)}
                            className="p-2 bg-[#e0e5ec] shadow-[2px_2px_4px_#bec3c9,-2px_-2px_4px_#ffffff] rounded-lg text-gray-400 active:shadow-inner"
                          >
                            <MoreVertical size={16} />
                          </button>

                          <AnimatePresence>
                            {openMenu === candidate.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-6 top-16 w-40 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 z-20 p-2 overflow-hidden"
                              >
                                <button onClick={() => { openEditModal(candidate); setOpenMenu(null); }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-amber-50 rounded-xl text-xs font-bold text-gray-700 transition-all">
                                  <Edit size={14} className="text-amber-500" /> Modify
                                </button>
                                <button onClick={() => { handleDeleteCandidate(candidate.id, candidate.fullName); setOpenMenu(null); }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-red-100/50 rounded-xl text-xs font-bold text-red-600 transition-all">
                                  <Trash2 size={14} /> Remove
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-4 p-3 bg-white/30 rounded-2xl shadow-sm border border-white/40">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                              <Calendar size={14} className="text-blue-500" />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Schedule</p>
                              <p className="text-xs font-black text-gray-700 tracking-tight">
                                {candidate.examDate ? new Date(candidate.examDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 p-3 bg-white/30 rounded-2xl shadow-sm border border-white/40">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                              <Phone size={14} className="text-green-500" />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Contact</p>
                              <p className="text-xs font-black text-gray-700 tracking-tight">{candidate.phone || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Operational Context</p>
                            <p className="text-xs font-bold text-blue-900 truncate">{candidate.examName || 'Standard Session'}</p>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200/50 flex items-center justify-between">
                          <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${getStatusColor(candidate.status)}`}>
                            {candidate.status?.replace('_', ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center p-1.5 grayscale opacity-50">
                              <img src={style.border.includes('#007AFF') ? '/client-logos/pearson.png' : style.border.includes('#FF3B30') ? '/client-logos/prometric.png' : '/client-logos/ets.png'} alt="Client" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {filteredCandidates.length === 0 && (
                  <div className="text-center py-20 bg-white/30 rounded-[40px] border-2 border-dashed border-gray-300">
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No Assets Found</h3>
                    <p className="text-gray-400 font-medium text-sm mt-2">Adjust your query or check filters</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      {showNewCandidateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-300">
          <div className="neomorphic-card p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Register New Asset</h2>
              <button onClick={() => setShowNewCandidateModal(false)} className="p-3 bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] rounded-xl text-gray-400 active:shadow-inner">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Full Name *</label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 font-bold"
                    placeholder="Enter full legal name"
                    value={newCandidate.fullName}
                    onChange={(e) => setNewCandidate({ ...newCandidate, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Communication Channel</label>
                  <input
                    type="tel"
                    className="w-full px-6 py-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 font-bold"
                    placeholder="+91 XXXXX XXXXX"
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Client / Vendor</label>
                <select
                  className="w-full px-6 py-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 font-bold appearance-none cursor-pointer"
                  value={newCandidate.clientName}
                  onChange={(e) => setNewCandidate({ ...newCandidate, clientName: e.target.value })}
                >
                  <option value="">Select Protocol Vendor</option>
                  {clients?.map(client => (
                    <option key={client.id} value={client.name}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deployment Date</label>
                  <input
                    type="date"
                    className="w-full px-6 py-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 font-bold"
                    value={newCandidate.examDate}
                    onChange={(e) => setNewCandidate({ ...newCandidate, examDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operational ID / Confirmation</label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 font-bold"
                    placeholder="VUE_1234567"
                    value={newCandidate.confirmationNumber}
                    onChange={(e) => setNewCandidate({ ...newCandidate, confirmationNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mission Notes</label>
                <textarea
                  className="w-full px-6 py-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 font-bold h-32 resize-none"
                  placeholder="Additional context or requirements..."
                  value={newCandidate.notes}
                  onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-6 mt-10">
              <button
                onClick={() => setShowNewCandidateModal(false)}
                className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-red-500 transition-colors"
              >
                Abort
              </button>
              <button
                onClick={handleCreateCandidate}
                disabled={!newCandidate.fullName.trim()}
                className="px-8 py-4 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-900/20 font-black uppercase tracking-widest text-xs active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                Execute Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
          <div className="neomorphic-card p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Modify Asset Data</h2>
              <button onClick={() => setShowEditCandidateModal(false)} className="p-3 bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] rounded-xl text-gray-400 active:shadow-inner">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 font-bold"
                  value={editCandidate.fullName}
                  onChange={(e) => setEditCandidate({ ...editCandidate, fullName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-6 py-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 font-bold"
                    value={editCandidate.phone}
                    onChange={(e) => setEditCandidate({ ...editCandidate, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operational Status</label>
                  <select
                    className="w-full px-6 py-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 font-bold appearance-none cursor-pointer"
                    value={editCandidate.status}
                    onChange={(e) => setEditCandidate({ ...editCandidate, status: e.target.value as any })}
                  >
                    <option value="pending">PENDING</option>
                    <option value="checked_in">CHECKED IN</option>
                    <option value="in_progress">IN PROGRESS</option>
                    <option value="completed">COMPLETED</option>
                    <option value="no_show">NO SHOW</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mission Notes</label>
                <textarea
                  className="w-full px-6 py-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] focus:outline-none text-gray-700 font-bold h-32 resize-none"
                  value={editCandidate.notes}
                  onChange={(e) => setEditCandidate({ ...editCandidate, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-6 mt-10">
              <button
                onClick={() => setShowEditCandidateModal(false)}
                className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-red-500 transition-colors"
              >
                Abort
              </button>
              <button
                onClick={handleEditCandidate}
                disabled={!editCandidate.fullName.trim()}
                className="px-8 py-4 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-900/20 font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
              >
                Sync Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[150]">
          <div className="neomorphic-card p-8 w-full max-w-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Bulk Deployment</h2>
              <button onClick={() => resetBulkUpload()} className="p-3 bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] rounded-xl text-gray-400 active:shadow-inner">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                  <Upload size={24} />
                </div>
                <div>
                  <h4 className="font-black text-blue-900 uppercase tracking-widest text-xs mb-2">Protocol Instructions</h4>
                  <p className="text-xs text-blue-600 leading-relaxed font-bold">
                    Upload a .CSV file with "full_name" as a required column. Optional fields include "phone", "exam_date", "exam_name".
                  </p>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-gray-300 rounded-[40px] cursor-pointer hover:bg-gray-50 transition-all group">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                <div className="w-20 h-20 mb-4 bg-white rounded-3xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-amber-600 group-hover:scale-110 transition-all">
                  <Upload size={32} />
                </div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-600">
                  {uploadFile ? uploadFile.name : 'Release CSV Payload'}
                </p>
              </label>

              {uploadStatus === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Processing Data...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} className="h-full bg-amber-600" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-6 mt-10">
              <button onClick={() => resetBulkUpload()} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500">Abort</button>
              {uploadFile && uploadStatus !== 'uploading' && (
                <button onClick={processBulkUpload} className="px-8 py-4 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-900/20 font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
                  Deploy Payload
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
