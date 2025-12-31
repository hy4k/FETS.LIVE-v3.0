import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Server, Monitor, Cpu, Plus, X,
    Activity, Shield, AlertTriangle,
    Search, RefreshCw, MoreVertical,
    CheckCircle2, Settings, Network,
    Layers, Calendar, Building2, Terminal,
    ExternalLink, Zap, Sparkles
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

// --- Interfaces ---

interface Software {
    id?: string
    name: string
    install_date: string
    client: string
}

interface System {
    id: string
    branch_location: string
    system_type: 'admin' | 'server' | 'workstation'
    name: string
    ip_address: string
    status: 'operational' | 'maintenance' | 'fault'
    specs: {
        cpu?: string
        ram?: string
        os?: string
    }
    installed_software: Software[]
    supported_clients: string[]
    last_checked: string
}

interface SystemLog {
    id: string
    system_id: string
    log_type: string
    description: string
    user_id: string
    created_at: string
}

// --- Sub-Components ---

const NeumorphicCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-3xl border border-white/20 ${className}`}>
        {children}
    </div>
)

const NeumorphicInset = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-[#e0e5ec] shadow-[inset_6px_6px_10px_0_rgba(163,177,198,0.7),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] rounded-2xl border-none ${className}`}>
        {children}
    </div>
)

const SystemIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'server': return <Server className="text-purple-500" />
        case 'admin': return <Shield className="text-blue-500" />
        default: return <Monitor className="text-indigo-500" />
    }
}

const StatusBadge = ({ status }: { status: string }) => {
    const configs = {
        operational: { color: 'text-green-500 bg-green-50', icon: CheckCircle2 },
        maintenance: { color: 'text-amber-500 bg-amber-50', icon: Settings },
        fault: { color: 'text-red-500 bg-red-50', icon: AlertTriangle }
    }
    const config = configs[status as keyof typeof configs] || configs.operational
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${config.color} border border-white/20 shadow-sm`}>
            <config.icon size={12} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-wider">{status}</span>
        </div>
    )
}

// --- Main Page Component ---

const SystemManager = () => {
    const { profile } = useAuth()
    const { activeBranch } = useBranch()
    const [systems, setSystems] = useState<System[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showManageModal, setShowManageModal] = useState<System | null>(null)
    const [filterType, setFilterType] = useState('all')

    // System States
    const [newSystem, setNewSystem] = useState({
        name: '',
        type: 'workstation',
        ip: '',
        specs: { cpu: '', ram: '', os: 'Windows 11' },
        installed_software: [] as Software[],
        supported_clients: [] as string[]
    })

    const [softEntry, setSoftEntry] = useState<Software>({ name: '', install_date: '', client: '' })
    const [incidentDescription, setIncidentDescription] = useState('')
    const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
    const [activeManageTab, setActiveManageTab] = useState<'inventory' | 'network' | 'history'>('inventory')

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    useEffect(() => {
        fetchSystems()
        fetchClients()
    }, [activeBranch])

    useEffect(() => {
        if (showManageModal) {
            fetchSystemLogs(showManageModal.id)
            setActiveManageTab('inventory')
        }
    }, [showManageModal])

    const fetchSystems = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('systems')
            .select('*')
            .eq('branch_location', activeBranch)
            .order('name', { ascending: true })

        if (error) {
            toast.error('Failed to load infrastructure data')
        } else {
            setSystems(data || [])
        }
        setLoading(false)
    }

    const fetchSystemLogs = async (systemId: string) => {
        const { data } = await supabase
            .from('system_logs')
            .select('*')
            .eq('system_id', systemId)
            .order('created_at', { ascending: false })
        if (data) setSystemLogs(data)
    }

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('name').order('name')
        if (data) setClients(data)
    }

    const logSystemAction = async (systemId: string, type: string, description: string) => {
        await supabase.from('system_logs').insert([{
            system_id: systemId,
            log_type: type,
            description: description,
            user_id: profile?.user_id || profile?.id
        }])
    }

    const handleCreateSystem = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { data, error } = await supabase.from('systems').insert([{
            branch_location: activeBranch,
            system_type: newSystem.type,
            name: newSystem.name,
            ip_address: newSystem.ip,
            specs: newSystem.specs,
            installed_software: newSystem.installed_software,
            supported_clients: newSystem.supported_clients,
            status: 'operational'
        }]).select()

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('System Registered')
            if (data?.[0]) {
                await logSystemAction(data[0].id, 'creation', `System registered at ${activeBranch}`)
            }
            setShowAddModal(false)
            setNewSystem({
                name: '',
                type: 'workstation',
                ip: '',
                specs: { cpu: '', ram: '', os: 'Windows 11' },
                installed_software: [],
                supported_clients: []
            })
            fetchSystems()
        }
        setLoading(true) // Actually setLoading(false) but wait, I should fetch first.
        setLoading(false)
    }

    const handleUpdateSystem = async (system: System) => {
        const { error } = await supabase
            .from('systems')
            .update({
                specs: system.specs,
                installed_software: system.installed_software,
                supported_clients: system.supported_clients,
                status: system.status,
                branch_location: system.branch_location
            })
            .eq('id', system.id)

        if (error) toast.error('Update failed')
        else {
            fetchSystems()
        }
    }

    const updateStatus = async (id: string, status: string, reason?: string) => {
        const { error } = await supabase
            .from('systems')
            .update({ status, last_checked: new Date().toISOString() })
            .eq('id', id)

        if (error) toast.error('Status update failed')
        else {
            toast.success(`System status locked to ${status}`)
            await logSystemAction(id, 'status_change', `Status changed to ${status}. ${reason || ''}`)
            fetchSystems()
            if (showManageModal?.id === id) {
                setShowManageModal(prev => prev ? { ...prev, status: status as any } : null)
                fetchSystemLogs(id)
            }
        }
    }

    const handleMoveSystem = async (systemId: string, newBranch: string) => {
        if (newBranch === activeBranch) return

        const { error } = await supabase
            .from('systems')
            .update({ branch_location: newBranch })
            .eq('id', systemId)

        if (error) {
            toast.error('Movement failed')
        } else {
            await logSystemAction(systemId, 'movement', `System moved from ${activeBranch} to ${newBranch}`)
            toast.success(`Re-assigned to ${newBranch}`)
            setShowManageModal(null)
            fetchSystems()
        }
    }

    const handleAutoIncident = async (system: System) => {
        if (!incidentDescription.trim()) return toast.error('Provide incident details')

        try {
            setLoading(true)
            const { error: eventErr } = await supabase.from('events').insert([{
                title: `HARDWARE FAULT: ${system.name}`,
                description: `System IP: ${system.ip_address}\nIssue: ${incidentDescription}`,
                category: 'utility',
                priority: 'major',
                status: 'open',
                reporter_id: profile?.user_id || profile?.id,
                branch_location: activeBranch,
                event_date: new Date().toISOString()
            }])

            if (eventErr) throw eventErr

            await updateStatus(system.id, 'fault', `Reported Issue: ${incidentDescription}`)

            toast.success('Incident Broadcasted & System Marked Fault')
            setShowManageModal(null)
            setIncidentDescription('')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredSystems = systems.filter(sys =>
        (filterType === 'all' || sys.system_type === filterType) &&
        (sys.name.toLowerCase().includes(searchTerm.toLowerCase()) || sys.ip_address?.includes(searchTerm))
    )

    const addSoftwareToDraft = (isNew: boolean, system?: System) => {
        if (!softEntry.name || !softEntry.client) return toast.error('Name and Client required')

        if (isNew) {
            setNewSystem({
                ...newSystem,
                installed_software: [...newSystem.installed_software, softEntry]
            })
        } else if (system) {
            const updated = {
                ...system,
                installed_software: [...system.installed_software, softEntry]
            }
            setShowManageModal(updated)
            handleUpdateSystem(updated)
            logSystemAction(system.id, 'software_add', `Added protocol: ${softEntry.name}`)
        }
        setSoftEntry({ name: '', install_date: '', client: '' })
    }

    const toggleClientSupport = (clientName: string, isNew: boolean, system?: System) => {
        if (isNew) {
            const current = newSystem.supported_clients
            setNewSystem({
                ...newSystem,
                supported_clients: current.includes(clientName)
                    ? current.filter(c => c !== clientName)
                    : [...current, clientName]
            })
        } else if (system) {
            const current = system.supported_clients || []
            const updated = {
                ...system,
                supported_clients: current.includes(clientName)
                    ? current.filter(c => c !== clientName)
                    : [...current, clientName]
            }
            setShowManageModal(updated)
            handleUpdateSystem(updated)
        }
    }

    return (
        <div className="min-h-screen p-8 text-gray-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">
                        System <span className="text-blue-600">Infrastructure</span>
                    </h1>
                    <div className="flex items-center gap-3">
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Branch Grid Control Center</p>
                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                        <span className="text-blue-500 font-black uppercase text-xs tracking-widest">{activeBranch} Region</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <NeumorphicCard className="flex items-center px-6 py-3 gap-3">
                        <Activity size={18} className="text-green-500 animate-pulse" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Grid Connectivity</span>
                            <span className="text-sm font-black text-emerald-600 tracking-tight uppercase">Optimal Range</span>
                        </div>
                    </NeumorphicCard>
                    {isAdmin && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg hover:shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Add System
                        </button>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                <div className="flex gap-2">
                    {['all', 'admin', 'server', 'workstation'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === type
                                ? 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] text-blue-600'
                                : 'bg-[#e0e5ec] shadow-[5px_5px_10px_rgba(163,177,198,0.5),-5px_-5px_10px_rgba(255,255,255,0.8)] text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <NeumorphicInset className="flex-1 max-w-md flex items-center px-4">
                    <Search size={18} className="text-gray-400 mr-3" />
                    <input
                        type="text"
                        placeholder="Search Hostname or IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent py-4 text-sm font-bold outline-none text-gray-700"
                    />
                </NeumorphicInset>
            </div>

            {/* System Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading && systems.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-30">
                        <RefreshCw size={48} className="mx-auto mb-4 animate-spin" />
                        <p className="font-black uppercase tracking-widest">Scanning Grid...</p>
                    </div>
                ) : filteredSystems.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-gray-300 rounded-[3rem]">
                        <Network size={64} className="mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest">No Systems Mapped in this Sector</p>
                    </div>
                ) : (
                    filteredSystems.map(sys => (
                        <motion.div
                            layout
                            key={sys.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <NeumorphicCard className="p-8 group hover:shadow-[12px_12px_24px_rgba(163,177,198,0.7),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]">
                                        <SystemIcon type={sys.system_type} />
                                    </div>
                                    <StatusBadge status={sys.status} />
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase mb-1">{sys.name}</h3>
                                    <p className="text-xs font-bold text-blue-500/70 uppercase tracking-widest font-mono">{sys.ip_address || 'Unassigned IP'}</p>
                                </div>

                                <div className="space-y-4 mb-6 flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <NeumorphicInset className="p-3">
                                            <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">CPU</span>
                                            <span className="text-xs font-bold text-gray-700 truncate block">{sys.specs?.cpu || 'N/A'}</span>
                                        </NeumorphicInset>
                                        <NeumorphicInset className="p-3">
                                            <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">RAM</span>
                                            <span className="text-xs font-bold text-gray-700 truncate block">{sys.specs?.ram || 'N/A'}</span>
                                        </NeumorphicInset>
                                    </div>

                                    {/* Software List Preview */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Protocols</span>
                                            <span className="text-[10px] font-black text-blue-500 uppercase">{sys.installed_software?.length || 0}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {sys.installed_software?.slice(0, 3).map((s, i) => (
                                                <div key={i} className="px-2 py-1 bg-white/50 rounded-lg text-[10px] font-bold text-slate-500 border border-white/20">
                                                    {s.name}
                                                </div>
                                            ))}
                                            {(sys.installed_software?.length || 0) > 3 && (
                                                <div className="px-2 py-1 bg-blue-50 rounded-lg text-[10px] font-bold text-blue-500">
                                                    +{(sys.installed_software?.length || 0) - 3}
                                                </div>
                                            )}
                                            {(!sys.installed_software || sys.installed_software.length === 0) && (
                                                <span className="text-[10px] italic text-gray-400 ml-1">No software mapped</span>
                                            )}
                                        </div>

                                        <div className="pt-2 flex flex-wrap gap-1 border-t border-white/20 mt-2">
                                            {sys.supported_clients?.map((client, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-400 rounded text-[8px] font-black uppercase">
                                                    {client}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-white/40 mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Last Sync</span>
                                        <span className="text-xs font-bold text-gray-600">{sys.last_checked ? format(new Date(sys.last_checked), 'MMM dd | HH:mm') : 'Never'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowManageModal(sys)}
                                            className="p-2.5 bg-[#e0e5ec] shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] rounded-xl text-blue-600 hover:shadow-inner transition-all"
                                        >
                                            <Settings size={18} />
                                        </button>
                                    </div>
                                </div>
                            </NeumorphicCard>
                        </motion.div>
                    ))
                )}
            </div>

            {/* REGISTER MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-4xl"
                        >
                            <NeumorphicCard className="p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Register New Hardware</h2>
                                    <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-all">
                                        <X size={28} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateSystem} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Hardware Hostname</label>
                                                <NeumorphicInset className="p-4">
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. FETS-SRV-01"
                                                        value={newSystem.name}
                                                        onChange={e => setNewSystem({ ...newSystem, name: e.target.value })}
                                                        className="w-full bg-transparent outline-none text-gray-700 font-bold"
                                                        required
                                                    />
                                                </NeumorphicInset>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Static IP Address</label>
                                                <NeumorphicInset className="p-4">
                                                    <input
                                                        type="text"
                                                        placeholder="192.168.1.XX"
                                                        value={newSystem.ip}
                                                        onChange={e => setNewSystem({ ...newSystem, ip: e.target.value })}
                                                        className="w-full bg-transparent outline-none text-gray-700 font-bold font-mono"
                                                    />
                                                </NeumorphicInset>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Classification</label>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {['workstation', 'server', 'admin'].map(type => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setNewSystem({ ...newSystem, type: type as any })}
                                                            className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${newSystem.type === type
                                                                ? 'bg-blue-600 border-blue-700 text-white shadow-lg'
                                                                : 'bg-transparent border-transparent text-gray-400 hover:bg-white/40'
                                                                }`}
                                                        >
                                                            <SystemIcon type={type} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">CPU</label>
                                                    <NeumorphicInset className="p-3">
                                                        <input
                                                            placeholder="i7-12700"
                                                            value={newSystem.specs.cpu}
                                                            onChange={e => setNewSystem({ ...newSystem, specs: { ...newSystem.specs, cpu: e.target.value } })}
                                                            className="w-full bg-transparent outline-none text-xs font-bold text-gray-700"
                                                        />
                                                    </NeumorphicInset>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">RAM</label>
                                                    <NeumorphicInset className="p-3">
                                                        <input
                                                            placeholder="16GB"
                                                            value={newSystem.specs.ram}
                                                            onChange={e => setNewSystem({ ...newSystem, specs: { ...newSystem.specs, ram: e.target.value } })}
                                                            className="w-full bg-transparent outline-none text-xs font-bold text-gray-700"
                                                        />
                                                    </NeumorphicInset>
                                                </div>
                                            </div>

                                            {/* Software and Client Management in New System */}
                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Software Inventory</label>
                                                        <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">Draft: {newSystem.installed_software?.length || 0}</span>
                                                    </div>

                                                    <NeumorphicInset className="p-4 grid grid-cols-2 gap-4">
                                                        <input
                                                            placeholder="Protocol Name"
                                                            value={softEntry.name}
                                                            onChange={e => setSoftEntry({ ...softEntry, name: e.target.value })}
                                                            className="bg-transparent text-sm font-bold outline-none col-span-2"
                                                        />
                                                        <select
                                                            value={softEntry.client}
                                                            onChange={e => setSoftEntry({ ...softEntry, client: e.target.value })}
                                                            className="bg-transparent text-xs font-black uppercase outline-none"
                                                        >
                                                            <option value="">Select Client</option>
                                                            {clients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => addSoftwareToDraft(true)}
                                                            className="bg-blue-600 text-white rounded-xl font-black text-[10px] tracking-widest py-2"
                                                        >
                                                            ADD PROTOCOL
                                                        </button>
                                                    </NeumorphicInset>

                                                    <div className="flex flex-wrap gap-2">
                                                        {newSystem.installed_software?.map((s, i) => (
                                                            <div key={i} className="flex items-center gap-2 p-2 bg-white/60 rounded-xl border border-white/40">
                                                                <Terminal size={12} className="text-blue-500" />
                                                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{s.name}</span>
                                                                <X size={10} className="text-red-400 cursor-pointer" onClick={() => {
                                                                    setNewSystem({
                                                                        ...newSystem,
                                                                        installed_software: newSystem.installed_software.filter((_, idx) => idx !== i)
                                                                    })
                                                                }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Supported Clients</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {clients.map(c => (
                                                            <button
                                                                key={c.name}
                                                                type="button"
                                                                onClick={() => toggleClientSupport(c.name, true)}
                                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newSystem.supported_clients.includes(c.name)
                                                                    ? 'bg-emerald-500 text-white shadow-lg'
                                                                    : 'bg-[#e0e5ec] text-slate-400 shadow-sm'
                                                                    }`}
                                                            >
                                                                {c.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1 py-4 rounded-2xl bg-[#e0e5ec] shadow-[5px_5px_10px_rgba(163,177,198,0.5),-5px_-5px_10px_rgba(255,255,255,0.8)] text-gray-500 font-bold uppercase tracking-widest text-xs"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-[2] py-4 rounded-2xl bg-blue-600 shadow-lg text-white font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all font-rajdhani"
                                        >
                                            {loading ? 'Registering...' : 'Initiate System Mapping'}
                                        </button>
                                    </div>
                                </form>
                            </NeumorphicCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MANAGE MODAL */}
            <AnimatePresence>
                {showManageModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="w-full max-w-5xl"
                        >
                            <NeumorphicCard className="p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-blue-600 rounded-[2rem] text-white shadow-xl">
                                                <SystemIcon type={showManageModal.system_type} />
                                            </div>
                                            <div>
                                                <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">{showManageModal.name}</h2>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs font-black text-blue-500 uppercase tracking-widest font-mono">{showManageModal.ip_address}</span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{showManageModal.branch_location} Sector</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex bg-[#e0e5ec] p-2 rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]">
                                            {[
                                                { id: 'inventory', icon: Layers, label: 'Inventory' },
                                                { id: 'network', icon: Network, label: 'Network' },
                                                { id: 'history', icon: Calendar, label: 'Logs' }
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveManageTab(tab.id as any)}
                                                    className={`px-6 py-2.5 rounded-xl flex items-center gap-3 transition-all ${activeManageTab === tab.id
                                                        ? 'bg-white shadow-[2px_2px_4px_rgba(163,177,198,0.4)] text-blue-600'
                                                        : 'text-slate-400 hover:text-slate-600'
                                                        }`}
                                                >
                                                    <tab.icon size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => setShowManageModal(null)} className="p-4 bg-[#e0e5ec] shadow-[4px_4px_10px_rgba(163,177,198,0.4),-4px_-4px_10px_rgba(255,255,255,0.8)] rounded-2xl text-slate-400 hover:text-red-500 transition-all active:scale-95">
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {activeManageTab === 'inventory' && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            {/* Software Management */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between px-2">
                                                    <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight flex items-center gap-3">
                                                        <Terminal size={20} className="text-blue-500" />
                                                        Software Assets
                                                    </h3>
                                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{showManageModal.installed_software?.length || 0} Total</span>
                                                </div>

                                                <NeumorphicInset className="p-8">
                                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                                        <div className="col-span-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Protocol / Tool Name</label>
                                                            <input
                                                                className="w-full bg-[#e0e5ec] shadow-inner p-4 rounded-2xl text-sm font-bold outline-none"
                                                                placeholder="e.g. FETS VUE Mainframe"
                                                                value={softEntry.name}
                                                                onChange={e => setSoftEntry({ ...softEntry, name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Client Authority</label>
                                                            <select
                                                                className="w-full bg-[#e0e5ec] shadow-inner p-4 rounded-2xl text-xs font-black uppercase outline-none"
                                                                value={softEntry.client}
                                                                onChange={e => setSoftEntry({ ...softEntry, client: e.target.value })}
                                                            >
                                                                <option value="">Select Client</option>
                                                                {clients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="flex items-end">
                                                            <button
                                                                onClick={() => addSoftwareToDraft(false, showManageModal)}
                                                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] tracking-widest shadow-lg shadow-blue-100 uppercase"
                                                            >
                                                                Register Asset
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {showManageModal.installed_software?.map((s, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/60">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl">
                                                                        <Terminal size={14} />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{s.name}</h4>
                                                                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-wider flex items-center gap-1 mt-1">
                                                                            <Building2 size={8} /> {s.client}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        const updated = {
                                                                            ...showManageModal,
                                                                            installed_software: showManageModal.installed_software.filter((_, i) => i !== idx)
                                                                        }
                                                                        setShowManageModal(updated)
                                                                        handleUpdateSystem(updated)
                                                                        logSystemAction(showManageModal.id, 'software_remove', `Removed protocol: ${s.name}`)
                                                                    }}
                                                                    className="p-2 text-red-300 hover:text-red-500 transition-colors"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {(!showManageModal.installed_software || showManageModal.installed_software.length === 0) && (
                                                            <div className="text-center py-12 opacity-20">
                                                                <Layers size={48} className="mx-auto mb-4" />
                                                                <p className="text-xs font-black uppercase tracking-widest">No Registered Software</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </NeumorphicInset>
                                            </div>

                                            {/* Right: Client Controls & Hardware Specs */}
                                            <div className="space-y-8">
                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight flex items-center gap-3 px-2">
                                                        <Building2 size={20} className="text-emerald-500" />
                                                        Client Authorization
                                                    </h3>
                                                    <NeumorphicInset className="p-6">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose mb-6 px-1">
                                                            Hardware mapped to specific client exam protocols.
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {clients.map(c => (
                                                                <button
                                                                    key={c.name}
                                                                    onClick={() => toggleClientSupport(c.name, false, showManageModal)}
                                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showManageModal.supported_clients?.includes(c.name)
                                                                        ? 'bg-emerald-500 text-white shadow-lg'
                                                                        : 'bg-[#e0e5ec] text-slate-400 shadow-sm'
                                                                        }`}
                                                                >
                                                                    {c.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </NeumorphicInset>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight flex items-center gap-3 px-2">
                                                        <Cpu size={20} className="text-indigo-500" />
                                                        Specifications
                                                    </h3>
                                                    <NeumorphicInset className="p-6 grid grid-cols-2 gap-4">
                                                        {[
                                                            { label: 'CPU', val: showManageModal.specs?.cpu, key: 'cpu' },
                                                            { label: 'RAM', val: showManageModal.specs?.ram, key: 'ram' },
                                                            { label: 'OS', val: showManageModal.specs?.os, key: 'os' }
                                                        ].map(spec => (
                                                            <div key={spec.key} className="p-4 bg-white/40 rounded-2xl border border-white/60">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{spec.label}</span>
                                                                <span className="text-xs font-black text-slate-800 uppercase truncate block">{spec.val || 'Unmapped'}</span>
                                                            </div>
                                                        ))}
                                                    </NeumorphicInset>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeManageTab === 'network' && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            {/* Deployment Control */}
                                            <div className="space-y-6">
                                                <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight flex items-center gap-3 px-2">
                                                    <Network size={20} className="text-blue-500" />
                                                    Strategic Deployment
                                                </h3>
                                                <NeumorphicInset className="p-8 space-y-8">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Re-assign Regional Sector (Move Hardware)</label>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {['kannur', 'kochi', 'dubai'].map(branch => (
                                                                <button
                                                                    key={branch}
                                                                    onClick={() => handleMoveSystem(showManageModal.id, branch)}
                                                                    className={`py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest border-2 transition-all ${showManageModal.branch_location === branch
                                                                        ? 'bg-blue-600 border-blue-700 text-white shadow-xl'
                                                                        : 'bg-[#e0e5ec] border-transparent text-slate-400 shadow-md hover:bg-white'
                                                                        }`}
                                                                >
                                                                    {branch}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="pt-8 border-t border-white/40 space-y-4">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Operational State Command</label>
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <button
                                                                onClick={() => updateStatus(showManageModal.id, 'operational')}
                                                                className={`p-6 rounded-[2.5rem] flex items-center justify-between transition-all ${showManageModal.status === 'operational'
                                                                    ? 'bg-emerald-500 text-white shadow-xl translate-y-[-2px]'
                                                                    : 'bg-[#e0e5ec] text-slate-500 shadow-md hover:bg-white'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <CheckCircle2 size={24} />
                                                                    <div className="text-left">
                                                                        <span className="text-xs font-black uppercase block">Operational</span>
                                                                        <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest">System fully functional</span>
                                                                    </div>
                                                                </div>
                                                                {showManageModal.status === 'operational' && <Sparkles size={16} />}
                                                            </button>

                                                            <button
                                                                onClick={() => updateStatus(showManageModal.id, 'maintenance')}
                                                                className={`p-6 rounded-[2.5rem] flex items-center justify-between transition-all ${showManageModal.status === 'maintenance'
                                                                    ? 'bg-amber-500 text-white shadow-xl translate-y-[-2px]'
                                                                    : 'bg-[#e0e5ec] text-slate-500 shadow-md hover:bg-white'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <Settings size={24} />
                                                                    <div className="text-left">
                                                                        <span className="text-xs font-black uppercase block">Maintenance</span>
                                                                        <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest">Restricted Access</span>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </NeumorphicInset>
                                            </div>

                                            {/* Fault Reporting */}
                                            <div className="space-y-6">
                                                <h3 className="text-lg font-black text-rose-600 uppercase tracking-tight flex items-center gap-3 px-2">
                                                    <AlertTriangle size={20} />
                                                    Fault Transmission
                                                </h3>
                                                <NeumorphicInset className="p-8 space-y-6">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 px-1">Operational Issue Details</label>
                                                        <textarea
                                                            placeholder="State the nature of hardware or software failure for immediate broadcasting..."
                                                            value={incidentDescription}
                                                            onChange={e => setIncidentDescription(e.target.value)}
                                                            className="w-full bg-[#E0E5EC] shadow-inner p-8 rounded-[2.5rem] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-rose-200/20 min-h-[160px] placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleAutoIncident(showManageModal)}
                                                        className="w-full py-6 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-rose-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                                                    >
                                                        <Zap size={20} className="group-hover:animate-pulse" /> BROADCAST CRITICAL FAULT
                                                    </button>
                                                </NeumorphicInset>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeManageTab === 'history' && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                            <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight flex items-center gap-3 px-2">
                                                <Activity size={20} className="text-indigo-500" />
                                                Operational Logs & Nexus Activity
                                            </h3>
                                            <NeumorphicInset className="p-8 max-h-[500px] overflow-y-auto custom-scrollbar">
                                                <div className="space-y-6 relative">
                                                    {systemLogs.length === 0 ? (
                                                        <div className="text-center py-20 opacity-20">
                                                            <Terminal size={64} className="mx-auto mb-4" />
                                                            <p className="font-black uppercase tracking-widest">No Activity Records Detected</p>
                                                        </div>
                                                    ) : (
                                                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200/50" />
                                                    )}
                                                    {systemLogs.map((log) => (
                                                        <div key={log.id} className="relative pl-12">
                                                            <div className={`absolute left-0 top-1 w-8 h-8 rounded-full shadow-md flex items-center justify-center border-4 border-[#e0e5ec] ${log.log_type === 'status_change' ? 'bg-amber-400 text-white' :
                                                                log.log_type === 'movement' ? 'bg-blue-400 text-white' :
                                                                    log.log_type === 'creation' ? 'bg-emerald-400 text-white' : 'bg-slate-400 text-white'
                                                                }`}>
                                                                {log.log_type === 'status_change' ? <Settings size={12} /> :
                                                                    log.log_type === 'movement' ? <Network size={12} /> :
                                                                        log.log_type === 'creation' ? <Zap size={12} /> : <Terminal size={12} />}
                                                            </div>
                                                            <div className="p-5 bg-white/40 rounded-2xl border border-white/60 shadow-sm">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                        {format(new Date(log.created_at), 'MMMM dd, yyyy | HH:mm:ss')}
                                                                    </span>
                                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${log.log_type === 'status_change' ? 'bg-amber-50 text-amber-600' :
                                                                        log.log_type === 'movement' ? 'bg-blue-50 text-blue-600' :
                                                                            'bg-slate-50 text-slate-500'
                                                                        }`}>
                                                                        {log.log_type.replace('_', ' ')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase tracking-tight">
                                                                    {log.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </NeumorphicInset>
                                        </motion.div>
                                    )}
                                </div>
                            </NeumorphicCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    )
}

export default SystemManager
