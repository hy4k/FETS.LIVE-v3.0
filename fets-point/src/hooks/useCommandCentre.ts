import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useBranch } from './useBranch'

const STALE_TIME = 60000 // 1 minute

const applyBranchFilter = (query: any, activeBranch: string) => {
  if (activeBranch !== 'global') {
    return query.eq('branch_location', activeBranch)
  }
  return query
}

// Hook for main KPI stats
export const useDashboardStats = () => {
  const { activeBranch } = useBranch()

  return useQuery({
    queryKey: ['dashboardStats', activeBranch],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      // 1. Fetch High-Level Branch Status (Pre-aggregated)
      const { data: branchStatus } = await supabase
        .from('branch_status')
        .select('*')
        .eq('branch_name', activeBranch === 'global' ? 'calicut' : activeBranch) // Fallback for global
        .single();

      // 2. Fetch Granular Real-time Data (where tables exist)
      const [
        { count: todayCandidates },
        { count: openIncidents },
        { count: newMessages },
        { count: newPosts }
      ] = await Promise.all([
        applyBranchFilter(supabase.from('candidates').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`), activeBranch),
        applyBranchFilter(supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'open').or('category.eq.incident,priority.eq.high'), activeBranch),
        applyBranchFilter(supabase.from('chat_messages').select('*', { count: 'exact', head: true }).is('read_at', null), activeBranch), // Assuming simple unread logic
        applyBranchFilter(supabase.from('desktop_public_posts').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`), activeBranch),
      ])

      // 3. Mock or Fallback data for missing tables (Staff Schedules, Sessions)
      // We will rely on branchStatus for these if possible, or 0
      const staffPresent = branchStatus?.staff_present || 0;
      const candidatesFromStatus = branchStatus?.candidates_today || 0;

      return {
        totalCandidates: todayCandidates ?? candidatesFromStatus, // Prefer real-time
        todayCandidates: todayCandidates ?? candidatesFromStatus,
        openEvents: openIncidents ?? branchStatus?.incidents_open ?? 0,
        pendingChecklists: 0, // Removed broken query
        todaysRoster: { staff: [] }, // Placeholder until roster_schedules is fixed
        newPosts: newPosts ?? 0,
        newMessages: newMessages ?? 0,
        pendingIncidents: openIncidents ?? 0,
        todaysExams: [], // Placeholder
        branchStatusData: branchStatus // Return full status object for detailed views
      }
    },
    staleTime: STALE_TIME,
    refetchInterval: STALE_TIME,
  })
}

// Hook for candidate trend data
export const useCandidateTrend = () => {
  const { activeBranch } = useBranch()

  return useQuery({
    queryKey: ['candidateTrend', activeBranch],
    queryFn: async () => {
      const trendPromises = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split('T')[0]
        const query = supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${dateString}T00:00:00`)
          .lt('created_at', `${dateString}T23:59:59`)

        return applyBranchFilter(query, activeBranch).then(({ count }) => ({ date: dateString, count: count ?? 0 }))
      })
      const trendData = await Promise.all(trendPromises)
      return trendData.reverse()
    },
    staleTime: STALE_TIME * 5, // Refresh less often
  })
}

// Hook for upcoming exam schedule
export const useUpcomingSchedule = () => {
  const { activeBranch } = useBranch()

  return useQuery({
    queryKey: ['upcomingSchedule', activeBranch],
    queryFn: async () => {
      const today = new Date()
      const sevenDaysLater = new Date(today)
      sevenDaysLater.setDate(today.getDate() + 7)

      const query = supabase
        .from('sessions')
        .select('*')
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', sevenDaysLater.toISOString().split('T')[0])
        .order('date')

      const { data, error } = await applyBranchFilter(query, activeBranch)
      if (error) throw error
      return data || []
    },
    staleTime: STALE_TIME,
  })
}

// Hook for checklist templates
export const useChecklistTemplates = () => {
  return useQuery({
    queryKey: ['checklistTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*, items:checklist_template_items(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const templates = data || []
      return {
        preExamTemplate: templates.find(t => t.category === 'pre-exam'),
        postExamTemplate: templates.find(t => t.category === 'post-exam'),
        customTemplates: templates.filter(t => t.category === 'custom'),
      }
    },
    staleTime: Infinity, // Templates rarely change
  })
}