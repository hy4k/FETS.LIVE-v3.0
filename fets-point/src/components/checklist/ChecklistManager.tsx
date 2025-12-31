import React, { useState, useEffect } from 'react';
import {
    Plus,
    List,
    History,
    Trash2,
    Power,
    CheckCircle,
    Activity,
    Eye,
    X,
    Users,
    ClipboardList,
    Pencil,
    Layout,
    CheckSquare,
    TrendingUp,
    Sparkles,
    CheckCircle2,
    Play,
    ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ChecklistCreator } from './ChecklistCreator';
import { ChecklistAnalysis } from './ChecklistAnalysis';
import { ChecklistFormModal } from './ChecklistFormModal';
import { ChecklistTemplate } from '../../types/checklist';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

// Add interface for history items
interface ChecklistSubmission {
    id: string;
    submitted_at: string;
    status: string;
    created_at: string;
    checklist_templates: {
        title: string;
        type: string;
        questions?: any;
    };
    submitted_by_profile: {
        full_name: string;
    };
    answers: any;
}

interface ChecklistManagerProps {
    currentUser: any;
}

export const ChecklistManager: React.FC<ChecklistManagerProps> = ({ currentUser }) => {
    const [view, setView] = useState<'list' | 'create' | 'history' | 'analysis'>('list');
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<ChecklistSubmission[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<ChecklistSubmission | null>(null);

    const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
    const [submittingTemplate, setSubmittingTemplate] = useState<ChecklistTemplate | null>(null);
    const [showFillModal, setShowFillModal] = useState(false);

    // Neumorphic Styles
    const neumorphicCard = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl border border-white/20";
    const neumorphicInset = "bg-[#e0e5ec] shadow-[inset_6px_6px_10px_0_rgba(163,177,198,0.7),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] rounded-xl border-none";
    const neumorphicBtn = "px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-gray-600 flex items-center gap-2 hover:text-blue-600";
    const neumorphicBtnActive = "px-6 py-2.5 rounded-xl font-bold transition-all shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-amber-600 flex items-center gap-2 transform scale-105";
    const neumorphicIconBtn = "p-3 rounded-full transition-all active:scale-95 shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] hover:text-blue-600";

    // Authorization Check - OPEN TO ALL as requested
    const canAccessAnalysis = true;

    useEffect(() => {
        if (view === 'history') {
            fetchHistory();
        } else {
            fetchTemplates();
        }
    }, [view]);

    const fetchTemplates = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('checklist_templates' as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load checklists');
        } else {
            setTemplates((data as any) || []);
        }
        setLoading(false);
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            // Fetch submissions with template details
            const { data: submissions, error } = await supabase
                .from('checklist_submissions')
                .select(`
                    *,
                    checklist_templates (
                        title,
                        type,
                        questions
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch profile names separately for each submission
            const submissionsWithProfiles = await Promise.all(
                (submissions || []).map(async (submission: any) => {
                    let profileName = 'Unknown User';
                    if (submission.submitted_by) {
                        const { data: profile } = await supabase
                            .from('staff_profiles')
                            .select('full_name')
                            .eq('user_id', submission.submitted_by)
                            .single();
                        if (profile?.full_name) {
                            profileName = profile.full_name;
                        }
                    }
                    return {
                        ...submission,
                        submitted_by_profile: { full_name: profileName }
                    };
                })
            );

            setHistory(submissionsWithProfiles as any);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to load history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('checklist_templates' as any)
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) {
            toast.error('Failed to update status');
        } else {
            toast.success(`Checklist ${!currentStatus ? 'enabled' : 'disabled'}`);
            fetchTemplates();
            queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
        }
    };

    const handleEditTemplate = (template: ChecklistTemplate) => {
        setEditingTemplate(template);
        setView('create');
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm('Are you sure? This will delete the template and ALL associated history/submissions. This cannot be undone.')) return;

        try {
            // 1. Delete submissions first
            const { error: subError } = await supabase
                .from('checklist_submissions')
                .delete()
                .eq('template_id', id);

            if (subError) throw new Error(`Submissions: ${subError.message}`);

            // 2. Now delete the template
            const { error } = await supabase
                .from('checklist_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Checklist and history deleted');
            fetchTemplates();
            queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
            if (view === 'history') fetchHistory();
        } catch (error: any) {
            console.error('Delete error details:', error);
            toast.error(`Failed to delete: ${error.message || 'It may have existing data'}`);
        }
    };


    const deleteSubmission = async (id: string) => {
        if (!confirm('Delete this submission record?')) return;

        const { error } = await supabase
            .from('checklist_submissions')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error(`Failed to delete record: ${error.message}`);
        } else {
            toast.success('Record deleted');
            fetchHistory();
        }
    };

    const queryClient = useQueryClient();

    if (view === 'create') {
        return (
            <div className="min-h-screen -mt-32 pt-48 bg-[#e0e5ec] pb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <div className="max-w-[1600px] mx-auto px-6">
                    <ChecklistCreator
                        onCancel={() => {
                            setView('list');
                            setEditingTemplate(null);
                        }}
                        onSuccess={() => {
                            setView('list');
                            setEditingTemplate(null);
                            fetchTemplates();
                            queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
                        }}
                        currentUser={currentUser}
                        initialData={editingTemplate}
                    />
                </div>
            </div>
        )
    }

    if (view === 'analysis' && canAccessAnalysis) {
        return <ChecklistAnalysis currentUser={currentUser} onClose={() => setView('list')} />;
    }

    return (
        <div className="min-h-screen -mt-32 pt-48 bg-[#e0e5ec] pb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {/* Functional Notification Banner Spacer */}
            <div className="h-6 -mx-8 -mt-12 mb-8"></div>

            <div className="max-w-[1600px] mx-auto px-6">
                {/* Executive Header - Neumorphic Style */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div className="flex items-center gap-6">
                        <div className="p-5 rounded-2xl bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] text-gray-700">
                            <ClipboardList size={42} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-700 mb-2 uppercase">
                                FETS <span className="text-gold-gradient">Checklists</span>
                            </h1>
                            <p className="text-lg text-gray-500 font-medium">
                                Operational Protocols & Compliance Management
                            </p>
                        </div>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Last Updated</p>
                        <p className="text-gray-600 font-bold uppercase tracking-wider text-sm">
                            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </motion.div>

                {/* Control Toolbar */}
                <div className={`${neumorphicCard} p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-24 z-30`}>
                    <div className="flex items-center space-x-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={() => setView('list')}
                            className={view === 'list' ? neumorphicBtnActive : neumorphicBtn}
                        >
                            <Layout size={18} />
                            <span>Templates</span>
                        </button>
                        <button
                            onClick={() => setView('history')}
                            className={view === 'history' ? neumorphicBtnActive : neumorphicBtn}
                        >
                            <History size={18} />
                            <span>Submission History</span>
                        </button>
                        {canAccessAnalysis && (
                            <button
                                onClick={() => setView('analysis')}
                                className={view === 'analysis' ? neumorphicBtnActive : neumorphicBtn}
                            >
                                <TrendingUp size={18} />
                                <span>Operation Analysis</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        {!(view === 'list' && templates.length === 0) && (
                            <button
                                onClick={() => {
                                    setEditingTemplate(null);
                                    setView('create');
                                }}
                                className="px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-amber-500 text-white flex items-center gap-2 hover:bg-amber-600 whitespace-nowrap"
                            >
                                <Plus size={18} />
                                <span>New Protocol</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="mt-12">
                    {view === 'list' && (
                        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 opacity-50">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accessing Protocols...</p>
                                </div>
                            ) : templates.length === 0 ? (
                                <div className={`col-span-full ${neumorphicCard} p-16 text-center flex flex-col items-center justify-center`}>
                                    <div className="bg-gray-200 rounded-full p-8 mb-6 shadow-inner">
                                        <CheckSquare size={56} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-700 mb-2 uppercase tracking-tight">System Core Empty</h3>
                                    <p className="text-gray-500 mb-8 max-w-md font-medium">No operational procedures have been established yet. Initialize your first protocol to begin tracking.</p>
                                    <button onClick={() => setView('create')} className="px-10 py-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95">
                                        Initialize Protocol
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* PRE-EXAM PROTOCOLS */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 shadow-sm border border-blue-200">
                                                <Play size={24} className="fill-current" />
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-xl font-black text-blue-600 uppercase tracking-[0.2em]">Start Shift Protocols</h2>
                                                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-0.5">Mandatory pre-exam hardware & centre verification</p>
                                            </div>
                                            <div className="h-px flex-[2] bg-gradient-to-r from-blue-200 to-transparent"></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                            {templates.filter(t => t.type === 'pre_exam').map((template, index) => (
                                                <TemplateCard key={template.id} template={template} index={index} onEdit={handleEditTemplate} onToggle={toggleStatus} onDelete={deleteTemplate} onFill={(t) => { setSubmittingTemplate(t); setShowFillModal(true); }} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* POST-EXAM PROTOCOLS */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 shadow-sm border border-purple-200">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-xl font-black text-purple-600 uppercase tracking-[0.2em]">End Shift Protocols</h2>
                                                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mt-0.5">Post-session reconciliation & power-down procedures</p>
                                            </div>
                                            <div className="h-px flex-[2] bg-gradient-to-r from-purple-200 to-transparent"></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                            {templates.filter(t => t.type === 'post_exam').map((template, index) => (
                                                <TemplateCard key={template.id} template={template} index={index} onEdit={handleEditTemplate} onToggle={toggleStatus} onDelete={deleteTemplate} onFill={(t) => { setSubmittingTemplate(t); setShowFillModal(true); }} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* CUSTOM OPERATIONS */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 shadow-sm border border-amber-200">
                                                <Sparkles size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-xl font-black text-amber-600 uppercase tracking-[0.2em]">Ad-Hoc / Custom Ops</h2>
                                                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-0.5">Maintenance, facility audits & specialized checklists</p>
                                            </div>
                                            <div className="h-px flex-[2] bg-gradient-to-r from-amber-200 to-transparent"></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                            {templates.filter(t => (t.type !== 'pre_exam' && t.type !== 'post_exam')).map((template, index) => (
                                                <TemplateCard key={template.id} template={template} index={index} onEdit={handleEditTemplate} onToggle={toggleStatus} onDelete={deleteTemplate} onFill={(t) => { setSubmittingTemplate(t); setShowFillModal(true); }} />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {view === 'history' && (
                        <div className="space-y-12 animate-in fade-in duration-500">
                            {/* CONNECTED ANALYSIS INSIGHT BLOCK */}
                            {history.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`${neumorphicCard} p-10 border-t-4 border-t-amber-500 bg-gradient-to-br from-[#e0e5ec] to-[#d1d9e6]`}
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
                                                <TrendingUp className="text-amber-600" size={28} /> Operational Intelligence
                                            </h3>
                                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1 leading-relaxed">
                                                Analyzing <span className="text-gray-800">{history.length}</span> compliance records for today's active window.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setView('analysis')}
                                            className="px-8 py-3 rounded-xl bg-gray-800 text-amber-400 font-black uppercase tracking-widest text-xs shadow-lg hover:bg-black transition-all flex items-center gap-3 group"
                                        >
                                            Launch Analytics Core <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                        <div className={`${neumorphicInset} p-5 flex flex-col items-center text-center`}>
                                            <span className="text-3xl font-black text-blue-600">{history.filter(h => h.checklist_templates?.type === 'pre_exam').length}</span>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Start Logs</span>
                                        </div>
                                        <div className={`${neumorphicInset} p-5 flex flex-col items-center text-center`}>
                                            <span className="text-3xl font-black text-purple-600">{history.filter(h => h.checklist_templates?.type === 'post_exam').length}</span>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Completion Logs</span>
                                        </div>
                                        <div className={`${neumorphicInset} p-5 flex flex-col items-center text-center`}>
                                            <span className="text-3xl font-black text-amber-600">{history.filter(h => (h.checklist_templates?.type !== 'pre_exam' && h.checklist_templates?.type !== 'post_exam')).length}</span>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Ad-Hoc Logs</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {historyLoading ? (
                                <div className="flex flex-col items-center justify-center py-24 opacity-50">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Decrypting Records...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                                    <History className="w-16 h-16 mb-6 text-gray-300" />
                                    <h3 className="text-xl font-black text-gray-600 uppercase tracking-tight">No Operational Footprint</h3>
                                    <p className="font-medium mt-2">Submission history for this window is blank.</p>
                                </div>
                            ) : (
                                <div className="space-y-16">
                                    {/* PRE-EXAM HISTORY */}
                                    {history.filter(h => h.checklist_templates?.type === 'pre_exam').length > 0 && (
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-6">
                                                <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em] whitespace-nowrap">Shift Initiation Log</h2>
                                                <div className="h-px w-full bg-gradient-to-r from-blue-200 via-blue-100 to-transparent"></div>
                                            </div>
                                            <div className="space-y-4">
                                                {history.filter(h => h.checklist_templates?.type === 'pre_exam').map((submission, index) => (
                                                    <HistoryItem key={submission.id} submission={submission} index={index} onSelect={setSelectedSubmission} onDelete={deleteSubmission} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* POST-EXAM HISTORY */}
                                    {history.filter(h => h.checklist_templates?.type === 'post_exam').length > 0 && (
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-6">
                                                <h2 className="text-sm font-black text-purple-500 uppercase tracking-[0.3em] whitespace-nowrap">Completion Archive</h2>
                                                <div className="h-px w-full bg-gradient-to-r from-purple-200 via-purple-100 to-transparent"></div>
                                            </div>
                                            <div className="space-y-4">
                                                {history.filter(h => h.checklist_templates?.type === 'post_exam').map((submission, index) => (
                                                    <HistoryItem key={submission.id} submission={submission} index={index} onSelect={setSelectedSubmission} onDelete={deleteSubmission} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* CUSTOM HISTORY */}
                                    {history.filter(h => (h.checklist_templates?.type !== 'pre_exam' && h.checklist_templates?.type !== 'post_exam')).length > 0 && (
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-6">
                                                <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] whitespace-nowrap">Special Operations Journal</h2>
                                                <div className="h-px w-full bg-gradient-to-r from-amber-200 via-amber-100 to-transparent"></div>
                                            </div>
                                            <div className="space-y-4">
                                                {history.filter(h => (h.checklist_templates?.type !== 'pre_exam' && h.checklist_templates?.type !== 'post_exam')).map((submission, index) => (
                                                    <HistoryItem key={submission.id} submission={submission} index={index} onSelect={setSelectedSubmission} onDelete={deleteSubmission} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Submission Details Modal */}
                {selectedSubmission && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`${neumorphicCard} w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden bg-[#e0e5ec]`}
                        >
                            <div className="p-6 border-b border-white/20 flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-700">Submission Details</h2>
                                    <p className="text-gray-500 font-medium text-sm mt-1">
                                        {selectedSubmission.checklist_templates?.title}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedSubmission(null)}
                                    className={neumorphicIconBtn}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff]">
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Submitted By</span>
                                        <span className="block text-gray-700 font-bold">{selectedSubmission.submitted_by_profile?.full_name || 'N/A'}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff]">
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Date</span>
                                        <span className="block text-gray-700 font-bold">{new Date(selectedSubmission.created_at).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Questions & Answers - Mapping through template questions to preserve order and text */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-600 uppercase text-xs tracking-widest mb-2">Response Data</h3>
                                    {selectedSubmission.checklist_templates && selectedSubmission.checklist_templates.questions ? (
                                        (selectedSubmission.checklist_templates.questions as any[]).map((question: any, idx: number) => {
                                            const responses = selectedSubmission.answers?.responses || selectedSubmission.answers || {};
                                            const answer = responses[question.id];
                                            return (
                                                <div key={question.id || idx} className="p-4 rounded-xl bg-[#e0e5ec] shadow-[6px_6px_10px_rgba(163,177,198,0.5),-6px_-6px_10px_rgba(255,255,255,0.6)]">
                                                    <div className="flex gap-4">
                                                        <span className="text-gray-400 font-black text-lg opacity-30">#{idx + 1}</span>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-gray-700 mb-1">
                                                                {(() => {
                                                                    const text = question.text || question.title || '';
                                                                    // If text is just a UUID/Hash, try to show a cleaner label
                                                                    if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(text) || /^[0-9a-f]{20,}/i.test(text)) return `Question ${idx + 1}`;
                                                                    return text;
                                                                })()}
                                                            </p>
                                                            <div className="text-gray-700 font-medium">
                                                                {answer === undefined || answer === null || answer === '' ? (
                                                                    <span className="text-gray-400 italic text-sm">No response</span>
                                                                ) : (answer === true || answer === 'Yes' || answer === 'Completed') ? (
                                                                    <span className="text-green-600 font-bold flex items-center gap-1 text-sm"><CheckCircle size={14} /> {String(answer).toUpperCase() === 'TRUE' ? 'YES / COMPLETED' : String(answer).toUpperCase()}</span>
                                                                ) : (answer === false || answer === 'No' || answer === 'Incomplete') ? (
                                                                    <span className="text-red-500 font-bold flex items-center gap-1 text-sm"><X size={14} /> {String(answer).toUpperCase() === 'FALSE' ? 'NO / INCOMPLETE' : String(answer).toUpperCase()}</span>
                                                                ) : (
                                                                    <span className="text-sm text-gray-600 bg-white/50 px-2 py-1 rounded inline-block">{String(answer)}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-4 text-gray-400 italic">No template questions found</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Checklist Execution Modal */}
                {showFillModal && submittingTemplate && (
                    <ChecklistFormModal
                        template={submittingTemplate}
                        onClose={() => {
                            setShowFillModal(false);
                            setSubmittingTemplate(null);
                        }}
                        onSuccess={() => {
                            if (view === 'history') fetchHistory();
                            else if (view === 'list') fetchTemplates();
                        }}
                        currentUser={currentUser}
                    />
                )}
            </div>
        </div>
    );
};

// --- Sub-Components ---

const TemplateCard = ({ template, index, onEdit, onToggle, onDelete, onFill }: {
    template: ChecklistTemplate;
    index: number;
    onEdit: (t: any) => void;
    onToggle: (id: string, s: boolean) => void;
    onDelete: (id: string) => void;
    onFill: (t: any) => void;
}) => {
    const neumorphicCard = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl border border-white/20";
    const typeLabel = template.type === 'pre_exam' ? 'Start Shift' : template.type === 'post_exam' ? 'End Shift' : 'Custom';
    const typeColor = template.type === 'pre_exam' ? 'bg-blue-100/50 text-blue-700 border-blue-200' :
        template.type === 'post_exam' ? 'bg-purple-100/50 text-purple-700 border-purple-200' :
            'bg-amber-100/50 text-amber-700 border-amber-200';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`${neumorphicCard} p-6 relative group flex flex-col h-full hover:shadow-[12px_12px_24px_#bec3c9,-12px_-12px_24px_#ffffff] transition-all duration-300 border-l-[6px] ${template.type === 'pre_exam' ? 'border-l-blue-500' : template.type === 'post_exam' ? 'border-l-purple-500' : 'border-l-amber-500'}`}
        >
            <div className="flex justify-between items-start mb-4 relative z-20">
                <div
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border ${typeColor} flex items-center gap-2`}
                >
                    <ClipboardList size={12} /> {typeLabel}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(template)}
                        className="p-2 rounded-lg transition-all active:scale-95 shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.6)] bg-[#e0e5ec] hover:text-blue-600 text-gray-500"
                        title="Edit Template"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(template.id)}
                        className="p-2 rounded-lg text-red-400 transition-all active:scale-95 shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.6)] bg-[#e0e5ec] hover:text-red-600"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <h3 className="text-xl font-black text-gray-800 mb-2 leading-tight uppercase tracking-tight">{template.title}</h3>
            <p className="text-gray-500 text-xs mb-6 line-clamp-2 leading-relaxed h-8">
                {template.description || 'Continuous operational performance monitoring.'}
            </p>

            <div className="mt-auto space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <List size={12} />
                        <span>{template.questions.length} STEPS</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${template.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span>{template.is_active ? 'Online' : 'Disabled'}</span>
                    </div>
                </div>

                <button
                    onClick={() => onFill(template)}
                    disabled={!template.is_active}
                    className={`w-full py-3 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 active:scale-95 shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.6)] 
                        ${template.is_active
                            ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:shadow-lg'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <Play size={14} className={template.is_active ? "text-amber-400" : ""} />
                    Begin Protocol
                </button>
            </div>

            {!template.is_active && (
                <div className="absolute inset-0 bg-gray-200/40 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/80 px-4 py-2 rounded-lg font-black text-gray-400 text-[10px] tracking-widest border border-gray-100 uppercase transform -rotate-12 shadow-sm">
                        Deactivated
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const HistoryItem = ({ submission, index, onSelect, onDelete }: {
    submission: any;
    index: number;
    onSelect: (s: any) => void;
    onDelete: (id: string) => void;
}) => {
    const neuIconBtn = "p-3 rounded-full transition-all active:scale-95 shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] hover:text-blue-600";
    const typeLabel = submission.checklist_templates?.type === 'pre_exam' ? 'Start Shift' : submission.checklist_templates?.type === 'post_exam' ? 'End Shift' : 'Custom';
    const typeColor = submission.checklist_templates?.type === 'pre_exam' ? 'bg-blue-100 text-blue-700' :
        submission.checklist_templates?.type === 'post_exam' ? 'bg-purple-100 text-purple-700' :
            'bg-amber-100 text-amber-700';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="p-5 rounded-xl bg-[#e0e5ec] shadow-[inset_5px_5px_10px_rgba(163,177,198,0.6),inset_-5px_-5px_10px_rgba(255,255,255,0.5)] hover:bg-[#e6ebf1] transition-colors border border-transparent hover:border-white/40 group overflow-hidden"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${typeColor}`}>
                            {typeLabel}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {new Date(submission.submitted_at || submission.created_at).toLocaleString()}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 group-hover:text-blue-700 transition-colors uppercase tracking-tight">
                        {submission.checklist_templates?.title || 'Unknown Protocol'}
                    </h3>
                    <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-2">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>Log by: <span className="text-gray-700">{submission.submitted_by_profile?.full_name || 'Unknown Agent'}</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 shadow-sm ${submission.status === 'completed' || submission.status === 'submitted' ? 'bg-green-100/50 text-green-700' : 'bg-yellow-100/50 text-yellow-700'}`}>
                        {submission.status === 'completed' || submission.status === 'submitted' ? <CheckCircle size={16} /> : <Activity size={16} />}
                        <span>{submission.status}</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => onSelect(submission)}
                            className={neuIconBtn}
                            title="View Details"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onDelete(submission.id)}
                            className={`${neuIconBtn} text-red-500 hover:text-red-700`}
                            title="Delete Submission"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
