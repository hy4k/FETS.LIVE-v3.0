/**
 * Real-time Notifications Hook
 * Subscribes to new notifications for the current user using Supabase Realtime
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { toast } from 'react-hot-toast'
import type { Notification } from '../services/notification.service'

/**
 * Hook to subscribe to real-time notification updates for the current user
 * Automatically invalidates React Query cache and shows toast notifications
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  useEffect(() => {
    if (!profile?.id) {
      console.log('⏸️  Real-time notifications paused - no user profile')
      return
    }

    console.log('🔔 Setting up real-time notification subscription for user:', profile.id)

    // Create a unique channel for this user's notifications
    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('🔔 New notification received:', payload.new)

          const notification = payload.new as Notification

          // Show toast notification based on priority
          showToastNotification(notification)

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['notifications', profile.id] })
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', profile.id] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('🔄 Notification updated:', payload.new)

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['notifications', profile.id] })
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', profile.id] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('🗑️  Notification deleted:', payload.old)

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['notifications', profile.id] })
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', profile.id] })
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification channel status:', status)
      })

    // Cleanup function
    return () => {
      console.log('🔕 Unsubscribing from notification channel')
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])
}

/**
 * Show toast notification based on priority and type
 */
function showToastNotification(notification: Notification) {
  const { priority, title, message, type } = notification

  // Get icon based on type
  const icon = getNotificationIcon(type)

  // Show toast based on priority
  switch (priority) {
    case 'critical':
      toast.error(`${title}: ${message}`, {
        icon: icon,
        duration: 10000, // 10 seconds for critical
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          fontWeight: 'bold'
        }
      })
      break

    case 'high':
      toast(`${title}: ${message}`, {
        icon: icon,
        duration: 6000, // 6 seconds
        style: {
          background: '#FEF3C7',
          color: '#92400E',
          fontWeight: '600'
        }
      })
      break

    case 'medium':
      toast(`${title}: ${message}`, {
        icon: icon,
        duration: 4000, // 4 seconds
        style: {
          background: '#DBEAFE',
          color: '#1E3A8A'
        }
      })
      break

    case 'low':
      // Don't show toast for low priority - only update UI
      console.log('ℹ️  Low priority notification (no toast):', title)
      break

    default:
      toast(`${title}: ${message}`, {
        icon: icon,
        duration: 4000
      })
  }
}

/**
 * Get emoji icon for notification type
 */
function getNotificationIcon(type: string): string {
  const iconMap: Record<string, string> = {
    critical_incident: '🚨',
    incident_assigned: '⚠️',
    incident_resolved: '✅',
    post_comment: '💬',
    post_like: '❤️',
    post_mention: '@',
    leave_approved: '✅',
    leave_rejected: '❌',
    shift_changed: '📅',
    shift_swap_request: '🔄',
    task_assigned: '📋',
    task_deadline: '⏰',
    checklist_incomplete: '☑️',
    exam_today: '📚',
    candidate_new: '👤',
    system_news: '📢'
  }

  return iconMap[type] || '🔔'
}

export default useRealtimeNotifications
