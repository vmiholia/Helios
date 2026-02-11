import React from 'react';
import { Users, Activity, BarChart, Apple, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
    children: React.ReactNode;
    selectedUser: string;
    users: string[];
    onSelectUser: (user: string) => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children, selectedUser, users, onSelectUser, activeTab, onTabChange
}) => {
    const navItems = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'recovery', label: 'Recovery (Whoop)', icon: Moon },
        { id: 'body_comp', label: 'Body Comp', icon: Users },
        { id: 'performance', label: 'Performance', icon: BarChart },
        { id: 'nutrition', label: 'Nutrition', icon: Apple },
    ];

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-600">
                        <Activity className="w-6 h-6" />
                        HealthOS
                    </h1>
                </div>

                <div className="p-4">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Family Member
                    </label>
                    <select
                        value={selectedUser}
                        onChange={(e) => onSelectUser(e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {users.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                activeTab === item.id
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-indigo-600" : "text-gray-400")} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
