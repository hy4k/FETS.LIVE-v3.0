import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    Search,
    Settings2,
    Shield,
    ShieldCheck,
    ShieldAlert,
    Save,
    X,
    Plus,
    Lock,
    Calendar,
    ClipboardList,
    Newspaper,
    MessageSquare,
    AlertTriangle,
    ChevronRight,
    UserPlus
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useStaff, useStaffMutations } from '../hooks/useStaffManagement'
import { toast } from 'react-hot-toast'
import { StaffProfile } from '../types/shared'

const PERMISSION_KEYS = [
    { key: 'roster_edit', label: 'Roster Management', icon: Users, description: 'Create and edit staff rosters' },
    { key: 'calendar_edit', label: 'Calendar Control', icon: Calendar, description: 'Manage events and calendar entries' },
    { key: 'checklist_edit', label: 'Checklist Authority', icon: ClipboardList, description: 'Create and edit checklist templates' },
    { key: 'news_edit', label: 'Newsroom Access', icon: Newspaper, description: 'Post and manage news ticker updates' },
    { key: 'incident_edit', label: 'Incident Reporting', icon: ShieldAlert, description: 'Manage and close incident reports' },
    { key: 'event_edit', label: 'Event Management', icon: AlertTriangle, description: 'Create and manage operational events' },
    { key: 'staff_edit', label: 'Staff Administration', icon: ShieldCheck, description: 'Add or modify staff profiles' },
    { key: 'notice_edit', label: 'Notice Board', icon: Megaphone, description: 'Post official notices' },
    { key: 'sop_edit', label: 'SOP Management', icon: Lock, description: 'Upload and edit SOP documents' },
    { key: 'chat_admin', label: 'Chat Administration', icon: MessageSquare, description: 'Manage group chats and broadcasts' },
]

// Helper for Lucide icons since I can't import Megaphone above for some reason (oops, let me check)
import { Megaphone } from 'lucide-react'

export function UserManagement() {
    const { profile: currentUser } = useAuth()
    const { data: staff = [], isLoading } = useStaff()
    const { updateStaff } = useStaffMutations()

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUser, setSelectedUser] = useState<StaffProfile | null>(null)
    const [editingPermissions, setEditingPermissions] = useState<Record<string, boolean>>({})
    const [editingRole, setEditingRole] = useState<string>('')
    const [isSaving, setIsSaving] = useState(false)

    const filteredStaff = useMemo(() => {
        return staff.filter(s =>
            s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [staff, searchTerm])

    const handleSelectUser = (user: StaffProfile) => {
        setSelectedUser(user)
        setEditingRole(user.role || 'fetsian')
        // Parse permissions from JSONB
        const permissions = typeof user.permissions === 'object' && user.permissions !== null
            ? (user.permissions as Record<string, boolean>)
            : {}
        setEditingPermissions(permissions)
    }

    const handleTogglePermission = (key: string) => {
        setEditingPermissions(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const handleSave = async () => {
        if (!selectedUser) return

        setIsSaving(true)
        try {
            await updateStaff({
                id: selectedUser.id,
                role: editingRole,
                permissions: editingPermissions as any
            })
            toast.success(`Permissions updated for ${selectedUser.full_name}`)
            setSelectedUser(null)
        } catch (error: any) {
            toast.error(`Failed to update permissions: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    if (currentUser?.email !== 'mithun@fets.in') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="text-red-600" size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">ACCESS DENIED</h2>
                <p className="text-gray-500 max-w-md font-medium">
                    This secure management console is restricted to the Super Admin (mithun@fets.in) only.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-gray-200">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <ShieldCheck size={24} />
                        </div>
                        <span className="text-amber-600 font-bold tracking-widest text-xs uppercase">Security Protocol v3.0</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-800 tracking-tighter uppercase leading-none">
                        User <span className="text-gold-gradient">Management</span>
                    </h1>
                    <p className="text-gray-500 font-medium mt-4 text-lg">
                        Manage global permissions and administrative roles across the FETS Universe.
                    </p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search personnel..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-80 pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* User List Panel */}
                <div className="xl:col-span-1 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Personnel List</h3>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{filteredStaff.length} Total</span>
                    </div>

                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                            ))
                        ) : filteredStaff.map(user => (
                            <motion.button
                                key={user.id}
                                onClick={() => handleSelectUser(user)}
                                whileHover={{ x: 4 }}
                                className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between border ${selectedUser?.id === user.id
                                    ? 'bg-amber-50 border-amber-200 shadow-md ring-1 ring-amber-200'
                                    : 'bg-white border-transparent hover:border-gray-200 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${user.role === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {user.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 leading-tight">{user.full_name}</h4>
                                        <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${user.role === 'super_admin' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {user.role || 'fetsian'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className={`text-gray-300 transition-transform ${selectedUser?.id === user.id ? 'rotate-90 text-amber-500' : ''}`} size={20} />
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Permissions Panel */}
                <div className="xl:col-span-2">
                    <AnimatePresence mode="wait">
                        {selectedUser ? (
                            <motion.div
                                key={selectedUser.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white border border-gray-200 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col h-full"
                            >
                                {/* User Info Header */}
                                <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-3xl font-black text-amber-600 shadow-inner">
                                                {selectedUser.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-gray-800 tracking-tight leading-none mb-2">{selectedUser.full_name}</h2>
                                                <p className="text-gray-500 font-medium">{selectedUser.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Role</label>
                                            <select
                                                value={editingRole}
                                                onChange={(e) => setEditingRole(e.target.value)}
                                                className="w-full p-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207L10%2012L15%207%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_1rem_center] cursor-pointer"
                                            >
                                                <option value="fetsian">FETSIAN (Default)</option>
                                                <option value="admin">ADMIN</option>
                                                <option value="super_admin">SUPER ADMIN</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Permissions Grid */}
                                <div className="p-8 flex-1 overflow-y-auto max-h-[50vh]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Settings2 className="text-amber-500" size={20} />
                                        <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Feature Permissions</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {PERMISSION_KEYS.map((perm) => {
                                            const Icon = perm.icon
                                            const isEnabled = editingPermissions[perm.key]

                                            return (
                                                <button
                                                    key={perm.key}
                                                    onClick={() => handleTogglePermission(perm.key)}
                                                    className={`p-5 rounded-3xl text-left transition-all group relative border ${isEnabled
                                                        ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-100'
                                                        : 'bg-gray-50 border-transparent hover:bg-gray-100 opacity-70'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`p-3 rounded-2xl transition-all ${isEnabled ? 'bg-amber-500 text-white' : 'bg-white text-gray-400 group-hover:text-gray-600'
                                                            }`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-bold transition-colors ${isEnabled ? 'text-amber-900' : 'text-gray-600'}`}>
                                                                {perm.label}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                                                                {perm.description}
                                                            </p>
                                                        </div>
                                                        <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isEnabled ? 'bg-amber-500 border-amber-500' : 'bg-white border-gray-200'
                                                            }`}>
                                                            {isEnabled && <ShieldCheck size={14} className="text-white" />}
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <p className="text-xs text-gray-400 font-medium max-w-xs">
                                        Changes take effect immediately upon saving. Users may need to refresh their session.
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setSelectedUser(null)}
                                            className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="px-8 py-3 bg-gray-800 text-white rounded-2xl font-bold shadow-lg shadow-gray-200 hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Save size={20} />
                                            )}
                                            <span>Update Access</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center text-gray-400 bg-gray-50/30">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                    <UserPlus size={40} className="text-gray-300" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-400 tracking-tight uppercase">Select Personnel</h3>
                                <p className="max-w-xs text-gray-400 font-medium mt-2">
                                    Choose a user from the directory to view and manage their security clearance level.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
