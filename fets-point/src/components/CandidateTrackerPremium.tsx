import { useState } from 'react'
import { Users, Plus, Search, Filter, Eye, Edit, UserCheck, UserX, Clock, Phone, Mail, X, Calendar, Upload, Trash2, MoreVertical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { useBranchFilter } from '../hooks/useBranchFilter'
import { useCandidates, useCreateCandidate, useUpdateCandidateStatus, useClients } from '../hooks/useQueries'
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
    primary: 'status-warning'
  }[status]

  return (
    <div
      className={`stat-block stat-block--candidate-tracker ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="stat-block__icon">
        <Icon size={28} />
      </div>
      <div className="stat-block__value">{value}</div>
      <div className="stat-block__label">{title}</div>
      <div className="stat-block__subtitle">{subtitle}</div>
    </div>
  )
}

export function CandidateTrackerPremium() {
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
    clientName: ''
  })
  const [editCandidate, setEditCandidate] = useState<EditCandidateData>({
    fullName: '',
    address: '',
    phone: '',
    examDate: '',
    examName: '',
    notes: '',
    clientName: ''
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

    if (!isGlobalView) {
      candidateData.branch_location = activeBranch
    }

    createCandidateMutation.mutate(candidateData, {
      onSuccess: () => {
        setNewCandidate({ fullName: '', address: '', phone: '', examDate: new Date().toISOString().slice(0, 10), examName: '', notes: '', clientName: '' })
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
      clientName: candidate.clientName || ''
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
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('candidate_roster_uploads')
        .insert({
          filename: uploadFile.name,
          total_candidates: 0,
          uploaded_by_user_id: user.id,
          status: 'processing',
          exam_provider: 'Bulk Upload',
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
    const headers = ['#', 'Name', 'Phone', 'Client', 'Exam', 'Date']
    const rows = filteredCandidates.map((candidate, index) => {
      const client = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase()
      return [
        index + 1,
        candidate.fullName,
        candidate.phone || '-',
        client,
        candidate.examName || '-',
        candidate.examDate ? new Date(candidate.examDate).toLocaleDateString() : '-'
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.href) {
      URL.revokeObjectURL(link.href)
    }
    link.href = URL.createObjectURL(blob)
    link.download = 'candidates.csv'
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetBulkUpload = () => {
    setUploadFile(null)
    setUploadStatus('idle')
    setUploadProgress(0)
    setUploadResults({ success: 0, errors: [] })
    setShowBulkUploadModal(false)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'registered': return 'status-badge--info'
      case 'checked_in': return 'status-badge--warning'
      case 'in_progress': return 'status-badge--warning'
      case 'completed': return 'status-badge--active'
      case 'no_show': return 'status-badge--alert'
      case 'cancelled': return 'status-badge--info'
      default: return 'status-badge--info'
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

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch =
      candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.confirmationNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const clientComputed = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase()
    const matchesClient = filterClient === 'all' || clientComputed === filterClient.toUpperCase()

    return matchesSearch && matchesClient
  })

  if (loading) {
    return (
      <div className="page-wrapper--candidate-tracker flex-1 p-4 sm:p-6 overflow-auto min-h-screen">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading candidates...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper--candidate-tracker flex-1 p-4 sm:p-6 overflow-auto min-h-screen">
      {/* Premium Header Section */}
      <div className="unified-card mb-8 border-l-4 border-l-cyan-500">
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h2 text-gray-900 mb-2">Candidate Tracker</h1>
              <p className="text-body text-gray-600">Track and manage candidate registrations</p>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="stat-block__value text-cyan-600">{candidates.length}</div>
                <p className="text-sm text-gray-600 mt-1">Total Candidates</p>
              </div>
              <div className="text-center">
                <div className="stat-block__value text-cyan-600">{filteredCandidates.length}</div>
                <p className="text-sm text-gray-600 mt-1">Filtered View</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="unified-card mb-8">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search candidates by name, address, or confirmation number..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                placeholder="Filter by exam date"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Clients:</span>
            {['all','PROMETRIC','ETS','PEARSON VUE','PSI','OTHERS'].map(c => {
              const label = c.toUpperCase()
              const active = filterClient.toUpperCase() === label
              return (
                <button
                  key={c}
                  onClick={() => setFilterClient(c)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all ${active ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-200 hover:border-cyan-300'}`}
                >
                  {label === 'ALL' ? 'ALL CLIENTS' : label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <ModernStatsCard
          title="Total Registered"
          value={candidates.filter(c => c.status === 'registered').length}
          subtitle="Awaiting check-in"
          icon={Users}
          status="primary"
        />
        <ModernStatsCard
          title="Checked In"
          value={candidates.filter(c => c.status === 'checked_in').length}
          subtitle="Ready to proceed"
          icon={UserCheck}
          status="positive"
        />
        <ModernStatsCard
          title="In Progress"
          value={candidates.filter(c => c.status === 'in_progress').length}
          subtitle="Currently testing"
          icon={Clock}
          status="warning"
        />
        <ModernStatsCard
          title="Completed"
          value={candidates.filter(c => c.status === 'completed').length}
          subtitle="Exams finished"
          icon={UserCheck}
          status="positive"
        />
      </div>

      {/* Content Area */}
      <div className="unified-card">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewCandidateModal(true)}
                className="unified-btn--candidate-tracker flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Candidate
              </button>
              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="unified-btn--candidate-tracker flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Bulk Add
              </button>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium transition-all ${viewMode==='grid'?'bg-cyan-100 text-cyan-700':'text-gray-600 hover:bg-gray-50'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition-all border-l border-gray-200 ${viewMode==='list'?'bg-cyan-100 text-cyan-700':'text-gray-600 hover:bg-gray-50'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('export')}
                className={`px-4 py-2 text-sm font-medium transition-all border-l border-gray-200 ${viewMode==='export'?'bg-cyan-100 text-cyan-700':'text-gray-600 hover:bg-gray-50'}`}
              >
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {viewMode === 'list' && (
            <div className="space-y-4">
              {filteredCandidates.map((candidate) => (
                <div key={candidate.id} className="unified-card p-6 border-l-4 border-l-cyan-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{candidate.fullName}</h3>
                          <span className={`status-badge ${getStatusBadgeClass(candidate.status)}`}>
                            {candidate.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{candidate.confirmationNumber}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === candidate.id ? null : candidate.id)} className="p-2 rounded-full hover:bg-gray-100">
                        <MoreVertical className="h-5 w-5 text-gray-600" />
                      </button>
                      {openMenu === candidate.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-100">
                          <div className="py-1">
                            <button onClick={() => openEditModal(candidate)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit className="h-4 w-4 inline mr-2" />
                              Edit
                            </button>
                            <button onClick={() => handleDeleteCandidate(candidate.id, candidate.fullName)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4 inline mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Address</p>
                      <p className="text-gray-900 flex items-center gap-2"><Mail className="h-4 w-4 text-cyan-500" />{candidate.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Phone</p>
                      <p className="text-gray-900 flex items-center gap-2"><Phone className="h-4 w-4 text-cyan-500" />{candidate.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-1">Exam</p>
                      <p className="text-gray-900 flex items-center gap-2"><Calendar className="h-4 w-4 text-cyan-500" />{candidate.examName || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map((candidate) => {
                const client = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase()
                const style = CLIENT_STYLE[client] || CLIENT_STYLE['OTHERS']
                return (
                  <div key={candidate.id} className="unified-card p-6 border-t-4 border-t-cyan-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{candidate.fullName}</h3>
                        <p className="text-sm text-gray-600">{candidate.confirmationNumber}</p>
                      </div>
                      <div className="relative">
                        <button onClick={() => setOpenMenu(openMenu === candidate.id ? null : candidate.id)} className="p-1 rounded-full hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                        {openMenu === candidate.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-100">
                            <div className="py-1">
                              <button onClick={() => openEditModal(candidate)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                              <button onClick={() => handleDeleteCandidate(candidate.id, candidate.fullName)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className={`status-badge ${getStatusBadgeClass(candidate.status)}`}>
                        {candidate.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold" style={{ background: style.tint, color: style.text, borderLeft: `3px solid ${style.border}` }}>
                          {client}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs uppercase font-medium mb-1">Exam</p>
                        <p className="text-gray-900 font-medium">{candidate.examName || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs uppercase font-medium mb-1">Scheduled Date</p>
                        <p className="text-gray-900 font-medium">{candidate.examDate ? new Date(candidate.examDate).toLocaleDateString() : 'Not scheduled'}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {viewMode === 'export' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={exportToCsv} className="unified-btn--candidate-tracker">Export CSV</button>
              </div>
              <div className="unified-card p-0 overflow-x-auto border-0">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700">#</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700">Phone</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700">Client</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700">Exam</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700">Date</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((candidate, index) => {
                      const client = (candidate.clientName || deriveClientFromExamName(candidate.examName)).toUpperCase()
                      return (
                        <tr key={candidate.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-3 text-gray-900">{index + 1}</td>
                          <td className="px-6 py-3 text-gray-900 font-medium">{candidate.fullName}</td>
                          <td className="px-6 py-3 text-gray-700">{candidate.phone || '-'}</td>
                          <td className="px-6 py-3 text-gray-700">{client}</td>
                          <td className="px-6 py-3 text-gray-700">{candidate.examName || '-'}</td>
                          <td className="px-6 py-3 text-gray-700">{candidate.examDate ? new Date(candidate.examDate).toLocaleDateString() : '-'}</td>
                          <td className="px-6 py-3">
                            <span className={`status-badge ${getStatusBadgeClass(candidate.status)} text-xs`}>
                              {candidate.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals - preserved from original */}
      {showNewCandidateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="unified-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-h3 text-gray-900">Register New Candidate</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Enter candidate's full name"
                    value={newCandidate.fullName}
                    onChange={(e) => setNewCandidate({ ...newCandidate, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    value={newCandidate.address}
                    onChange={(e) => setNewCandidate({ ...newCandidate, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="+1-555-0123"
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="AWS Solutions Architect, TOEFL, etc."
                    value={newCandidate.examName}
                    onChange={(e) => setNewCandidate({ ...newCandidate, examName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900"
                  value={newCandidate.clientName}
                  onChange={(e) => setNewCandidate({ ...newCandidate, clientName: e.target.value })}
                >
                  <option value="">Select a client</option>
                  {clients?.map(client => (
                    <option key={client.id} value={client.name}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date & Time</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900"
                  value={newCandidate.examDate}
                  onChange={(e) => setNewCandidate({ ...newCandidate, examDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 h-24 resize-none"
                  placeholder="Special accommodations, dietary requirements, etc."
                  value={newCandidate.notes}
                  onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowNewCandidateModal(false)}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCandidate}
                className="unified-btn--candidate-tracker"
                disabled={!newCandidate.fullName.trim()}
              >
                Register Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="unified-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-h3 text-gray-900">Edit Candidate: {selectedCandidate.fullName}</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Enter candidate's full name"
                    value={editCandidate.fullName}
                    onChange={(e) => setEditCandidate({ ...editCandidate, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    value={editCandidate.address}
                    onChange={(e) => setEditCandidate({ ...editCandidate, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="+1-555-0123"
                    value={editCandidate.phone}
                    onChange={(e) => setEditCandidate({ ...editCandidate, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="AWS Solutions Architect, TOEFL, etc."
                    value={editCandidate.examName}
                    onChange={(e) => setEditCandidate({ ...editCandidate, examName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900"
                  value={editCandidate.clientName}
                  onChange={(e) => setEditCandidate({ ...editCandidate, clientName: e.target.value })}
                >
                  <option value="">Select a client</option>
                  {clients?.map(client => (
                    <option key={client.id} value={client.name}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900"
                  value={editCandidate.examDate}
                  onChange={(e) => setEditCandidate({ ...editCandidate, examDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 h-24 resize-none"
                  placeholder="Special accommodations, dietary requirements, etc."
                  value={editCandidate.notes}
                  onChange={(e) => setEditCandidate({ ...editCandidate, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowEditCandidateModal(false)}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCandidate}
                className="unified-btn--candidate-tracker"
                disabled={!editCandidate.fullName.trim()}
              >
                Update Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="unified-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-h3 text-gray-900">Bulk Upload Candidates</h2>
              <button
                onClick={() => resetBulkUpload()}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-cyan-900 mb-2">Upload Instructions</h3>
                <ul className="text-sm text-cyan-800 space-y-1">
                  <li>• Upload a CSV file with candidate information</li>
                  <li>• Required columns: <strong>full_name</strong></li>
                  <li>• Optional columns: address, phone, exam_name, exam_date, notes</li>
                  <li>• First row should contain column headers</li>
                  <li>• Date format: YYYY-MM-DD or MM/DD/YYYY</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-cyan-400 transition-colors">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="bulk-upload-input"
                    />
                    <label
                      htmlFor="bulk-upload-input"
                      className="cursor-pointer text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                      Click to select file
                    </label>
                    <p className="text-gray-500 text-sm mt-1">CSV, XLS, or XLSX files only</p>
                  </div>

                  {uploadFile && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Selected:</strong> {uploadFile.name} ({Math.round(uploadFile.size / 1024)}KB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {uploadStatus === 'uploading' && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Processing candidates...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-cyan-500 to-cyan-600"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Upload Completed!</h3>
                  <p className="text-green-800">
                    Successfully imported {uploadResults.success} candidates.
                  </p>
                  {uploadResults.errors.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-yellow-700 font-medium">View {uploadResults.errors.length} errors</summary>
                      <ul className="mt-2 text-sm text-yellow-800 space-y-1 pl-4">
                        {uploadResults.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Upload Failed</h3>
                  <ul className="text-red-800 space-y-1">
                    {uploadResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-100">
              <button
                onClick={() => resetBulkUpload()}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                {uploadStatus === 'success' ? 'Done' : 'Cancel'}
              </button>
              {uploadFile && uploadStatus !== 'uploading' && uploadStatus !== 'success' && (
                <button
                  onClick={processBulkUpload}
                  className="unified-btn--candidate-tracker"
                  disabled={!uploadFile}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Candidates
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidateTrackerPremium
