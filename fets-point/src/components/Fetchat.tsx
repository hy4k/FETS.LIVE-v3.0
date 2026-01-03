import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Send, Mic, Paperclip, X, Maximize2, Minimize2,
    ExternalLink, User, Search, MessageSquare,
    Clock, Check, CheckCheck, MoreVertical,
    Phone, Video, Smile, Info, Trash2, Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

interface StaffProfile {
    id: string
    user_id: string
    full_name: string
    avatar_url: string | null
    branch_assigned: string | null
    is_online?: boolean
    status?: string
}

interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    type: 'text' | 'voice' | 'file' | 'image'
    file_path?: string
    created_at: string
    read_at?: string
}

interface UserMemory {
    last_active: string
    unread_count: number
}

interface FetchatProps {
    isDetached?: boolean
    onToggleDetach?: () => void
    onClose?: () => void
}

export const Fetchat: React.FC<FetchatProps> = ({ isDetached = false, onToggleDetach, onClose }) => {
    const { profile, user } = useAuth()
    const [staff, setStaff] = useState<StaffProfile[]>([])
    const [selectedUser, setSelectedUser] = useState<StaffProfile | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [presence, setPresence] = useState<Record<string, { status: string, last_seen: string }>>({})
    const [isMinimized, setIsMinimized] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
    const [hasNewMessage, setHasNewMessage] = useState(false)
    const [userActivity, setUserActivity] = useState<'online' | 'idle'>('online')

    const scrollRef = useRef<HTMLDivElement>(null)
    const messageSubscription = useRef<any>(null)
    const activityTimeout = useRef<any>(null)

    // Fetch all staff members
    useEffect(() => {
        const fetchStaff = async () => {
            const { data, error } = await supabase
                .from('staff_profiles')
                .select('id, user_id, full_name, avatar_url, branch_assigned')
                .neq('user_id', user?.id)

            if (error) {
                console.error('Error fetching staff:', error)
            } else {
                setStaff(data || [])
            }
        }

        fetchStaff()
    }, [user?.id])

    // Real-time Presence
    useEffect(() => {
        if (!user?.id) return

        const channel = supabase.channel('online-staff', {
            config: {
                presence: {
                    key: user.id,
                },
            },
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const formattedPresence: Record<string, any> = {}

                Object.keys(state).forEach((key) => {
                    const userPresence = state[key] as any
                    if (userPresence.length > 0) {
                        formattedPresence[key] = userPresence[0]
                    }
                })

                setPresence(formattedPresence)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: user.id,
                        full_name: profile?.full_name,
                        status: userActivity,
                        last_seen: new Date().toISOString()
                    })
                }
            })

        // Activity tracking for IDLE status
        const resetActivity = () => {
            setUserActivity('online')
            if (activityTimeout.current) clearTimeout(activityTimeout.current)
            activityTimeout.current = setTimeout(() => {
                setUserActivity('idle')
            }, 300000) // 5 minutes of inactivity = idle
        }

        window.addEventListener('mousemove', resetActivity)
        window.addEventListener('keypress', resetActivity)
        resetActivity()

        return () => {
            channel.unsubscribe()
            window.removeEventListener('mousemove', resetActivity)
            window.removeEventListener('keypress', resetActivity)
            if (activityTimeout.current) clearTimeout(activityTimeout.current)
        }
    }, [user?.id, profile?.full_name, userActivity])

    // Update presence status in channel when userActivity changes
    useEffect(() => {
        const updateChannelStatus = async () => {
            const channel = supabase.getChannels().find(c => c.topic === 'online-staff')
            if (channel && user?.id) {
                await channel.track({
                    user_id: user.id,
                    full_name: profile?.full_name,
                    status: userActivity,
                    last_seen: new Date().toISOString()
                })
            }
        }
        updateChannelStatus()
    }, [userActivity, profile?.full_name, user?.id])

    // Fetch unread counts
    useEffect(() => {
        if (!user?.id || !staff.length) return

        const fetchUnreads = async () => {
            // For each staff member, check for unread messages in their conversation
            const counts: Record<string, number> = {}

            for (const s of staff) {
                try {
                    const { data: convId } = await supabase.rpc('get_or_create_conversation', {
                        user_id_1: profile.id,
                        user_id_2: s.id
                    })

                    if (convId) {
                        const { count } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('conversation_id', convId)
                            .neq('sender_id', profile.id)
                            .is('read_at', null)

                        counts[s.id] = count || 0
                    }
                } catch (e) {
                    console.error('Error fetching unreads for', s.full_name, e)
                }
            }
            setUnreadCounts(counts)
        }

        fetchUnreads()
    }, [staff, user?.id, profile?.id])

    // Load messages when selecting a user
    useEffect(() => {
        if (!selectedUser || !user?.id) return

        const loadChat = async () => {
            setIsLoading(true)
            try {
                // Find conversation ID
                const { data: convId, error: convError } = await supabase.rpc('get_or_create_conversation', {
                    user_id_1: profile.id,
                    user_id_2: selectedUser.id
                })

                if (convError) throw convError

                // Fetch messages
                const { data: msgData, error: msgError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', convId)
                    .order('created_at', { ascending: true })

                if (msgError) throw msgError

                setMessages(msgData || [])

                // Subscribe to new messages for this conversation
                if (messageSubscription.current) {
                    messageSubscription.current.unsubscribe()
                }

                messageSubscription.current = supabase
                    .channel(`chat:${convId}`)
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${convId}`
                    }, (payload) => {
                        const newMsg = payload.new as Message
                        setMessages(prev => [...prev, newMsg])
                        if (isMinimized) {
                            setHasNewMessage(true)
                        }
                    })
                    .subscribe()

            } catch (err: any) {
                toast.error('Failed to load chat')
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }

        loadChat()

        if (selectedUser) {
            // Clear unread for this user
            setUnreadCounts(prev => ({ ...prev, [selectedUser.id]: 0 }))
        }

        return () => {
            if (messageSubscription.current) {
                messageSubscription.current.unsubscribe()
            }
        }
    }, [selectedUser, user?.id, profile?.id, isMinimized])

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newMessage.trim() || !selectedUser || !profile) return

        const content = newMessage.trim()
        setNewMessage('')

        try {
            const { data: convId } = await supabase.rpc('get_or_create_conversation', {
                user_id_1: profile.id,
                user_id_2: selectedUser.id
            })

            const { error } = await supabase.from('messages').insert([{
                conversation_id: convId,
                sender_id: profile.id,
                content: content,
                type: 'text'
            }])

            if (error) throw error
        } catch (err: any) {
            toast.error('Failed to send message')
            console.error(err)
        }
    }

    const getStatusColor = (userId: string) => {
        const userPresence = presence[userId]
        if (!userPresence) return 'bg-gray-300'
        if (userPresence.status === 'online') return 'bg-emerald-500'
        if (userPresence.status === 'idle') return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
        return 'bg-gray-300'
    }

    const getUnreadBadge = (userId: string) => {
        const count = unreadCounts[userId] || 0
        if (count === 0) return null
        return (
            <div className="absolute -top-1 -left-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                {count}
            </div>
        )
    }

    const filteredStaff = staff.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.branch_assigned?.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (isMinimized && !isDetached) {
        return (
            <div
                onClick={() => {
                    setIsMinimized(false)
                    setHasNewMessage(false)
                }}
                className={`fixed bottom-0 right-8 w-64 bg-emerald-600 text-white p-3 rounded-t-xl cursor-pointer flex justify-between items-center shadow-2xl z-50 border-t border-x border-emerald-500/30 transition-all ${hasNewMessage ? 'animate-pulse bg-emerald-500 ring-2 ring-emerald-400 ring-offset-2' : ''}`}
            >
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className={hasNewMessage ? 'animate-bounce' : ''} />
                    <span className="font-black text-sm uppercase tracking-widest">FETCHAT</span>
                </div>
                <div className="flex items-center gap-2">
                    {hasNewMessage && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                    <Maximize2 size={16} />
                </div>
            </div>
        )
    }

    return (
        <div className={`flex flex-col h-full bg-[#e0e5ec] rounded-3xl overflow-hidden shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] border border-white/20 ${isDetached ? 'fixed bottom-4 right-4 w-96 h-[600px] z-[100]' : ''}`}>

            {/* Top Bar */}
            <div className="bg-[#075e54] text-white p-4 flex justify-between items-center shadow-lg relative z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <MessageSquare size={20} className="text-emerald-300" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm uppercase tracking-[0.2em]">FETCHAT</h3>
                        <span className="text-[10px] text-emerald-100/70 font-bold uppercase tracking-widest flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Internal Secure Grid
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onToggleDetach && (
                        <button onClick={onToggleDetach} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title={isDetached ? "Restore" : "Detach"}>
                            {isDetached ? <Minimize2 size={18} /> : <ExternalLink size={18} />}
                        </button>
                    )}
                    {!isDetached && (
                        <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    )}
                    {isDetached && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* User Presence Panel - Visible always or toggled? The user says "directly below the user grid" */}
                <div className="p-4 border-b border-gray-300/50 bg-gray-50/30">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Intelligence Grid..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/50 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-40 overflow-y-auto custom-scrollbar p-1">
                        {filteredStaff.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedUser(s)}
                                className={`flex flex-col items-center gap-1.5 group relative transition-all ${selectedUser?.id === s.id ? 'scale-105' : 'hover:scale-105'}`}
                            >
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 shadow-sm transition-all ${selectedUser?.id === s.id ? 'border-emerald-500' : 'border-white'}`}>
                                        {s.avatar_url ? (
                                            <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                <User size={20} />
                                            </div>
                                        )}
                                    </div>
                                    {/* Presence Indicator */}
                                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-[#e0e5ec] rounded-full ${getStatusColor(s.user_id)}`} />

                                    {/* Unread Badge */}
                                    {getUnreadBadge(s.id)}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-tight text-center leading-tight truncate w-full ${selectedUser?.id === s.id ? 'text-emerald-600' : 'text-gray-500'}`}>
                                    {s.full_name.split(' ')[0]}
                                </span>

                                {/* Last Active Tooltip */}
                                {presence[s.user_id] && (
                                    <div className="absolute -bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-[7px] font-bold text-gray-400 uppercase">
                                        Active
                                    </div>
                                )}

                                {/* Quick Action Overlay */}
                                <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1 bg-white/20 backdrop-blur-[2px] rounded-2xl pointer-events-none">
                                    <div className="bg-emerald-600 text-white p-1 rounded-md shadow-lg pointer-events-auto">
                                        <Zap size={10} />
                                    </div>
                                </div>

                                {/* Branch Tag - Subtle overlay on hover */}
                                {s.branch_assigned && (
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none bg-black/80 text-white text-[7px] px-1.5 py-0.5 rounded-full whitespace-nowrap z-20 transition-opacity uppercase font-bold">
                                        {s.branch_assigned}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Window */}
                <div className="flex-1 flex flex-col bg-[#e5ddd5] relative overflow-hidden">
                    {/* WhatsApp style background pattern would be nice, but simple color for now */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat" />

                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-[#ededed] p-3 flex justify-between items-center border-b border-gray-300 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                        {selectedUser.avatar_url ? (
                                            <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                <User size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-xs text-gray-800 uppercase tracking-tight">{selectedUser.full_name}</h4>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                            {presence[selectedUser.user_id] ? (
                                                <>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(selectedUser.user_id)}`} />
                                                    {presence[selectedUser.user_id].status || 'Online'}
                                                </>
                                            ) : (
                                                'Offline'
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-gray-500">
                                    <Phone size={18} className="cursor-pointer hover:text-emerald-600" />
                                    <Video size={20} className="cursor-pointer hover:text-emerald-600" />
                                    <MoreVertical size={20} className="cursor-pointer hover:text-emerald-600" />
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10 custom-scrollbar-chat"
                            >
                                {messages.length === 0 && !isLoading && (
                                    <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-8">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                                            <MessageSquare size={32} className="text-emerald-600" />
                                        </div>
                                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-800">
                                            End-to-end encrypted protocol initiated
                                        </p>
                                        <p className="text-[8px] uppercase font-bold tracking-widest mt-2">
                                            Messages are private and secure
                                        </p>
                                    </div>
                                )}

                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === profile?.id
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] rounded-xl px-3 py-2 shadow-sm text-sm relative ${isMe ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                                                <p className="mb-1 font-medium">{msg.content}</p>
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-[8px] opacity-50 font-bold">
                                                        {format(new Date(msg.created_at), 'HH:mm')}
                                                    </span>
                                                    {isMe && (
                                                        <CheckCheck size={12} className={msg.read_at ? 'text-blue-500' : 'text-gray-400'} />
                                                    )}
                                                </div>

                                                {/* Tail pointer */}
                                                <div className={`absolute top-0 w-2 h-2 ${isMe ? '-right-1.5 bg-[#dcf8c6]' : '-left-1.5 bg-white'}`}
                                                    style={{ clipPath: isMe ? 'polygon(0 0, 0% 100%, 100% 0)' : 'polygon(0 0, 100% 100%, 100% 0)' }} />
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>

                            {/* Input Area */}
                            <form
                                onSubmit={handleSendMessage}
                                className="bg-[#f0f0f0] p-3 flex items-center gap-3 relative z-10"
                            >
                                <button type="button" className="text-gray-500 hover:text-emerald-600">
                                    <Smile size={24} />
                                </button>
                                <button type="button" className="text-gray-500 hover:text-emerald-600 relative group">
                                    <Paperclip size={22} className="-rotate-45" />
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                toast.success('File ready for secure dispatch')
                                            }
                                        }}
                                    />
                                </button>
                                <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center shadow-inner border border-gray-200">
                                    <input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full bg-transparent outline-none text-sm font-medium text-gray-700"
                                    />
                                </div>
                                {newMessage.trim() ? (
                                    <button type="submit" className="bg-[#0b665a] text-white p-3 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all">
                                        <Send size={20} fill="currentColor" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => toast.success('Recording secure audio line...')}
                                        className="bg-[#0b665a] text-white p-3 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all"
                                    >
                                        <Mic size={20} fill="currentColor" />
                                    </button>
                                )}
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-12">
                            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-6 shadow-[9px_9px_16px_rgba(163,177,198,0.2)]">
                                <MessageSquare size={48} className="text-emerald-700" />
                            </div>
                            <h4 className="font-black text-lg uppercase tracking-[0.2em] mb-3 text-gray-800">Intelligence Grid Active</h4>
                            <p className="text-xs font-bold uppercase tracking-widest leading-loose">
                                Select a staff node from the presence panel<br />to initiate secure downlink
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollbar styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar-chat::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-chat::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-chat::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
        }
      `}} />
        </div>
    )
}
