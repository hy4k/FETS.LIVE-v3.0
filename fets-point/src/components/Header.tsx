import { FetsLogo } from './FetsLogo';
import './HeaderTheme.css'; // Import the new theme
import {
  Bell, ChevronDown, MapPin, LayoutDashboard,
  Brain, ShieldAlert, MessageSquare, ClipboardList,
  CalendarDays, UserSearch, UserCheck, Menu, LogOut,
  Server, Cpu, Shield
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

/**
 * Helper to wrap each character in a span with a CSS variable for animation delay
 */
const AnimatedLabel = ({ label }: { label: string }) => {
  return (
    <span className="flex gap-[0.05em]">
      {label.split('').map((char, index) => (
        <span
          key={index}
          style={{ '--char-index': index } as React.CSSProperties}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export function Header({ isMobile = false, sidebarOpen = false, setSidebarOpen, setActiveTab, activeTab }: HeaderProps = {}) {
  const { profile, signOut } = useAuth();
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
    { id: 'system-manager', label: 'SYSTEM MANAGER', icon: Server },
    { id: 'fets-intelligence', label: 'FETS INTELLIGENCE', icon: Brain },
  ];

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 fets-command-deck transition-all duration-300">
        {/* --- ROW 1: CORE MODULES (The Command Deck) --- */}
        <div className="max-w-[1920px] mx-auto px-6 h-20 relative z-20 flex items-center justify-between gap-8">

          {/* LEFT: Branding */}
          <div className="flex items-center gap-6 shrink-0">
            {isMobile && setSidebarOpen && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white/30 rounded-lg"><Menu /></button>
            )}
            <div className="flex flex-col justify-center h-full py-2 scale-90 origin-left">
              <FetsLogo />
            </div>
          </div>

          {/* CENTER: CORE NAVIGATION (Neumorphic Buttons) */}
          <div className="hidden lg:flex flex-1 max-w-5xl mx-auto justify-center">
            <div className="flex items-center gap-6">
              {topNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab && setActiveTab(item.id)}
                  className={`module-btn ${activeTab === item.id ? 'active' : ''}`}
                >
                  <item.icon size={18} className={activeTab === item.id ? 'opacity-100' : 'opacity-40'} />
                  <AnimatedLabel label={item.label} />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: COMMAND CONTROLS (Pills) */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Branch Switcher */}
            <div ref={dropdownRef} className="relative hidden md:block">
              <button
                className="fets-pill-control"
                onClick={() => canSwitch && setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              >
                <MapPin className="w-4 h-4 opacity-70" />
                <span className="text-xs uppercase tracking-wider">{currentBranchName}</span>
                {canSwitch && <ChevronDown className="w-3 h-3 opacity-40 ml-1" />}
              </button>

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
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeBranch === branch ? 'bg-amber-100 text-amber-900' : 'hover:bg-gray-100'}`}
                      >
                        <span className="font-semibold text-sm">{formatBranchName(branch)}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="fets-pill-control relative"
            >
              <div className="relative">
                <Bell className="w-4 h-4 opacity-70" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
              </div>
              <span className="text-xs uppercase tracking-wider hidden sm:inline">Alerts</span>
            </button>

            {/* EXIT Button */}
            <button
              onClick={handleSignOut}
              className="fets-pill-control exit-btn"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- ROW 2: UTILITY DECK (Recessed Utility Bar) --- */}
        <div className="h-14 utility-deck flex items-center relative z-10 border-t border-black/5">
          <div className="max-w-[1920px] mx-auto px-6 w-full flex items-center justify-center gap-6 overflow-x-auto no-scrollbar">
            {secondRowItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab && setActiveTab(item.id)}
                  className={`utility-btn ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={14} className={`${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`} />
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
