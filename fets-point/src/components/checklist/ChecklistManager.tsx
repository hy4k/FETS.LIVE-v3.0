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
    ChevronRight,
    Search
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
    const [searchTerm, setSearchTerm] = useState('');
    const [historyFilterType, setHistoryFilterType] = useState<string>('all');

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
        );
    }

    if (view === 'analysis' && canAccessAnalysis) {
        return <ChecklistAnalysis currentUser={currentUser} onClose={() => setView('list')} />;
    }

    const filteredTemplates = templates.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const historyFiltered = history.filter(h => {
        const matchesSearch = h.checklist_templates?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.submitted_by_profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = historyFilterType === 'all' || h.checklist_templates?.type === historyFilterType;
        return matchesSearch && matchesType;
    });

    const groupedHistory = historyFiltered.reduce((acc: any, item) => {
        const dateKey = new Date(item.created_at).toISOString().split('T')[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a));

    return (
        <div className="min-h-screen -mt-32 pt-48 bg-[#e0e5ec] pb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <div className="max-w-[1600px] mx-auto px-6">
                {/* Executive Header */}
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
                                FETS <span className="text-amber-600">Protocols</span>
                            </h1>
                            <p className="text-lg text-gray-500 font-medium">Compliance & Operational Verification</p>
                        </div>
                    </div>
                </motion.div>

                {/* Toolbar */}
                <div className={`${neumorphicCard} p-4 mb-8 flex flex-col xl:flex-row items-center justify-between gap-6 sticky top-24 z-30`}>
                    <div className="flex items-center space-x-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                        <button
                            onClick={() => { setView('list'); setSearchTerm(''); }}
                            className={view === 'list' ? neumorphicBtnActive : neumorphicBtn}
                        >
                            <Layout size={18} />
                            <span>Templates</span>
                        </button>
                        <button
                            onClick={() => { setView('history'); setSearchTerm(''); }}
                            className={view === 'history' ? neumorphicBtnActive : neumorphicBtn}
                        >
                            <History size={18} />
                            <span>Logs</span>
                        </button>
                        {canAccessAnalysis && (
                            <button
                                onClick={() => setView('analysis')}
                                className={view === 'analysis' ? neumorphicBtnActive : neumorphicBtn}
                            >
                                <TrendingUp size={18} />
                                <span>Analysis</span>
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                        <div className={`flex-1 min-w-[280px] relative group ${neumorphicInset} px-4 py-2.5 flex items-center gap-3`}>
                            <Search size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder={view === 'history' ? "Search title or agent..." : "Search protocols..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 w-full placeholder:text-gray-400"
                            />
                        </div>

                        {view === 'history' && (
                            <div className="flex gap-1 p-1 bg-gray-200/50 rounded-xl overflow-x-auto scrollbar-hide">
                                {['all', 'pre_exam', 'post_exam', 'custom'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setHistoryFilterType(type)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${historyFilterType === type
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {type === 'all' ? 'All' : type === 'pre_exam' ? 'Start' : type === 'post_exam' ? 'End' : 'Custom'}
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setEditingTemplate(null);
                                setView('create');
                            }}
                            className="px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-amber-500 text-white flex items-center gap-2 hover:bg-amber-600 whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span>New Template</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="mt-12">
                    {view === 'list' ? (
                        <div className="space-y-16">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 opacity-50">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing Protocols...</p>
                                </div>
                            ) : filteredTemplates.length === 0 ? (
                                <div className={`${neumorphicCard} p-16 text-center shadow-inner`}>
                                    <Search size={48} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-xl font-black text-gray-700 uppercase">No Protocols Found</h3>
                                    <p className="text-gray-500 mt-2">Adjust search or initialize a new sequence.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Categorized Protocol Sections */}
                                    {['pre_exam', 'post_exam', 'custom'].map(type => {
                                        const typeTemplates = filteredTemplates.filter(t => (type === 'custom' ? t.type !== 'pre_exam' && t.type !== 'post_exam' : t.type === type));
                                        if (typeTemplates.length === 0) return null;

                                        const sectionMeta = {
                                            pre_exam: { title: 'Start Shift Protocols', sub: 'Hardware & facility verification', color: 'blue', icon: Play },
                                            post_exam: { title: 'End Shift Protocols', sub: 'Post-session reconciliation', color: 'purple', icon: CheckCircle2 },
                                            custom: { title: 'Ad-Hoc Operations', sub: 'Maintenance & specialized audits', color: 'amber', icon: Sparkles }
                                        }[type] as any;

                                        return (
                                            <div key={type} className="space-y-8">
                                                <div className="flex items-center gap-6">
                                                    <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-${sectionMeta.color}-100 text-${sectionMeta.color}-600 shadow-sm border border-${sectionMeta.color}-200`}>
                                                        <sectionMeta.icon size={24} className={type === 'pre_exam' ? 'fill-current' : ''} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h2 className={`text-xl font-black text-${sectionMeta.color}-600 uppercase tracking-[0.2em]`}>{sectionMeta.title}</h2>
                                                        <p className={`text-xs font-bold text-${sectionMeta.color}-400 uppercase tracking-widest mt-0.5`}>{sectionMeta.sub}</p>
                                                    </div>
                                                    <div className={`h-px flex-[2] bg-gradient-to-r from-${sectionMeta.color}-200 to-transparent`}></div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                                    {typeTemplates.map((template, idx) => (
                                                        <TemplateCard key={template.id} template={template} index={idx} onEdit={handleEditTemplate} onToggle={toggleStatus} onDelete={deleteTemplate} onFill={(t: any) => { setSubmittingTemplate(t); setShowFillModal(true); }} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    ) : view === 'history' ? (
                        <div className="space-y-12">
                            {historyLoading ? (
                                <div className="flex flex-col items-center justify-center py-24 opacity-50">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Retrieving Logs...</p>
                                </div>
                            ) : sortedDates.length === 0 ? (
                                <div className={`${neumorphicCard} p-24 text-center border-4 border-dashed border-gray-200/50 flex flex-col items-center justify-center`}>
                                    <div className="bg-gray-100 p-8 rounded-full mb-6">
                                        <History size={48} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-500 uppercase tracking-widest">No Operational History</h3>
                                    <p className="text-gray-400 mt-2 font-medium">Recordings for this query window are empty.</p>
                                </div>
                            ) : (
                                <div className="space-y-16">
                                    {sortedDates.map(date => (
                                        <div key={date} className="space-y-8">
                                            <div className="flex items-center gap-6">
                                                <div className="px-6 py-2 rounded-2xl bg-white shadow-sm border-2 border-gray-100">
                                                    <span className="text-sm font-black text-gray-700 uppercase tracking-widest">
                                                        {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="h-px w-full bg-gradient-to-r from-gray-200 to-transparent"></div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-6">
                                                {groupedHistory[date].map((submission: any, idx: number) => (
                                                    <HistoryItem key={submission.id} submission={submission} index={idx} onSelect={setSelectedSubmission} onDelete={deleteSubmission} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Submission Details Modal */}
                {selectedSubmission && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`${neumorphicCard} w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden bg-[#e0e5ec]`}
                        >
                            <div className="p-6 border-b border-white/20 flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-700 uppercase tracking-tight">Log Entry <span className="text-amber-600">Verification</span></h2>
                                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1">{selectedSubmission.checklist_templates?.title}</p>
                                </div>
                                <button onClick={() => setSelectedSubmission(null)} className={neumorphicIconBtn}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto flex-1 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff]">
                                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Agent Identity</span>
                                        <span className="block text-gray-700 font-bold text-lg">{selectedSubmission.submitted_by_profile?.full_name || 'N/A'}</span>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff]">
                                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Temporal Stamp</span>
                                        <span className="block text-gray-700 font-bold text-lg">{new Date(selectedSubmission.created_at).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-widest flex items-center gap-2 mb-6">
                                        <Activity size={12} className="text-amber-600" /> Recorded Responses
                                    </h3>
                                    {selectedSubmission.checklist_templates?.questions?.map((q: any, idx: number) => {
                                        const responses = selectedSubmission.answers?.responses || selectedSubmission.answers || {};
                                        const answer = responses[q.id];
                                        return (
                                            <div key={q.id || idx} className="p-5 rounded-2xl bg-[#e0e5ec] shadow-[5px_5px_10px_rgba(163,177,198,0.5),-5px_-5px_10px_rgba(255,255,255,0.6)] flex items-start gap-5">
                                                <div className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center text-gray-400 font-black text-sm shadow-sm border border-white/20">{(idx + 1).toString().padStart(2, '0')}</div>
                                                <div className="flex-1">
                                                    <p className="text-gray-700 font-bold mb-3">{q.text || q.title || `Question ${idx + 1}`}</p>
                                                    <div className="flex items-center gap-2">
                                                        {(answer === true || answer === 'Yes' || answer === 'Completed') ? (
                                                            <div className="px-4 py-1.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 shadow-sm">
                                                                <CheckCircle size={14} /> Confirmed / Verified
                                                            </div>
                                                        ) : (answer === false || answer === 'No' || answer === 'Incomplete') ? (
                                                            <div className="px-4 py-1.5 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 shadow-sm">
                                                                <X size={14} /> Failed / Attention Required
                                                            </div>
                                                        ) : (
                                                            <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold border border-blue-200/50">{String(answer || 'N/A')}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Execution Modal */}
                {showFillModal && submittingTemplate && (
                    <ChecklistFormModal
                        template={submittingTemplate}
                        onClose={() => { setShowFillModal(false); setSubmittingTemplate(null); }}
                        onSuccess={() => {
                            if (view === 'history') fetchHistory();
                            else fetchTemplates();
                        }}
                        currentUser={currentUser}
                    />
                )}
            </div>
        </div>
    );
};

// --- Sub-Components ---

const TemplateCard = ({ template, index, onEdit, onDelete, onFill }: {
    template: ChecklistTemplate;
    index: number;
    onEdit: (t: ChecklistTemplate) => void;
    onToggle: (id: string, s: boolean) => void;
    onDelete: (id: string) => void;
    onFill: (t: ChecklistTemplate) => void;
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
            className={`${neumorphicCard} p-6 relative flex flex-col h-full hover:shadow-[12px_12px_24px_#bec3c9,-12px_-12px_24px_#ffffff] transition-all duration-300 border-l-[6px] ${template.type === 'pre_exam' ? 'border-l-blue-500' : template.type === 'post_exam' ? 'border-l-purple-500' : 'border-l-amber-500'}`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${typeColor} flex items-center gap-1.5`}>
                    <ClipboardList size={10} /> {typeLabel}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onEdit(template)} className="p-2.5 rounded-xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-gray-500 hover:text-blue-600 transition-colors">
                        <Pencil size={13} />
                    </button>
                    <button onClick={() => onDelete(template.id)} className="p-2.5 rounded-xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            <h3 className="text-xl font-black text-gray-800 mb-3 leading-tight uppercase tracking-tight">{template.title}</h3>
            <p className="text-gray-500 text-xs mb-8 line-clamp-2 leading-relaxed h-[2.5rem]">{template.description || 'Verified operational procedure.'}</p>

            <div className="mt-auto space-y-5">
                <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
                    <div className="flex items-center gap-2">
                        <List size={12} className="text-gray-300" /> {template.questions?.length || 0} Steps
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shadow-sm ${template.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                        {template.is_active ? 'Online' : 'Offline'}
                    </div>
                </div>

                <button
                    onClick={() => onFill(template)}
                    disabled={!template.is_active}
                    className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] active:scale-95 ${template.is_active ? 'bg-gray-800 text-white hover:bg-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                    <Play size={14} className={template.is_active ? "text-amber-400" : ""} />
                    Begin Operation
                </button>
            </div>
        </motion.div>
    );
};

const HistoryItem = ({ submission, index, onSelect, onDelete }: {
    submission: ChecklistSubmission;
    index: number;
    onSelect: (s: ChecklistSubmission) => void;
    onDelete: (id: string) => void;
}) => {
    const typeLabel = submission.checklist_templates?.type === 'pre_exam' ? 'Start Shift' : submission.checklist_templates?.type === 'post_exam' ? 'End Shift' : 'Custom';
    const typeColor = submission.checklist_templates?.type === 'pre_exam' ? 'bg-blue-100 text-blue-700' :
        submission.checklist_templates?.type === 'post_exam' ? 'bg-purple-100 text-purple-700' :
            'bg-amber-100 text-amber-700';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="p-6 rounded-[2rem] bg-[#e0e5ec] shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] hover:bg-[#e6ebf1] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group border border-white/20"
        >
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                    <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border ${typeColor} shadow-sm`}>{typeLabel}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(submission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <h4 className="text-lg font-black text-gray-700 uppercase group-hover:text-blue-700 transition-colors tracking-tight">{submission.checklist_templates?.title}</h4>
                <div className="flex items-center gap-3 mt-3">
                    <div className="w-6 h-6 rounded-lg bg-white/50 flex items-center justify-center text-gray-400"><Users size={12} /></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Logged by: <span className="text-gray-800">{submission.submitted_by_profile?.full_name}</span></span>
                </div>
            </div>

            <div className="flex items-center gap-5">
                <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2.5 shadow-sm border border-white/20 ${submission.status === 'completed' || submission.status === 'submitted' ? 'bg-green-100/50 text-green-700' : 'bg-amber-100/50 text-amber-700'}`}>
                    {submission.status === 'completed' || submission.status === 'submitted' ? <CheckCircle size={16} /> : <Activity size={16} />}
                    {submission.status}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => onSelect(submission)} className="p-3.5 rounded-2xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-gray-500 hover:text-blue-600 transition-all hover:scale-105 active:scale-95">
                        <Eye size={20} />
                    </button>
                    <button onClick={() => onDelete(submission.id)} className="p-3.5 rounded-2xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-red-300 hover:text-red-500 transition-all hover:scale-105 active:scale-95">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ChecklistManager;
