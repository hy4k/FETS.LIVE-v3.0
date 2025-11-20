import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Megaphone, AlertTriangle, Info, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBranch } from '../hooks/useBranch';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  id: string;
  content: string;
  priority: 'normal' | 'high';
  branch_location: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function NewsTickerBar() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const { activeBranch } = useBranch();

  useEffect(() => {
    fetchActiveNews();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('news_updates_ticker')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_updates'
        },
        () => {
          fetchActiveNews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBranch]);

  const fetchActiveNews = async () => {
    try {
      const now = new Date().toISOString();
      const branchName = activeBranch || 'calicut';

      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('priority', { ascending: false }) // High priority first
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by branch - branch_location is now a single string
      const filteredNews = (data || []).filter(item =>
        item.branch_location === branchName || item.branch_location === 'global'
      );

      setNewsItems(filteredNews as NewsItem[]);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const isNew = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  };

  if (newsItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-900/90 backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Glassy Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        <div className="flex items-stretch">
          {/* Live Badge Section */}
          <div className="relative z-10 flex items-center px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="w-5 h-5 text-white animate-pulse" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-ping" />
              </div>
              <span className="text-white font-black text-sm tracking-widest uppercase hidden sm:block">
                FETS LIVE
              </span>
            </div>
            {/* Angled Divider */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-pink-600 to-transparent translate-x-full" />
          </div>

          {/* Ticker Content */}
          <div
            className="flex-1 flex items-center overflow-hidden relative py-3"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <motion.div
              className="flex gap-12 px-4 whitespace-nowrap"
              animate={{
                x: isPaused ? 0 : [0, -1000] // Adjust distance based on content length dynamically if possible, but fixed is safer for simple loop
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: Math.max(20, newsItems.length * 10), // Slower speed for readability
                  ease: "linear"
                }
              }}
            >
              {/* Triple the items to ensure smooth infinite scrolling without gaps */}
              {[...newsItems, ...newsItems, ...newsItems].map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="inline-flex items-center gap-3 group"
                >
                  {/* Priority Indicator */}
                  {item.priority === 'high' ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-bold uppercase animate-pulse">
                      <AlertTriangle size={12} />
                      Urgent
                    </span>
                  ) : isNew(item.created_at) ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/50 text-blue-200 text-xs font-bold uppercase">
                      <Clock size={12} />
                      New
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white/70 text-xs font-bold uppercase">
                      <Info size={12} />
                      Info
                    </span>
                  )}

                  {/* Content */}
                  <span className="text-white/90 font-medium text-base group-hover:text-white transition-colors">
                    {item.content}
                  </span>

                  {/* Separator */}
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 mx-2" />
                </div>
              ))}
            </motion.div>

            {/* Fade Gradients */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-indigo-900/90 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-indigo-900/90 to-transparent z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
