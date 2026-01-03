import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface NotebookPage {
    id?: string;
    page_number: number;
    content: string;
}

export const DigitalNotebook: React.FC = () => {
    const { user } = useAuth();
    const [isOpened, setIsOpened] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pages, setPages] = useState<Record<number, NotebookPage>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchPages = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('user_notebook_pages')
            .select('*')
            .eq('user_id', user.id)
            .order('page_number', { ascending: true });

        if (error) {
            console.error('Error fetching pages:', error);
            toast.error('Failed to load notebook');
        } else {
            const pagesMap: Record<number, NotebookPage> = {};
            data?.forEach((page: any) => {
                pagesMap[page.page_number] = {
                    id: page.id,
                    page_number: page.page_number,
                    content: page.content,
                };
            });
            setPages(pagesMap);

            // If no pages exist, initialize page 1
            if (!pagesMap[1]) {
                setPages({
                    1: { page_number: 1, content: '' }
                });
            }
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    const savePageContent = async (pageNumber: number, content: string) => {
        if (!user) return;
        setSaving(true);

        const pageData = pages[pageNumber];

        const { error } = await supabase
            .from('user_notebook_pages')
            .upsert({
                user_id: user.id,
                page_number: pageNumber,
                content: content,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,page_number' });

        if (error) {
            console.error('Error saving page:', error);
            toast.error('Auto-save failed');
        }
        setSaving(false);
    };

    const handleContentChange = (content: string) => {
        setPages(prev => ({
            ...prev,
            [currentPage]: { ...prev[currentPage], content }
        }));

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            savePageContent(currentPage, content);
        }, 1000);
    };

    const nextPage = () => {
        const next = currentPage + 1;
        if (!pages[next]) {
            setPages(prev => ({
                ...prev,
                [next]: { page_number: next, content: '' }
            }));
        }
        setCurrentPage(next);
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-4xl mx-auto perspective-1000 h-[700px] flex items-center justify-center py-10">
            <AnimatePresence mode="wait">
                {!isOpened ? (
                    <motion.div
                        key="cover"
                        initial={{ rotateY: 0 }}
                        exit={{ rotateY: -110, transition: { duration: 0.8, ease: "easeInOut" } }}
                        onClick={() => setIsOpened(true)}
                        className="relative w-[450px] h-[600px] cursor-pointer group shadow-2xl rounded-r-lg overflow-hidden border-y border-r border-black/10"
                        style={{ transformOrigin: "left center" }}
                    >
                        {/* Spiral Binder Visual */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around py-4 z-20 bg-black/5">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="w-6 h-1 bg-gradient-to-r from-gray-400 to-gray-200 rounded-full shadow-sm ml-1" />
                            ))}
                        </div>

                        {/* Notebook Cover Content */}
                        <div className="absolute inset-0 bg-[#FFD700] flex flex-col p-10 items-center justify-between z-10">
                            <div className="w-full">
                                <p className="text-black font-bold tracking-[0.3em] text-sm mb-8 text-center">NOTEBOOK</p>

                                <div className="flex flex-col items-center mt-12">
                                    <div className="flex items-center gap-4">
                                        <div className="grid grid-cols-3 gap-1 mb-2">
                                            {[...Array(9)].map((_, i) => (
                                                <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#D93025', '#F9AB00', '#1A73E8', '#188038', '#A142F4', '#EA4335', '#FBBC04', '#4285F4', '#34A853'][i] }} />
                                            ))}
                                        </div>
                                        <h1 className="text-6xl font-black text-black tracking-tighter">forun</h1>
                                    </div>
                                    <div className="text-center mt-2 relative">
                                        <p className="font-bold text-sm tracking-widest text-[#333]">TESTING & EDUCATIONAL</p>
                                        <p className="font-bold text-sm tracking-widest text-[#333]">SERVICES</p>

                                        {/* Wavy dots decoration matching the branded image */}
                                        <div className="absolute -left-24 -right-24 top-16 flex justify-center items-center gap-1.5 overflow-hidden opacity-40 pointer-events-none">
                                            {[...Array(40)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                                                    style={{
                                                        backgroundColor: ['#D93025', '#F9AB00', '#1A73E8', '#188038', '#A142F4'][i % 5],
                                                        transform: `translateY(${Math.sin(i * 0.4) * 12}px)`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 w-full flex justify-center gap-4">
                                    <div className="h-[2px] w-12 bg-black/20" />
                                    <div className="flex gap-2">
                                        {[...Array(10)].map((_, i) => (
                                            <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#D93025', '#F9AB00', '#1A73E8', '#188038', '#A142F4'][i % 5] }} />
                                        ))}
                                    </div>
                                    <div className="h-[2px] w-12 bg-black/20" />
                                </div>
                            </div>

                            <div className="w-full text-center space-y-4">
                                <p className="text-[10px] font-black tracking-[0.2em] text-black">COCHIN • CALICUT • KANNUR</p>
                                <div className="flex justify-center items-center gap-6 opacity-80 scale-75">
                                    <span className="font-bold text-xs">Pearson VUE</span>
                                    <span className="font-bold text-xs italic">PROMETRIC</span>
                                    <span className="font-black text-xs border border-black px-1">psi</span>
                                </div>
                            </div>
                        </div>

                        {/* Shine/Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none z-20" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="pages"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-4xl h-full flex bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200"
                    >
                        {/* Spiral Binder (Center Binder) */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 flex flex-col justify-around py-4 z-30 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="w-8 h-2 bg-gradient-to-b from-gray-400 via-gray-200 to-gray-400 rounded-lg shadow-md" />
                            ))}
                        </div>

                        {/* Left Page (Reference Only or Previous Content) */}
                        <div className="flex-1 bg-slate-50 border-r border-gray-100 flex flex-col p-12 opacity-50 relative overflow-hidden">
                            <div className="absolute inset-0 pointer-events-none" style={{ background: "repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)", backgroundSize: "100% 32px", marginTop: "44px" }} />
                            <div className="absolute left-12 top-0 bottom-0 w-[1px] bg-red-200" />
                            <div className="relative z-10 font-medium text-gray-400 line-clamp-[20]">
                                {currentPage > 2 ? pages[currentPage - 2]?.content : "Previous page index..."}
                            </div>
                        </div>

                        {/* Right Page (Active Editor) */}
                        <div className="flex-1 bg-white flex flex-col relative overflow-hidden">
                            {/* Paper Lines */}
                            <div className="absolute inset-0 pointer-events-none" style={{
                                background: "repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)",
                                backgroundSize: "100% 32px",
                                marginTop: "44px"
                            }} />

                            {/* Vertical Margin Line */}
                            <div className="absolute left-12 top-0 bottom-0 w-[1px] bg-red-200" />

                            {/* Editor Header */}
                            <div className="relative z-20 flex justify-between items-center px-16 h-12 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page {currentPage}</span>
                                <div className="flex items-center gap-2">
                                    {saving && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                                    <span className="text-[10px] font-bold text-gray-300">Auto-saving...</span>
                                </div>
                            </div>

                            {/* Content Area */}
                            <textarea
                                value={pages[currentPage]?.content || ''}
                                onChange={(e) => handleContentChange(e.target.value)}
                                placeholder="Start writing..."
                                className="flex-1 relative z-10 bg-transparent resize-none p-16 pt-3 outline-none font-medium text-slate-700 leading-[32px] overflow-y-auto scrollbar-hide"
                                spellCheck={false}
                            />

                            {/* Navigation Controls */}
                            <div className="relative z-20 flex items-center justify-between px-10 py-6 bg-slate-50 border-t border-gray-100">
                                <button
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full hover:bg-white hover:shadow-md transition-all disabled:opacity-30 disabled:hover:shadow-none"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                                        <BookOpen size={14} className="text-yellow-500" />
                                        <span>Page {currentPage}</span>
                                    </div>
                                    <button onClick={() => setIsOpened(false)} className="text-[9px] font-black hover:text-yellow-600 transition-colors uppercase tracking-[0.2em] px-3">Close Binder</button>
                                </div>

                                <button
                                    onClick={nextPage}
                                    className="p-2 rounded-full hover:bg-white hover:shadow-md transition-all group"
                                >
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            {/* Texture Overlays */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                        </div>

                        {/* Page Curl/Fold Shadow Effect */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-16 -translate-x-1/2 bg-gradient-to-r from-black/5 via-transparent to-black/5 z-20 pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
        </div>
    );
};
