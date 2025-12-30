import { FetsLogo } from './FetsLogo';
import './HeaderTheme.css'; // Import the new theme
import {
  Bell, ChevronDown, MapPin, LayoutDashboard, Briefcase,
  Brain, ShieldAlert, MessageSquare, ClipboardList,
  CalendarDays, UserSearch, UserCheck, Menu
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBranch } from '../hooks/useBranch';
import { useUnreadCount } from '../hooks/useNotifications';
import NotificationPanel from './iCloud/NotificationPanel';
import { canSwitchBranches, formatBranchName, getAvailableBranches } from '../utils/authUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  isMobile?: boolean;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  setActiveTab?: (tab: string) => void;
  activeTab?: string;
}

export function Header({ isMobile = false, sidebarOpen = false, setSidebarOpen, setActiveTab, activeTab }: HeaderProps = {}) {
  const { profile } = useAuth();
  const { activeBranch, setActiveBranch } = useBranch();
  const unreadCount = useUnreadCount();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Branch Switcher State
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableBranches = getAvailableBranches(profile?.email, profile?.role);
  const canSwitch = canSwitchBranches(profile?.email, profile?.role);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    }
    if (isBranchDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isBranchDropdownOpen]);

  const currentBranchName = activeBranch === 'calicut' ? 'Calicut' : activeBranch === 'cochin' ? 'Cochin' : 'Global View';
  const headerBtn = "fets-header-btn";

  // --- TOP ROW NAVIGATION (Core Modules) ---
  const topNavItems = [
    { id: 'command-center', label: 'FETS POINT', icon: LayoutDashboard },
    { id: 'candidate-tracker', label: 'FETS REGISTER', icon: UserSearch },
    { id: 'fets-calendar', label: 'FETS CALENDAR', icon: CalendarDays },
    { id: 'fets-roster', label: 'FETS ROSTER', icon: UserCheck },
  ];

  // --- SECOND ROW NAVIGATION (Utilities & Apps) ---
  const secondRowItems = [
    { id: 'checklist-management', label: 'CHECKLIST', icon: ClipboardList },
    { id: 'my-desk', label: 'MY DESK', icon: MessageSquare },
    { id: 'incident-manager', label: 'INCIDENT MANAGER', icon: ShieldAlert },
    { id: 'fets-intelligence', label: 'FETS INTELLIGENCE', icon: Brain },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#FFD700] shadow-md transition-all duration-300">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>

        {/* --- ROW 1: CORE MODULES --- */}
        <div className="max-w-[1920px] mx-auto px-6 h-20 relative z-20 flex items-center justify-between gap-8 border-b border-black/5">

          {/* LEFT: Branding */}
          <div className="flex items-center gap-6 shrink-0">
            {isMobile && setSidebarOpen && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white/30 rounded-lg"><Menu /></button>
            )}
            <div className="flex flex-col justify-center h-full py-2 scale-90 origin-left">
              <FetsLogo />
            </div>
          </div>

          {/* CENTER: CORE NAVIGATION */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-auto justify-center">
            <div className="flex items-center gap-2">
              {topNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab && setActiveTab(item.id)}
                  className={`relative px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all duration-300 transform ${activeTab === item.id
                      ? 'text-yellow-950 bg-white shadow-lg scale-105 z-10 border border-white/50'
                      : 'text-yellow-900/40 hover:text-yellow-900 hover:bg-black/5 hover:-translate-y-0.5'
                    }`}
                >
                  <item.icon size={14} className={activeTab === item.id ? 'text-yellow-600' : 'opacity-50'} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: GLOBAL ACTIONS */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Branch */}
            <div ref={dropdownRef} className="relative hidden md:block">
              <motion.button
                className={headerBtn}
                onClick={() => canSwitch && setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MapPin className="w-4 h-4 text-yellow-400" />
                <span>{currentBranchName}</span>
                {canSwitch && <ChevronDown className="w-3 h-3 text-white/50 ml-1" />}
              </motion.button>

              <AnimatePresence>
                {isBranchDropdownOpen && canSwitch && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 overflow-hidden z-50 p-2"
                  >
                    {availableBranches.map((branch) => (
                      <button
                        key={branch}
                        onClick={() => { setActiveBranch(branch as any); setIsBranchDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeBranch === branch ? 'bg-yellow-100 text-yellow-900' : 'hover:bg-gray-100'}`}
                      >
                        <span className="font-semibold text-sm">{formatBranchName(branch)}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <motion.button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className={headerBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <Bell className="w-4 h-4 text-yellow-400" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
              </div>
              <span>Notifications</span>
            </motion.button>
          </div>
        </div>

        {/* --- ROW 2: TACTICAL / UTILITY BAR --- */}
        <div className="h-14 bg-white/20 backdrop-blur-md border-t border-white/30 flex items-center shadow-lg relative z-10">
          <div className="max-w-[1920px] mx-auto px-6 w-full flex items-center justify-center gap-6 overflow-x-auto no-scrollbar">

            {secondRowItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab && setActiveTab(item.id)}
                  className={`
                                group relative flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 uppercase tracking-wide
                                ${isActive
                      ? 'bg-black text-white shadow-lg shadow-black/20 ring-1 ring-white/20 scale-105'
                      : 'bg-white/40 text-yellow-950 hover:bg-white hover:text-black hover:shadow-md hover:-translate-y-0.5'
                    }
                            `}
                >
                  <item.icon size={14} className={`${isActive ? 'text-yellow-400' : 'text-yellow-900/50 group-hover:text-yellow-600'}`} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <AnimatePresence>
          {showNotificationPanel && (
            <NotificationPanel onClose={() => setShowNotificationPanel(false)} />
          )}
        </AnimatePresence>
      </div>

    </>
  )
}