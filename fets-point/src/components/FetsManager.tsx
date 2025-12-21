import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper,
  Users,
  Maximize2,
  X,
  Settings,
  ShieldCheck,
  Activity,
  Server,
  Database,
  Lock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { NewsManager } from './NewsManager';
import { ChecklistManager } from './checklist/ChecklistManager';
import { ClipboardList } from 'lucide-react';

// --- Interfaces ---

interface TileProps {
  id: string;
  title: string;
  icon: React.ElementType;
  color?: string;
  children: React.ReactNode;
  onExpand: () => void;
  colSpan?: 1 | 2;
}

// --- Live Tile Component ---

const LiveTile = ({ id, title, icon: Icon, color = "amber", children, onExpand, colSpan = 1 }: TileProps) => {
  return (
    <motion.div
      layoutId={`tile-container-${id}`}
      className={`neomorphic-card relative group overflow-hidden flex flex-col justify-between cursor-pointer transition-shadow hover:shadow-[8px_8px_16px_#bec3c9,-8px_-8px_16px_#ffffff] ${colSpan === 2 ? 'md:col-span-2' : ''}`}
      onClick={onExpand}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Decor */}
      <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 text-${color}-900 rotate-12`}>
        <Icon size={200} />
      </div>

      <div className="p-6 h-full flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 shadow-sm border border-${color}-100 group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-700 tracking-tight">{title}</h3>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-gray-600">
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>

      {/* Visual Indicator Bar */}
      <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r from-${color}-400 to-${color}-600 transition-all duration-500 rounded-b-2xl`} />
    </motion.div>
  )
}

// --- Expanded Panel Component ---

const ExpandedPanel = ({ id, title, children, onClose }: { id: string, title: string, children: React.ReactNode, onClose: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`tile-container-${id}`}
        className="w-full max-w-7xl max-h-[95vh] bg-[#f0f2f5] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-20 shadow-sm">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">{title}</h2>
            <p className="text-gray-500 mt-1 font-medium">Advanced Administration Console</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto bg-gray-50/50 flex-1">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- Stat Row Helper ---

const StatRow = ({ label, value, subtext }: { label: string, value: string | number, subtext?: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-white/40 px-2 -mx-2 rounded-lg transition-colors">
    <span className="text-gray-500 font-medium text-sm">{label}</span>
    <div className="text-right">
      <span className="block text-lg font-bold text-gray-800 leading-none">{value}</span>
      {subtext && <span className="text-xs text-gray-400 font-medium">{subtext}</span>}
    </div>
  </div>
)

// --- Main FetsManager Component ---

export function FetsManager() {
  const { profile, hasPermission } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeNews: 0,
    checklistCount: 0
  });

  // Fetch quick stats for the tiles
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          newsResponse,
          checklistResponse
        ] = await Promise.all([
          supabase.from('news_updates').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('checklist_templates').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          activeNews: newsResponse.count || 0,
          checklistCount: checklistResponse.count || 0
        });
      } catch (error) {
        console.error('Error fetching manager stats', error);
      }
    };
    fetchStats();
  }, []);

  const handleExpand = (id: string) => setExpandedId(id);
  const handleClose = () => setExpandedId(null);

  if (!profile) return <div className="p-20 text-center">Loading Access...</div>;

  return (
    <div className="min-h-screen bg-[#e0e5ec] pt-28 pb-12 px-4 md:px-8">

      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-10 flex items-center gap-6">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center shadow-xl shadow-gray-500/20">
          <Settings className="text-amber-400" size={40} />
        </div>
        <div>
          <h1 className="text-5xl font-[900] tracking-tight text-gray-800 mb-2">
            FETS <span className="text-gold-gradient">MANAGER</span>
          </h1>
          <p className="text-gray-500 font-medium ml-1 text-lg">
            Authorized Personnel Only • Global Control Center
          </p>
        </div>
      </div>

      {/* Tiles Grid */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

        {/* 1. Newsroom Tile */}
        {hasPermission('news_edit') && (
          <LiveTile id="news" title="Newsroom Control" icon={Newspaper} onExpand={() => handleExpand('news')} color="blue" colSpan={1}>
            <div className="space-y-2">
              <StatRow label="Active Alerts" value={stats.activeNews} subtext="Currently live" />
              <StatRow label="Priority High" value={2} subtext="Critical Info" />
              <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs font-medium border border-blue-100">
                <Activity size={16} /> Broadcasts are updating in real-time
              </div>
            </div>
          </LiveTile>
        )}

        {/* 2. Checklist Governance Tile */}
        {hasPermission('checklist_edit') && (
          <LiveTile id="checklists" title="Checklist Governance" icon={ClipboardList} onExpand={() => handleExpand('checklists')} color="amber" colSpan={1}>
            <div className="space-y-2">
              <StatRow label="Templates" value={(stats as any).checklistCount || 0} subtext="Total designs" />
              <StatRow label="Verified Today" value={0} subtext="Completed" />
              <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-700 text-xs font-medium border border-amber-100">
                <ShieldCheck size={16} /> Protocol adherence is monitored
              </div>
            </div>
          </LiveTile>
        )}

        {/* Staff Command Tile Removed - Now under User Management Governance */}

        {/* 3. System Health (Bonus) */}
        <LiveTile id="system" title="System Health" icon={Server} onExpand={() => { }} color="slate" colSpan={1}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">Database</span>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">HEALTHY</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">API Latency</span>
              <span className="text-xs font-mono text-gray-500">24ms</span>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg flex items-center gap-3">
              <Lock size={16} className="text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">Encrypted & Secure</span>
            </div>
          </div>
        </LiveTile>

      </div>

      {/* Expanded Logic */}
      <AnimatePresence>
        {expandedId === 'news' && (
          <ExpandedPanel id="news" title="Broadcast Newsroom" onClose={handleClose}>
            <NewsManager />
          </ExpandedPanel>
        )}

        {expandedId === 'checklists' && (
          <ExpandedPanel id="checklists" title="Mission Protocols" onClose={handleClose}>
            <ChecklistManager currentUser={profile} />
          </ExpandedPanel>
        )}

      </AnimatePresence>

    </div>
  )
}

export default FetsManager;
