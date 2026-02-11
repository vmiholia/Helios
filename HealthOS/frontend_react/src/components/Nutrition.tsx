import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

interface NutritionProps {
    user: string;
}

export const Nutrition: React.FC<NutritionProps> = ({ user }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [view, setView] = useState<'logs' | 'analytics'>('logs');
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        // Fetch Logs
        async function fetchData() {
            try {
                const resLogs = await axios.get(`http://localhost:8000/api/nutrition/logs`);
                if (resLogs.data.logs) setLogs(resLogs.data.logs);

                // Default: Last 7 days
                const end = format(new Date(), 'yyyy-MM-dd');
                const start = format(subDays(new Date(), 7), 'yyyy-MM-dd');
                const resStats = await axios.get(`http://localhost:8000/api/nutrition/analytics?start_date=${start}&end_date=${end}`);
                if (resStats.data.analytics) setAnalytics(resStats.data.analytics);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Sub-nav */}
            <div className="flex gap-4">
                <button
                    onClick={() => setView('logs')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'logs' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Daily Logs
                </button>
                <button
                    onClick={() => setView('analytics')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'analytics' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Analytics (Last 7 Days)
                </button>
            </div>

            {view === 'logs' && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="mb-4 font-semibold text-gray-700">Recent Nutrition Logs</h3>
                    <div className="space-y-4">
                        {logs.length === 0 && <div>No logs found.</div>}
                        {logs.map((log) => (
                            <div key={log.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-gray-900">{log.food_item}</div>
                                        <div className="text-sm text-gray-500">{log.date} {log.time}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900">{log.calories} kcal</div>
                                        <div className="text-xs text-gray-500">
                                            P: {log.protein_g}g C: {log.carbs_g}g F: {log.fats_g}g
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[300px]">
                        <h4 className="mb-2 font-medium">Macros (g)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" fontSize={12} tickFormatter={(v) => format(new Date(v), 'MM-dd')} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="protein_g" stackId="a" fill="#3b82f6" name="Protein" />
                                <Bar dataKey="carbs_g" stackId="a" fill="#10b981" name="Carbs" />
                                <Bar dataKey="fats_g" stackId="a" fill="#f59e0b" name="Fats" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[300px]">
                        <h4 className="mb-2 font-medium">Calories</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" fontSize={12} tickFormatter={(v) => format(new Date(v), 'MM-dd')} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="calories" fill="#6366f1" name="Calories" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};
