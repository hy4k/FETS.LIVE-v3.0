import { supabase } from '../lib/supabase';

export interface Task {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    due_date?: string;
    created_at: string;
}

export const taskService = {
    async getMyTasks() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await (supabase as any)
            .from('staff_tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
        return data as Task[];
    },

    async createTask(task: Partial<Task>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await (supabase as any)
            .from('staff_tasks')
            .insert([{ ...task, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data as Task;
    },

    async updateTask(id: string, updates: Partial<Task>) {
        const { data, error } = await (supabase as any)
            .from('staff_tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Task;
    },

    async deleteTask(id: string) {
        const { error } = await (supabase as any).from('staff_tasks').delete().eq('id', id);
        if (error) throw error;
    }
};
