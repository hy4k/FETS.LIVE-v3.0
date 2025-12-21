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
    CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ChecklistCreator } from './ChecklistCreator';
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
    const [view, setView] = useState<'list' | 'create' | 'history'>('list');
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<ChecklistSubmission[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<ChecklistSubmission | null>(null);

    const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);

    // Neumorphic Styles
    const neumorphicCard = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl border border-white/20";
    const neumorphicBtn = "px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-gray-600 flex items-center gap-2 hover:text-blue-600";
    const neumorphicBtnActive = "px-6 py-2.5 rounded-xl font-bold transition-all shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-amber-600 flex items-center gap-2";
    const neumorphicIconBtn = "p-3 rounded-full transition-all active:scale-95 shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] hover:text-blue-600";

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
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                        <button
                            onClick={() => {
                                setEditingTemplate(null);
                                setView('create');
                            }}
                            className="px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-amber-500 text-white flex items-center gap-2 hover:bg-amber-600"
                        >
                            <Plus size={18} />
                            <span>Create New Protocol</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                {view === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {loading ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                                <p className="text-gray-500 font-medium">Loading protocols...</p>
                            </div>
                        ) : templates.length === 0 ? (
                            <div className={`col-span-full ${neumorphicCard} p-12 text-center flex flex-col items-center justify-center`}>
                                <div className="bg-gray-200 rounded-full p-6 mb-4">
                                    <CheckSquare size={48} className="text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-600 mb-2">No Active Protocols</h3>
                                <p className="text-gray-500 mb-6">Get started by creating your first checklist template.</p>
                                <button onClick={() => setView('create')} className="px-6 py-3 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-colors">
                                    Create First Checklist
                                </button>
                            </div>
                        ) : (
                            templates.map((template, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={template.id}
                                    className={`${neumorphicCard} p-6 relative group overflow-hidden hover:shadow-[12px_12px_24px_#bec3c9,-12px_-12px_24px_#ffffff] transition-shadow duration-300`}
                                >
                                    {/* Top Status Bar */}
                                    {/* Raise z-index to 20 to be clickable above the disabled overlay */}
                                    <div className="flex justify-between items-start mb-6 relative z-20">
                                        <div className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-inner ${template.type === 'pre_exam' ? 'bg-blue-100/50 text-blue-700' :
                                            template.type === 'post_exam' ? 'bg-purple-100/50 text-purple-700' :
                                                'bg-orange-100/50 text-orange-700'
                                            }`}>
                                            {template.type.replace('_', ' ')}
                                        </div>
                                        <div className="flex gap-3">
                                            {/* Edit Button */}
                                            <button
                                                onClick={() => handleEditTemplate(template)}
                                                className={`p-2 rounded-lg transition-all active:scale-95 shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.6)] bg-[#e0e5ec] hover:text-blue-600`}
                                                title="Edit Template"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(template.id, template.is_active)}
                                                className={`p-2 rounded-lg transition-all active:scale-95 shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.6)] ${template.is_active ? 'text-green-600 bg-[#e0e5ec]' : 'text-gray-400 bg-[#e0e5ec]'}`}
                                                title={template.is_active ? "Active" : "Disabled"}
                                            >
                                                <Power size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteTemplate(template.id)}
                                                className="p-2 rounded-lg text-red-500 transition-all active:scale-95 shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.6)] bg-[#e0e5ec] hover:text-red-700"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-gray-700 mb-3 leading-tight">{template.title}</h3>
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed min-h-[3rem]">
                                        {template.description || 'No description provided for this protocol.'}
                                    </p>

                                    <div className="flex items-center justify-between pt-5 border-t border-gray-200/50 mt-auto">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                            <List size={16} />
                                            <span>{template.questions.length} Steps</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 bg-gray-200/50 px-2 py-1 rounded">
                                            {new Date(template.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {!template.is_active && (
                                        <div className="absolute inset-0 bg-gray-200/60 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none">
                                            <div className="bg-white/90 px-6 py-3 rounded-xl font-black text-gray-500 shadow-xl border border-gray-100 flex items-center gap-2 transform -rotate-12">
                                                <Power size={20} /> DISABLED
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {view === 'history' && (
                    <div className={`${neumorphicCard} p-8 min-h-[600px]`}>
                        {historyLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                                <p className="text-gray-500 font-medium">Loading history records...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                <History className="w-16 h-16 mb-6 text-gray-300" />
                                <h3 className="text-xl font-bold mb-2">No Records Found</h3>
                                <p>There are no checklist submissions to display.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((submission, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        key={submission.id}
                                        className="p-5 rounded-xl bg-[#e0e5ec] shadow-[inset_5px_5px_10px_rgba(163,177,198,0.6),inset_-5px_-5px_10px_rgba(255,255,255,0.5)] hover:bg-[#e6ebf1] transition-colors border border-transparent hover:border-white/40 group"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${submission.checklist_templates?.type === 'pre_exam' ? 'bg-blue-200 text-blue-800' :
                                                        submission.checklist_templates?.type === 'post_exam' ? 'bg-purple-200 text-purple-800' :
                                                            'bg-orange-200 text-orange-800'
                                                        }`}>
                                                        {submission.checklist_templates?.type?.replace('_', ' ') || 'SYSTEM'}
                                                    </span>
                                                    <span className="text-xs font-mono text-gray-400">
                                                        {new Date(submission.submitted_at || submission.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-700 group-hover:text-blue-700 transition-colors">
                                                    {submission.checklist_templates?.title || 'Unknown Protocol'}
                                                </h3>
                                                <div className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-600">{submission.submitted_by_profile?.full_name || 'Unknown Agent'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm ${submission.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {submission.status === 'completed' ? <CheckCircle size={18} /> : <Activity size={18} />}
                                                    <span className="uppercase tracking-wide">{submission.status}</span>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setSelectedSubmission(submission)}
                                                        className={neumorphicIconBtn}
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSubmission(submission.id)}
                                                        className={`${neumorphicIconBtn} text-red-500 hover:text-red-700`}
                                                        title="Delete Submission"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
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
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
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
                                {selectedSubmission.checklist_templates && (selectedSubmission.checklist_templates as any).questions ? (
                                    ((selectedSubmission.checklist_templates as any).questions as any[]).map((question: any, idx: number) => {
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
        </div>
    );
};
