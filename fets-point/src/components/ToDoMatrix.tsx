import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CheckCircle2,
    Circle,
    Trash2,
    Edit3,
    Plus,
    AlertCircle,
    Clock,
    Coffee,
    Zap,
    Check,
    X
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'

interface TodoTask {
    id: string
    content: string
    is_completed: boolean
    quadrant: 'must' | 'should' | 'could' | 'time'
    created_at: string
}

const quadrantConfigs = {
    must: {
        title: 'Must Do',
        subtitle: 'Urgent & Important',
        color: 'bg-[#fff1f1]',
        textColor: 'text-red-700',
        borderColor: 'border-red-100',
        icon: Zap,
        accent: 'bg-red-500'
    },
    should: {
        title: 'Should Do',
        subtitle: 'Important, Not Urgent',
        color: 'bg-[#f1f4ff]',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-100',
        icon: AlertCircle,
        accent: 'bg-blue-500'
    },
    could: {
        title: 'Could Do',
        subtitle: 'Urgent, Not Important',
        color: 'bg-[#f1fff5]',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-100',
        icon: Clock,
        accent: 'bg-emerald-500'
    },
    time: {
        title: 'If I Have Time',
        subtitle: 'Maintenance & Others',
        color: 'bg-[#faf1ff]',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-100',
        icon: Coffee,
        accent: 'bg-purple-500'
    }
}

export function ToDoMatrix() {
    const { user } = useAuth()
    const [tasks, setTasks] = useState<TodoTask[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [newTasks, setNewTasks] = useState({
        must: '',
        should: '',
        could: '',
        time: ''
    })

    useEffect(() => {
        if (user) {
            fetchTasks()
        }
    }, [user])

    const fetchTasks = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('user_todo_matrix')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: true })

            if (error) {
                if (error.code === '42P01') {
                    console.warn('Table user_todo_matrix does not exist. Using local state.')
                    return
                }
                throw error
            }
            if (data) setTasks(data)
        } catch (err) {
            console.error('Error fetching tasks:', err)
        } finally {
            setLoading(false)
        }
    }

    const addTask = async (quadrant: 'must' | 'should' | 'could' | 'time') => {
        const content = newTasks[quadrant].trim()
        if (!content) return

        const tempId = Math.random().toString(36).substr(2, 9)
        const newTaskObj: TodoTask = {
            id: tempId,
            content,
            is_completed: false,
            quadrant,
            created_at: new Date().toISOString()
        }

        setTasks(prev => [...prev, newTaskObj])
        setNewTasks(prev => ({ ...prev, [quadrant]: '' }))

        try {
            const { data, error } = await supabase
                .from('user_todo_matrix')
                .insert([{
                    user_id: user?.id,
                    content,
                    quadrant,
                    is_completed: false
                }])
                .select()

            if (error) throw error
            if (data?.[0]) {
                setTasks(prev => prev.map(t => t.id === tempId ? data[0] : t))
            }
        } catch (err) {
            console.error('Error adding task:', err)
        }
    }

    const toggleTask = async (task: TodoTask) => {
        const updatedStatus = !task.is_completed
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: updatedStatus } : t))

        try {
            await supabase
                .from('user_todo_matrix')
                .update({ is_completed: updatedStatus })
                .eq('id', task.id)
        } catch (err) {
            console.error('Error toggling task:', err)
        }
    }

    const deleteTask = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id))
        try {
            await supabase
                .from('user_todo_matrix')
                .delete()
                .eq('id', id)
        } catch (err) {
            console.error('Error deleting task:', err)
        }
    }

    const startEditing = (task: TodoTask) => {
        setEditingId(task.id)
        setEditValue(task.content)
    }

    const saveEdit = async (id: string) => {
        if (!editValue.trim()) {
            setEditingId(null)
            return
        }
        setTasks(prev => prev.map(t => t.id === id ? { ...t, content: editValue } : t))
        setEditingId(null)

        try {
            await supabase
                .from('user_todo_matrix')
                .update({ content: editValue })
                .eq('id', id)
        } catch (err) {
            console.error('Error saving edit:', err)
        }
    }

    const renderTask = (task: TodoTask) => (
        <motion.div
            layout
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group flex items-center gap-3 py-3 px-2 border-b border-black/5 hover:bg-black/5 transition-colors relative"
        >
            <button
                onClick={() => toggleTask(task)}
                className={`transition-all transform hover:scale-110 flex-shrink-0 ${task.is_completed ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-400'}`}
            >
                {task.is_completed ? <CheckCircle2 size={20} className="fill-emerald-50" /> : <Circle size={20} />}
            </button>

            {editingId === task.id ? (
                <div className="flex-1 flex items-center gap-2">
                    <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(task.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(task.id)
                            if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 bg-white shadow-sm border border-blue-200 rounded px-2 py-1 text-sm font-bold text-gray-700 outline-none"
                    />
                </div>
            ) : (
                <span
                    className={`flex-1 text-sm font-bold tracking-tight uppercase transition-all ${task.is_completed ? 'text-gray-400/60 line-through' : 'text-gray-700'
                        } cursor-text`}
                    onDoubleClick={() => startEditing(task)}
                >
                    {task.content}
                </span>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                    onClick={() => startEditing(task)}
                    className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-blue-500 transition-all"
                >
                    <Edit3 size={14} />
                </button>
                <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-red-500 transition-all"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </motion.div>
    )

    const renderQuadrant = (quad: 'must' | 'should' | 'could' | 'time') => {
        const config = quadrantConfigs[quad]
        const quadTasks = tasks.filter(t => t.quadrant === quad)
        const Icon = config.icon

        return (
            <div className={`${config.color} p-6 border-[0.5px] ${config.borderColor} flex flex-col min-h-[300px] relative overflow-hidden group/quad`}>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${config.accent} text-white shadow-lg`}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${config.textColor}`}>
                                {config.title}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {config.subtitle}
                            </p>
                        </div>
                    </div>
                    <motion.div
                        initial={false}
                        animate={{ scale: [1, 1.2, 1] }}
                        key={quadTasks.length}
                        className={`text-xs font-black ${config.textColor} bg-white/50 px-2 py-1 rounded-lg border border-white/50`}
                    >
                        {quadTasks.length}
                    </motion.div>
                </div>

                <div className="flex-1 flex flex-col relative z-10">
                    <div className="mb-6">
                        <div className="relative group/input">
                            <input
                                type="text"
                                placeholder="Type here to add task..."
                                value={newTasks[quad]}
                                onChange={(e) => setNewTasks({ ...newTasks, [quad]: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') addTask(quad)
                                }}
                                className={`w-full bg-white/40 border-b-2 ${config.borderColor} hover:border-gray-400 focus:border-gray-500 focus:bg-white/80 outline-none py-3 px-4 text-sm font-bold text-gray-700 placeholder:text-gray-400/60 placeholder:italic transition-all rounded-t-xl`}
                            />
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => addTask(quad)}
                                className={`absolute right-3 bottom-3 p-1.5 rounded-lg ${config.accent} text-white shadow-md transition-all ${newTasks[quad] ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
                            >
                                <Plus size={16} />
                            </motion.button>
                        </div>
                    </div>

                    <div className="space-y-0 overflow-y-auto max-h-[250px] custom-scrollbar pr-2 flex-1">
                        <AnimatePresence initial={false}>
                            {quadTasks.map(renderTask)}
                        </AnimatePresence>
                        {quadTasks.length === 0 && !newTasks[quad] && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-black/5 rounded-2xl bg-white/20"
                            >
                                <div className="p-3 bg-white/50 rounded-full mb-2">
                                    <Plus size={20} className="text-gray-300" />
                                </div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Empty Matrix</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    if (loading && tasks.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-white rounded-3xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden rounded-3xl shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]">
            <div className="flex-1 grid grid-cols-2">
                {renderQuadrant('must')}
                {renderQuadrant('should')}
                {renderQuadrant('could')}
                {renderQuadrant('time')}
            </div>

            <div className="bg-gray-50/50 p-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Urgent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Important</span>
                    </div>
                </div>
                <div className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">
                    Priority Matrix System v4.0
                </div>
            </div>
        </div>
    )
}
