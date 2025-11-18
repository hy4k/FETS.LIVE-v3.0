import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { brainstormService } from '../services/api.service'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useEffect } from 'react'

// Types for brainstorm data
export type BrainstormSession = {
  id: string
  title: string
  description?: string
  branch_location: string
  created_by: string
  status: string
  created_at: string
  updated_at: string
}

export type BrainstormNote = {
  id: string
  session_id: string
  user_id: string
  content: string
  color: string
  category?: string
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export type BrainstormEvent = {
  id: string
  session_id: string
  title: string
  description?: string
  event_date: string
  event_type: string
  created_by: string
  branch_location: string
  created_at: string
  updated_at: string
}

/**
 * Hook to fetch brainstorm sessions
 */
export const useBrainstormSessions = (branchLocation?: string) => {
  return useQuery<BrainstormSession[], Error>({
    queryKey: ['brainstorm-sessions', branchLocation],
    queryFn: async () => {
      return await brainstormService.getSessions(branchLocation)
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to create a brainstorm session
 */
export const useCreateBrainstormSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (session: {
      title: string
      description?: string
      branch_location: string
      created_by: string
    }) => {
      return await brainstormService.createSession(session)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brainstorm-sessions'] })
      toast.success('Session created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create session')
    },
  })
}

/**
 * Hook to fetch notes for a session
 */
export const useBrainstormNotes = (sessionId: string) => {
  const queryClient = useQueryClient()

  const query = useQuery<BrainstormNote[], Error>({
    queryKey: ['brainstorm-notes', sessionId],
    queryFn: async () => {
      if (!sessionId) return []
      return await brainstormService.getNotes(sessionId)
    },
    enabled: !!sessionId,
    staleTime: 10000, // 10 seconds for real-time feel
    refetchOnWindowFocus: true,
  })

  // Real-time subscription for notes
  useEffect(() => {
    if (!sessionId) return

    const channel = (supabase as any)
      .channel(`brainstorm-notes:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brainstorm_notes',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Refetch notes when changes occur
          queryClient.invalidateQueries({ queryKey: ['brainstorm-notes', sessionId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, queryClient])

  return query
}

/**
 * Hook to create a note
 */
export const useCreateBrainstormNote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (note: {
      session_id: string
      user_id: string
      content: string
      color?: string
      category?: string
    }) => {
      return await brainstormService.createNote(note)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brainstorm-notes', variables.session_id] })
      toast.success('Note added')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create note')
    },
  })
}

/**
 * Hook to update a note
 */
export const useUpdateBrainstormNote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      sessionId,
    }: {
      id: string
      updates: { content?: string; color?: string; category?: string }
      sessionId: string
    }) => {
      return await brainstormService.updateNote(id, updates)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brainstorm-notes', variables.sessionId] })
      toast.success('Note updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update note')
    },
  })
}

/**
 * Hook to delete a note
 */
export const useDeleteBrainstormNote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: string; sessionId: string }) => {
      return await brainstormService.deleteNote(id)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brainstorm-notes', variables.sessionId] })
      toast.success('Note deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete note')
    },
  })
}

/**
 * Hook to fetch events
 */
export const useBrainstormEvents = (branchLocation?: string) => {
  const queryClient = useQueryClient()

  const query = useQuery<BrainstormEvent[], Error>({
    queryKey: ['brainstorm-events', branchLocation],
    queryFn: async () => {
      return await brainstormService.getEvents(branchLocation)
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  })

  // Real-time subscription for events
  useEffect(() => {
    const channel = (supabase as any)
      .channel('brainstorm-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brainstorm_events',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['brainstorm-events'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

/**
 * Hook to create an event
 */
export const useCreateBrainstormEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (event: {
      session_id: string
      title: string
      description?: string
      event_date: string
      event_type?: string
      created_by: string
      branch_location: string
    }) => {
      return await brainstormService.createEvent(event)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brainstorm-events'] })
      toast.success('Event added to calendar')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create event')
    },
  })
}

/**
 * Hook to update an event
 */
export const useUpdateBrainstormEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: {
        title?: string
        description?: string
        event_date?: string
        event_type?: string
      }
    }) => {
      return await brainstormService.updateEvent(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brainstorm-events'] })
      toast.success('Event updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update event')
    },
  })
}

/**
 * Hook to delete an event
 */
export const useDeleteBrainstormEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await brainstormService.deleteEvent(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brainstorm-events'] })
      toast.success('Event deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete event')
    },
  })
}
