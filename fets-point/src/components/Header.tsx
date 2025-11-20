
import { LogOut, Bell, Menu, X, Moon, Sun, User, Command } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useBranch } from '../hooks/useBranch';
import { RealtimeIndicator } from './RealtimeIndicators';
import { BranchSwitcher } from './BranchSwitcher';
import { useUnreadCount } from '../hooks/useNotifications';
import NotificationPanel from './iCloud/NotificationPanel';

interface HeaderProps {
  isMobile?: boolean;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export function Header({ isMobile = false, sidebarOpen = false, setSidebarOpen }: HeaderProps = {}) {
  const { signOut, profile, user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { activeBranch, setActiveBranch, userAccessLevel } = useBranch();
  const unreadCount = useUnreadCount();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (user?.email) {
      return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
    }
    return 'User';
  };

  const getUserRole = () => {
    if (profile?.role) {
      return profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
    }
    return 'Super Admin';
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <>
      {/* PREMIUM HEADER - Taller with seamless flow */}
      <div className={`fixed top-0 left-0 right-0 z-40 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 backdrop-blur-lg shadow-2xl transition-all duration-300`}>
        <div className="max-w-full mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            {/* Left Side: Mobile Menu, Logo & Greeting */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              {isMobile && setSidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2.5 rounded-xl hover:bg-black/10 transition-all duration-200 shadow-sm"
                  aria-label="Toggle navigation menu"
                >
                  {sidebarOpen ? (
                    <X className="h-5 w-5 text-black" />
                  ) : (
                    <Menu className="h-5 w-5 text-black" />
                  )}
                </button>
              )}

              {/* Logo - Enhanced */}
              <div className="w-10 h-10 bg-gradient-to-br from-black/30 to-black/20 rounded-xl flex items-center justify-center shadow-lg border border-black/10">
                <Command className="h-5 w-5 text-black font-bold" />
              </div>

              {/* Greeting - Enhanced typography */}
              <div className="hidden sm:block">
                <div className="text-lg font-extrabold text-black tracking-tight" style={{ fontFamily: "'Inter', 'Poppins', system-ui, sans-serif" }}>
                  {getGreeting()}, {getDisplayName()}
                </div>
                <div className="text-sm text-black/70 font-medium">
                  All Centres • {getCurrentTime()}
                </div>
              </div>
            </div>

            {/* Center: Branch Display (Read-only) */}
            {!isMobile && (
              <div className="flex items-center gap-2 bg-black/15 backdrop-blur-md rounded-2xl px-6 py-3 border border-black/20 shadow-xl">
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
                <span className="text-sm font-bold text-black">
                  {activeBranch === 'calicut' ? 'Calicut' : activeBranch === 'cochin' ? 'Cochin' : 'Global'}
                </span>
              </div>
            )}

            {/* Right Side: Actions - Enhanced */}
            <div className="flex items-center gap-3">
              {/* Branch Switcher (Super Admin Only) */}
              <BranchSwitcher />

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <button
                  onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                  className="p-2.5 rounded-xl hover:bg-black/10 transition-all duration-200 relative shadow-sm"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-black" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-white text-[10px] font-bold">{unreadCount}</span>
                    </span>
                  )}
                </button>

                {/* User Avatar - Enhanced */}
                <div className="w-10 h-10 bg-gradient-to-br from-black/30 to-black/20 rounded-xl flex items-center justify-center shadow-lg border border-black/10">
                  <span className="text-black text-base font-extrabold">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Sign Out - Enhanced */}
                <button
                  onClick={handleSignOut}
                  className="hidden sm:block p-2.5 rounded-xl hover:bg-black/10 transition-all duration-200 shadow-sm"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5 text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rounded bottom edge with subtle shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-black/5 rounded-b-3xl"></div>
      </div>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <NotificationPanel onClose={() => setShowNotificationPanel(false)} />
      )}
    </>
  )
}