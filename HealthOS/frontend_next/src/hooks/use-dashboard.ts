'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DashboardData } from '@/lib/supabase';
import { create } from 'zustand';

// ── Lightweight UI state (not server state) ──
interface UIState {
    date: string;
    prefillText: string | null;
    setDate: (date: string) => void;
    setPrefillText: (text: string | null) => void;
}

const getLocalDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const useUIStore = create<UIState>((set) => ({
    date: getLocalDate(),
    prefillText: null,
    setDate: (date) => set({ date }),
    setPrefillText: (text) => set({ prefillText: text }),
}));

// ── Server state via React Query ──
export function useDashboard() {
    const date = useUIStore((s) => s.date);

    return useQuery<DashboardData>({
        queryKey: ['dashboard', date],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard?date=${date}`);
            if (!res.ok) throw new Error('Failed to fetch dashboard');
            return res.json();
        },
    });
}

export function useAddEntry() {
    const queryClient = useQueryClient();
    const date = useUIStore((s) => s.date);

    return useMutation({
        mutationFn: async (rawText: string) => {
            const res = await fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_text: rawText, date }),
            });
            if (!res.ok) throw new Error('Failed to log entry');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', date] });
        },
    });
}

export function useDeleteEntry() {
    const queryClient = useQueryClient();
    const date = useUIStore((s) => s.date);

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/log/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete entry');
            return res.json();
        },
        onMutate: async (id) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['dashboard', date] });
            const prev = queryClient.getQueryData<DashboardData>(['dashboard', date]);
            if (prev) {
                queryClient.setQueryData<DashboardData>(['dashboard', date], {
                    ...prev,
                    entries: prev.entries.filter((e) => e.id !== id),
                });
            }
            return { prev };
        },
        onError: (_err, _id, context) => {
            if (context?.prev) {
                queryClient.setQueryData(['dashboard', date], context.prev);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', date] });
        },
    });
}

export function useParseFood() {
    return useMutation({
        mutationFn: async (rawText: string) => {
            const res = await fetch('/api/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_text: rawText }),
            });
            if (!res.ok) throw new Error('Failed to parse food');
            return res.json();
        },
    });
}
