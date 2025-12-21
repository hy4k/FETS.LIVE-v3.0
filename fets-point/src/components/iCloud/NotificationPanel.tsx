import { motion } from 'framer-motion'
import { X, Bell, Check, AlertTriangle, Heart, MessageSquare, Calendar, ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { useNotifications } from '../../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'

interface NotificationPanelProps {
  onClose: () => void
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    isLoading
  } = useNotifications({ limit: 50 })

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      critical_incident: AlertTriangle,
      incident_assigned: AlertTriangle,
      incident_resolved: CheckCircle,
      post_comment: MessageSquare,
      post_like: Heart,
      post_mention: Bell,
      leave_approved: CheckCircle,
      leave_rejected: XCircle,
      shift_changed: Calendar,
      shift_swap_request: Calendar,
      task_assigned: ClipboardList,
      task_deadline: Clock,
      checklist_incomplete: ClipboardList,
      exam_today: Bell,
      candidate_new: Bell,
      system_news: Bell
    }

    const IconComponent = iconMap[type] || Bell
    return <IconComponent size={16} />
  }

  const getNotificationColor = (priority: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50 text-gray-600'

    switch (priority) {
      case 'critical': return 'bg-red-50 text-red-700'
      case 'high': return 'bg-orange-50 text-orange-700'
      case 'medium': return 'bg-blue-50 text-blue-700'
      case 'low': return 'bg-green-50 text-green-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const handleNotificationClick = (notificationId: string, link?: string | null) => {
    markAsRead(notificationId)
    if (link) {
      // You can navigate here if needed
      // For now, just close the panel
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="notification-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998
        }}
      />

      {/* Panel */}
      <motion.div
        className="notification-panel"
        initial={{ opacity: 0, x: 300, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        style={{
          position: 'fixed',
          top: 100,
          right: 20,
          width: 400,
          maxHeight: '80vh',
          zIndex: 9999
        }}
      >
        <GlassCard className="notification-container" style={{ padding: 0 }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>Notifications</span>
              {unreadCount > 0 && (
                <div style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {unreadCount}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#2563eb',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{
            maxHeight: 'calc(80vh - 80px)',
            overflowY: 'auto'
          }}>
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontWeight: 500 }}>No notifications</p>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.link)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                    cursor: notification.link ? 'pointer' : 'default',
                    transition: 'background-color 0.2s',
                    backgroundColor: notification.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (notification.link) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                      }}
                      className={getNotificationColor(notification.priority, notification.is_read)}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'start',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontWeight: notification.is_read ? 500 : 600,
                          fontSize: '14px',
                          color: notification.is_read ? '#6b7280' : '#111827'
                        }}>
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            dismiss(notification.id)
                          }}
                          style={{
                            padding: '2px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: 0.5,
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '13px',
                        color: '#6b7280',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '8px'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>

                        {!notification.is_read && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '9999px',
                            backgroundColor: '#3b82f6'
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </motion.div>
    </>
  )
}
