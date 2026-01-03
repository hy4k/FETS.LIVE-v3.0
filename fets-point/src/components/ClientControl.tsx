import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, Plus, Trash2, Edit3,
    MapPin, GraduationCap, Save, X,
    Search, ChevronRight, Hash, Terminal
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface Client {
    id: string
    name: string
    color: string
    softwares?: string[]
    logo_url?: string
}

interface Exam {
    id: string
    client_id: string
    name: string
    locations: string[]
}

const BRANCHES = ['calicut', 'cochin', 'kannur']

export function ClientControl() {
    const [clients, setClients] = useState<Client[]>([])
    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const [showAddClient, setShowAddClient] = useState(false)
    const [newClientName, setNewClientName] = useState('')

    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
    const [showAddExam, setShowAddExam] = useState(false)
    const [newExam, setNewExam] = useState({ name: '', locations: [] as string[] })

    const [newSoftware, setNewSoftware] = useState('')
    const [isSavingSoftware, setIsSavingSoftware] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: clientsData } = await supabase.from('clients').select('*').order('name')
            const { data: examsData } = await supabase.from('client_exams').select('*').order('name')

            setClients(clientsData || [])
            setExams(examsData || [])

            if (clientsData && clientsData.length > 0 && !selectedClientId) {
                setSelectedClientId(clientsData[0].id)
            }
        } catch (error) {
            toast.error('Failed to sync master data')
        } finally {
            setLoading(false)
        }
    }

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newClientName.trim()) return

        try {
            const { data, error } = await supabase
                .from('clients')
                .insert([{ name: newClientName, color: 'indigo' }])
                .select()

            if (error) throw error

            toast.success('Client registered successfully')
            setNewClientName('')
            setShowAddClient(false)
            fetchData()
        } catch (error) {
            toast.error('Failed to register client')
        }
    }

    const handleDeleteClient = async (id: string) => {
        if (!confirm('Are you sure? This will remove all associated exams.')) return

        try {
            const { error } = await supabase.from('clients').delete().eq('id', id)
            if (error) throw error
            toast.success('Client records purged')
            fetchData()
        } catch (error) {
            toast.error('Purge failed')
        }
    }

    const handleAddExam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClientId || !newExam.name.trim()) return

        try {
            const { error } = await supabase
                .from('client_exams')
                .insert([{
                    client_id: selectedClientId,
                    name: newExam.name,
                    locations: newExam.locations
                }])

            if (error) throw error
            toast.success('Exam protocol added')
            setNewExam({ name: '', locations: [] })
            setShowAddExam(false)
            fetchData()
        } catch (error) {
            toast.error('Failed to add protocol')
        }
    }

    const handleAddSoftware = async () => {
        if (!selectedClientId || !newSoftware.trim()) return
        setIsSavingSoftware(true)
        try {
            const client = clients.find(c => c.id === selectedClientId)
            if (!client) return

            const updatedSoftwares = [...(client.softwares || []), newSoftware.trim()]
            const { error } = await supabase
                .from('clients')
                .update({ softwares: updatedSoftwares })
                .eq('id', selectedClientId)

            if (error) throw error
            toast.success('Software registered')
            setNewSoftware('')
            fetchData()
        } catch (error) {
            toast.error('Failed to add software')
        } finally {
            setIsSavingSoftware(false)
        }
    }

    const handleDeleteSoftware = async (swName: string) => {
        if (!selectedClientId) return
        try {
            const client = clients.find(c => c.id === selectedClientId)
            if (!client) return

            const updatedSoftwares = (client.softwares || []).filter(s => s !== swName)
            const { error } = await supabase
                .from('clients')
                .update({ softwares: updatedSoftwares })
                .eq('id', selectedClientId)

            if (error) throw error
            toast.success('Software removed')
            fetchData()
        } catch (error) {
            toast.error('Failed to remove software')
        }
    }

    const toggleLocation = (loc: string) => {
        setNewExam(prev => ({
            ...prev,
            locations: prev.locations.includes(loc)
                ? prev.locations.filter(l => l !== loc)
                : [...prev.locations, loc]
        }))
    }

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const activeClientExams = exams.filter(e => e.client_id === selectedClientId)

    return (
        <div className="h-full flex flex-col gap-6 text-slate-800">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase">Client Control</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Master Database Management</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddClient(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                        REGISTER CLIENT
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Sidebar: Clients */}
                <div className="w-80 flex flex-col gap-4 bg-slate-50 rounded-[2rem] p-4 border border-slate-200">
                    <div className="flex items-center gap-2 px-2 text-slate-400">
                        <Building2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Client Roster</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {filteredClients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => setSelectedClientId(client.id)}
                                className={`group flex items-center justify-between p-4 rounded-2xl transition-all ${selectedClientId === client.id
                                    ? 'bg-white shadow-md border-indigo-500 text-indigo-600'
                                    : 'hover:bg-white/50 text-slate-600 border-transparent'
                                    } border-2`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedClientId === client.id ? 'bg-indigo-100' : 'bg-slate-100'
                                        }`}>
                                        <Hash size={14} />
                                    </div>
                                    <span className="font-bold text-sm truncate max-w-[120px]">{client.name}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded-md">
                                        <Trash2 size={14} />
                                    </button>
                                    <ChevronRight size={16} className={selectedClientId === client.id ? 'text-indigo-400' : 'text-slate-300'} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content: Exams & Protocols */}
                <div className="flex-1 flex flex-col bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                    {selectedClientId ? (
                        <>
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight text-slate-800">
                                            {clients.find(c => c.id === selectedClientId)?.name}
                                        </h3>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Protocol Registry</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddExam(true)}
                                    className="px-4 py-2 border-2 border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    ADD EXAM TYPE
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start content-start custom-scrollbar">
                                {/* Exams Section */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Exam Protocols</h4>
                                    {activeClientExams.length > 0 ? (
                                        activeClientExams.map(exam => (
                                            <div key={exam.id} className="p-6 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-100 bg-slate-50/30 transition-all group">
                                                <div className="flex items-start justify-between mb-4">
                                                    <h4 className="font-bold text-slate-700">{exam.name}</h4>
                                                    <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {exam.locations.map(loc => (
                                                        <span key={loc} className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5 shadow-sm">
                                                            <MapPin size={10} className="text-indigo-500" />
                                                            {loc}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                            <GraduationCap size={48} className="mb-4 opacity-10" />
                                            <p className="font-bold text-xs uppercase tracking-widest">No protocols defined</p>
                                        </div>
                                    )}
                                </div>

                                {/* Software Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Client Software</h4>
                                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg">
                                            {clients.find(c => c.id === selectedClientId)?.softwares?.length || 0} Assets
                                        </span>
                                    </div>

                                    <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 space-y-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Add software title..."
                                                value={newSoftware}
                                                onChange={(e) => setNewSoftware(e.target.value)}
                                                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                            />
                                            <button
                                                onClick={handleAddSoftware}
                                                disabled={isSavingSoftware || !newSoftware.trim()}
                                                className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {clients.find(c => c.id === selectedClientId)?.softwares?.map((sw, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 group">
                                                    <div className="flex items-center gap-3">
                                                        <Terminal size={14} className="text-indigo-400" />
                                                        <span className="text-xs font-bold text-slate-600 uppercase">{sw}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSoftware(sw)}
                                                        className="p-1 hover:bg-red-50 text-red-300 hover:text-red-500 rounded transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                            <Building2 size={80} className="mb-6 opacity-20" />
                            <p className="text-xl font-black">Select a Client to view Protocols</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showAddClient && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black uppercase tracking-tight">Register Client</h3>
                                <button onClick={() => setShowAddClient(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleAddClient} className="p-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Corporate Identity</label>
                                        <input
                                            type="text"
                                            required
                                            value={newClientName}
                                            onChange={(e) => setNewClientName(e.target.value)}
                                            placeholder="e.g. British Council, IDP"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                            autoFocus
                                        />
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                                        CONFIRM REGISTRATION
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showAddExam && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black uppercase tracking-tight">Add Exam Protocol</h3>
                                <button onClick={() => setShowAddExam(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleAddExam} className="p-8 space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Protocol Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newExam.name}
                                        onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                                        placeholder="e.g. IELTS UKVI, CD-IELTS"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operational Branches</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {BRANCHES.map(branch => (
                                            <button
                                                key={branch}
                                                type="button"
                                                onClick={() => toggleLocation(branch)}
                                                className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-3 ${newExam.locations.includes(branch)
                                                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-inner'
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newExam.locations.includes(branch) ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                                                    }`}>
                                                    {newExam.locations.includes(branch) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                                {branch.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                                    AUTHORIZE PROTOCOL
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
