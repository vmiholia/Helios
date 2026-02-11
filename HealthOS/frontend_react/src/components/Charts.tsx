import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface ChartsProps {
    history: any[];
    type: 'weight_hr' | 'recovery' | 'body_comp';
}

export const Charts: React.FC<ChartsProps> = ({ history, type }) => {
    if (!history || history.length === 0) return <div>No history data</div>;

    const formatDate = (date: string) => format(new Date(date), 'MM-dd');

    // Render different charts based on type
    if (type === 'weight_hr') {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[400px]">
                <h3 className="mb-4 font-semibold text-gray-700">Weight & Heart Rate Trends</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={formatDate} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip labelFormatter={formatDate} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#3b82f6" name="Weight (kg)" dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="resting_hr" stroke="#ef4444" name="RHR (bpm)" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (type === 'recovery') {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[400px]">
                <h3 className="mb-4 font-semibold text-gray-700">Recovery & HRV (Whoop)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={formatDate} />
                        <YAxis yAxisId="left" domain={[0, 100]} />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip labelFormatter={formatDate} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="recovery_score" stroke="#10b981" name="Recovery %" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="hrv" stroke="#8b5cf6" name="HRV (ms)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (type === 'body_comp') {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[400px]">
                <h3 className="mb-4 font-semibold text-gray-700">Body Composition</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={formatDate} />
                        <YAxis />
                        <Tooltip labelFormatter={formatDate} />
                        <Legend />
                        <Line type="monotone" dataKey="body_fat" stroke="#f59e0b" name="Body Fat %" />
                        <Line type="monotone" dataKey="muscle_percent" stroke="#6366f1" name="Muscle %" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }

    return <div>Chart type not implemented yet</div>;
};
