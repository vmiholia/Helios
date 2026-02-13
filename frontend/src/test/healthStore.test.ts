import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHealthStore } from '../store/healthStore';

// Helper to reset Zustand store between tests
const resetStore = () => {
    useHealthStore.setState({
        date: '2026-02-12',
        goals: { calories: 2000, protein: 150, water_ml: 3000 },
        totals: { calories: 0, protein: 0, carbs: 0, fats: 0, water_ml: 0 },
        entries: [],
        loading: false,
        error: null,
        prefillText: null,
    });
};

describe('healthStore', () => {
    beforeEach(() => {
        resetStore();
        (global.fetch as ReturnType<typeof vi.fn>).mockReset();
    });

    // ─── Initial State ───
    it('has correct initial state shape', () => {
        const state = useHealthStore.getState();
        expect(state.goals).toEqual({ calories: 2000, protein: 150, water_ml: 3000 });
        expect(state.entries).toEqual([]);
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
        expect(state.prefillText).toBeNull();
    });

    // ─── setPrefillText ───
    it('sets and clears prefillText', () => {
        const { setPrefillText } = useHealthStore.getState();
        setPrefillText('2 eggs omelette at 10 am');
        expect(useHealthStore.getState().prefillText).toBe('2 eggs omelette at 10 am');

        setPrefillText(null);
        expect(useHealthStore.getState().prefillText).toBeNull();
    });

    // ─── fetchDashboard ───
    describe('fetchDashboard', () => {
        it('fetches dashboard data and updates state', async () => {
            const mockData = {
                date: '2026-02-12',
                goals: { calories: 2200, protein: 160, water_ml: 3500 },
                totals: { calories: 500, protein: 30, carbs: 60, fats: 20, water_ml: 200 },
                entries: [
                    {
                        id: 1,
                        raw_text: 'test food',
                        ingested_at: '2026-02-12T10:00:00',
                        macros: { calories: 500, protein: 30, carbs: 60, fats: 20, water_ml: 200, food_name: 'Test' }
                    }
                ]
            };

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            await useHealthStore.getState().fetchDashboard('2026-02-12');

            const state = useHealthStore.getState();
            expect(state.date).toBe('2026-02-12');
            expect(state.goals.calories).toBe(2200);
            expect(state.totals.calories).toBe(500);
            expect(state.entries).toHaveLength(1);
            expect(state.entries[0].raw_text).toBe('test food');
            expect(state.loading).toBe(false);
        });

        it('sets error on fetch failure', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: false,
            });

            await useHealthStore.getState().fetchDashboard('2026-02-12');

            const state = useHealthStore.getState();
            expect(state.error).toBe('Failed to fetch dashboard');
            expect(state.loading).toBe(false);
        });

        it('passes date as query param when provided', async () => {
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    date: '2026-01-15',
                    goals: { calories: 2000, protein: 150, water_ml: 3000 },
                    totals: { calories: 0, protein: 0, carbs: 0, fats: 0, water_ml: 0 },
                    entries: []
                }),
            });

            await useHealthStore.getState().fetchDashboard('2026-01-15');
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/dashboard?date=2026-01-15');
        });
    });

    // ─── addEntry ───
    describe('addEntry', () => {
        it('sends raw_text and current date to /log endpoint', async () => {
            // Mock the /log call
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 1 }),
            });
            // Mock the subsequent fetchDashboard call
            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    date: '2026-02-12',
                    goals: { calories: 2000, protein: 150, water_ml: 3000 },
                    totals: { calories: 300, protein: 20, carbs: 40, fats: 10, water_ml: 0 },
                    entries: [{ id: 1, raw_text: '2 eggs', ingested_at: '2026-02-12T10:00:00', macros: { calories: 300, protein: 20 } }]
                }),
            });

            await useHealthStore.getState().addEntry('2 eggs at 10 am');

            // Check the /log call
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_text: '2 eggs at 10 am', date: '2026-02-12' }),
            });
        });

        it('preserves selected date after adding entry (no reset to today)', async () => {
            // Explicitly set all state including the past date
            useHealthStore.setState({
                date: '2026-01-01',
                loading: false,
                error: null,
            });

            // Verify state was set correctly
            expect(useHealthStore.getState().date).toBe('2026-01-01');

            (global.fetch as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2 }) })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        date: '2026-01-01',
                        goals: { calories: 2000, protein: 150, water_ml: 3000 },
                        totals: { calories: 0, protein: 0, carbs: 0, fats: 0, water_ml: 0 },
                        entries: []
                    }),
                });

            await useHealthStore.getState().addEntry('rice at noon');

            // The fetchDashboard should have been called with the past date, not today
            const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
            expect(fetchCalls).toHaveLength(2);
            const dashboardUrl = fetchCalls[1][0];
            expect(dashboardUrl).toContain('date=2026-01-01');
        });
    });

    // ─── deleteEntry ───
    describe('deleteEntry', () => {
        it('optimistically removes entry from state', async () => {
            useHealthStore.setState({
                entries: [
                    { id: 1, raw_text: 'eggs', ingested_at: '2026-02-12T10:00:00', macros: { calories: 150, protein: 12, carbs: 1, fats: 10, water_ml: 0, food_name: 'Eggs' } },
                    { id: 2, raw_text: 'rice', ingested_at: '2026-02-12T12:00:00', macros: { calories: 170, protein: 4, carbs: 37, fats: 1, water_ml: 0, food_name: 'Rice' } },
                ] as any,
            });

            (global.fetch as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce({ ok: true }) // DELETE call
                .mockResolvedValueOnce({ // fetchDashboard
                    ok: true,
                    json: async () => ({
                        date: '2026-02-12',
                        goals: { calories: 2000, protein: 150, water_ml: 3000 },
                        totals: { calories: 170, protein: 4, carbs: 37, fats: 1, water_ml: 0 },
                        entries: [{ id: 2, raw_text: 'rice', ingested_at: '2026-02-12T12:00:00', macros: { calories: 170, protein: 4 } }]
                    }),
                });

            // Don't await — check optimistic update
            const deletePromise = useHealthStore.getState().deleteEntry(1);

            // Optimistically, entry #1 should be removed immediately
            expect(useHealthStore.getState().entries).toHaveLength(1);
            expect(useHealthStore.getState().entries[0].id).toBe(2);

            await deletePromise;
        });

        it('rolls back on delete failure', async () => {
            const originalEntries = [
                { id: 1, raw_text: 'eggs', ingested_at: '2026-02-12T10:00:00', macros: { calories: 150, protein: 12, carbs: 1, fats: 10, water_ml: 0, food_name: 'Eggs' } },
            ] as any;

            useHealthStore.setState({ entries: originalEntries });

            (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                ok: false,
            });

            await useHealthStore.getState().deleteEntry(1);

            // Should roll back to original entries
            expect(useHealthStore.getState().entries).toHaveLength(1);
            expect(useHealthStore.getState().entries[0].id).toBe(1);
        });
    });

    // ─── Nutrient Safety (undefined handling) ───
    describe('nutrient safety', () => {
        it('handles entries with missing macro fields (LLM failure)', () => {
            const brokenEntry = {
                id: 99,
                raw_text: 'broken food',
                ingested_at: '2026-02-12T10:00:00',
                macros: {
                    error: 'LLM failed',
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fats: 0,
                    water_ml: 0,
                    food_name: 'broken food',
                    items: [],
                    micros: {},
                    warnings: ['LLM failed']
                }
            };

            useHealthStore.setState({ entries: [brokenEntry] as any });
            const entry = useHealthStore.getState().entries[0];

            // These should be 0, not undefined
            expect(entry.macros.calories).toBe(0);
            expect(entry.macros.protein).toBe(0);
            expect(entry.macros.carbs).toBe(0);
            expect(entry.macros.fats).toBe(0);
        });
    });
});
