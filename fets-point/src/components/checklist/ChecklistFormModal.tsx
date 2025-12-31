import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Save, Clock, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChecklistTemplate, ChecklistSubmission } from '../../types/checklist';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ChecklistFormModalProps {
    template: ChecklistTemplate;
    onClose: () => void;
    onSuccess?: () => void;
    currentUser: any;
}

export const ChecklistFormModal: React.FC<ChecklistFormModalProps> = ({ template, onClose, onSuccess, currentUser }) => {
    const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm();
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const questions = template.questions;
    const totalSteps = questions.length;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    const neumorphicClass = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-3xl border border-white/20";
    const neumorphicInset = "bg-[#e0e5ec] shadow-[inset_6px_6px_10px_0_rgba(163,177,198,0.7),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] rounded-2xl border-none";
    const neumorphicBtn = "px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 active:shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] shadow-[6px_6px_10px_#bec3c9,-6px_-6px_10px_#ffffff] bg-[#e0e5ec] text-gray-700 hover:text-blue-600";
    const primaryBtn = "px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-[8px_8px_16px_rgba(37,99,235,0.2)] bg-blue-600 text-white hover:bg-blue-700";

    const nextStep = async () => {
        const currentQuestionId = questions[currentStep].id;
        const isValid = await trigger(currentQuestionId);
        if (isValid && currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            const submission: Partial<ChecklistSubmission> = {
                template_id: template.id,
                submitted_by: currentUser.user_id || currentUser.id,
                branch_id: currentUser.branch_assigned || currentUser.branch_id || null,
                submitted_at: new Date().toISOString(),
                answers: data,
                status: 'submitted'
            };

            const { error } = await supabase
                .from('checklist_submissions')
                .insert(submission);

            if (error) throw error;

            toast.success('Checklist submitted successfully!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error submitting checklist:', error);
            toast.error('Failed to submit checklist');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex flex-col bg-[#e0e5ec] md:bg-black/40 md:backdrop-blur-sm md:items-center md:justify-center p-0 md:p-4 overflow-hidden">
            <div className={`w-full md:max-w-2xl h-full md:h-auto md:max-h-[90vh] flex flex-col ${neumorphicClass} bg-[#e0e5ec] relative animate-in slide-in-from-bottom duration-500`}>

                {/* Progress Header */}
                <div className="p-6 md:p-8 border-b border-white/20">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex-1">
                            <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">{template.title}</h2>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Operational Protocol · Step {currentStep + 1} of {totalSteps}</p>
                        </div>
                        <button onClick={onClose} className="p-4 bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] rounded-2xl text-red-500 active:shadow-inner ml-4">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="h-4 w-full bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] rounded-full overflow-hidden p-1">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-lg"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 space-y-8">
                    {/* Current Question Block */}
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {questions.map((q, idx) => (
                            idx === currentStep && (
                                <div key={q.id} className="space-y-8">
                                    <div className="space-y-4 text-center md:text-left">
                                        <span className="inline-block px-4 py-2 bg-white/50 rounded-full text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Requirement Assessment</span>
                                        <h3 className="text-2xl md:text-3xl font-black text-gray-800 leading-tight">
                                            {q.text} {q.required && <span className="text-red-500">*</span>}
                                        </h3>
                                        {q.description && <p className="text-gray-500 text-sm font-medium leading-relaxed">{q.description}</p>}
                                    </div>

                                    <div className="py-2">
                                        {q.type === 'text' && (
                                            <textarea
                                                {...register(q.id, { required: q.required })}
                                                rows={4}
                                                className={`w-full p-6 ${neumorphicInset} outline-none bg-transparent text-lg font-bold text-gray-700 placeholder:opacity-30`}
                                                placeholder="Please provide a detailed response..."
                                            />
                                        )}

                                        {q.type === 'number' && (
                                            <input
                                                type="number"
                                                {...register(q.id, { required: q.required })}
                                                className={`w-full p-6 ${neumorphicInset} outline-none bg-transparent text-3xl font-black text-center text-blue-600`}
                                                placeholder="0.0"
                                            />
                                        )}

                                        {q.type === 'checkbox' && (
                                            <label className={`flex flex-col items-center justify-center p-12 transition-all cursor-pointer ${neumorphicClass} active:shadow-inner group`}>
                                                <input
                                                    type="checkbox"
                                                    {...register(q.id, { required: q.required })}
                                                    className="hidden peer"
                                                />
                                                <div className="w-24 h-24 mb-6 rounded-3xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#bec3c9,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center peer-checked:shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] transition-all">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-200 peer-checked:bg-green-500 transition-all flex items-center justify-center">
                                                        <Save className="text-white opacity-0 peer-checked:opacity-100 w-8 h-8" />
                                                    </div>
                                                </div>
                                                <span className="text-xl font-black text-gray-800 uppercase tracking-widest">Verify & Confirm</span>
                                                <span className="text-sm font-bold text-gray-400 mt-2">Tap to acknowledge completion</span>
                                            </label>
                                        )}

                                        {(q.type === 'dropdown') && (
                                            <select
                                                {...register(q.id, { required: q.required })}
                                                className={`w-full p-6 ${neumorphicInset} outline-none bg-transparent text-lg font-bold text-gray-700 appearance-none`}
                                            >
                                                <option value="">Choose standard response...</option>
                                                {q.options?.map((opt, i) => (
                                                    <option key={i} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        )}

                                        {q.type === 'radio' && (
                                            <div className="grid grid-cols-1 gap-4">
                                                {q.options?.map((opt, i) => (
                                                    <label key={i} className={`flex items-center p-6 cursor-pointer rounded-2xl transition-all ${watch(q.id) === opt ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-gray-700'}`}>
                                                        <input
                                                            type="radio"
                                                            value={opt}
                                                            {...register(q.id, { required: q.required })}
                                                            className="hidden"
                                                        />
                                                        <span className="text-lg font-bold">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === 'date' && (
                                            <input
                                                type="date"
                                                {...register(q.id, { required: q.required })}
                                                className={`w-full p-6 ${neumorphicInset} outline-none bg-transparent text-lg font-bold`}
                                            />
                                        )}

                                        {errors[q.id] && (
                                            <motion.span
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-500 text-xs font-black uppercase tracking-widest mt-4 block text-center"
                                            >
                                                Verification required before proceeding
                                            </motion.span>
                                        )}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                {/* Navigation Footer */}
                <div className="p-8 md:p-10 bg-[#e0e5ec] border-t border-white/20 sticky bottom-0">
                    <div className="flex gap-4">
                        {currentStep > 0 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                className={neumorphicBtn}
                            >
                                Back
                            </button>
                        )}

                        {currentStep < totalSteps - 1 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className={`${primaryBtn} flex-1 flex justify-center items-center gap-3`}
                            >
                                Next Step
                                <Clock size={20} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                disabled={submitting}
                                className={`${primaryBtn} flex-1 flex justify-center items-center gap-3 bg-green-600 hover:bg-green-700 shadow-green-900/20`}
                            >
                                {submitting ? 'Authenticating...' : (
                                    <>
                                        Finish & Execute
                                        <Save size={20} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
