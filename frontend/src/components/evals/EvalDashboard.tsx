import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Play, CheckCircle, XCircle, Database, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export function EvalDashboard() {
    const [activeTab, setActiveTab] = useState<'logs' | 'run'>('logs');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">System Evaluations</h2>
                    <p className="text-neutral-400">Monitor LLM performance and run regression tests.</p>
                </div>

                <div className="flex gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                    <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={Activity}>
                        Live Logs
                    </TabButton>
                    <TabButton active={activeTab === 'run'} onClick={() => setActiveTab('run')} icon={Play}>
                        Run Evals
                    </TabButton>
                </div>
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'logs' ? <LogsView /> : <RunEvalsView />}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, children }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${active
                ? 'bg-cyan-900/30 text-cyan-400 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
        >
            <Icon className="w-4 h-4" />
            {children}
        </button>
    );
}

function LogsView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${API_URL}/evals/logs`);
            setLogs(res.data);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch logs:", e);
        }
    };

    const [selectedLog, setSelectedLog] = useState<any>(null);

    // ... (keep useEffect and fetchLogs)

    if (loading) return <div className="text-neutral-500 animate-pulse">Loading traces...</div>;

    return (
        <>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-900 text-neutral-500 font-medium">
                        <tr>
                            <th className="p-4">Time</th>
                            <th className="p-4">Function</th>
                            <th className="p-4">Input</th>
                            <th className="p-4">Latency</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {logs.map((log, i) => (
                            <tr
                                key={i}
                                onClick={() => setSelectedLog(log)}
                                className="hover:bg-neutral-800/50 transition-colors cursor-pointer"
                            >
                                <td className="p-4 text-neutral-400 font-mono text-xs">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="p-4 text-cyan-400 font-mono text-xs">{log.function}</td>
                                <td className="p-4 max-w-xs truncate text-neutral-300">
                                    {JSON.stringify(log.input)}
                                </td>
                                <td className="p-4 text-neutral-400 text-xs">
                                    {Math.round(log.latency_ms)}ms
                                </td>
                                <td className="p-4">
                                    {log.error ? (
                                        <span className="flex items-center gap-1 text-red-400 text-xs bg-red-950/30 px-2 py-1 rounded-full w-fit">
                                            <XCircle className="w-3 h-3" /> Error
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-950/30 px-2 py-1 rounded-full w-fit">
                                            <CheckCircle className="w-3 h-3" /> Success
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-neutral-600">
                                    No logs found yet. Try interacting with the app.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
                            <div>
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-cyan-500" />
                                    Log Details
                                </h3>
                                <div className="text-xs text-neutral-500 font-mono mt-1">
                                    {selectedLog.function} • {new Date(selectedLog.timestamp).toLocaleString()}
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-500">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 font-mono text-sm">
                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                                    <div className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Latency</div>
                                    <div className="text-cyan-400">{Math.round(selectedLog.latency_ms)}ms</div>
                                </div>
                                <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                                    <div className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Model</div>
                                    <div className="text-purple-400">{selectedLog.model}</div>
                                </div>
                            </div>

                            {/* Input */}
                            <div>
                                <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Input</div>
                                <div className="bg-neutral-950 p-4 rounded border border-neutral-800 text-neutral-300 whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(selectedLog.input, null, 2)}
                                </div>
                            </div>

                            {/* Output */}
                            <div>
                                <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Output</div>
                                <div className={`bg-neutral-950 p-4 rounded border ${selectedLog.error ? 'border-red-900/50 text-red-200' : 'border-neutral-800 text-emerald-200'} whitespace-pre-wrap overflow-x-auto`}>
                                    {selectedLog.error
                                        ? `Error: ${selectedLog.error}`
                                        : JSON.stringify(selectedLog.output, null, 2)
                                    }
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}

function RunEvalsView() {
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runEvals = async () => {
        setRunning(true);
        setResults(null);
        try {
            const res = await axios.post(`${API_URL}/evals/run`);
            setResults(res.data);
        } catch (e) {
            console.error(e);
            alert("Failed to run evals");
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-cyan-500" />
                        Dataset: dataset_food_parsing.json
                    </h3>
                    <button
                        onClick={runEvals}
                        disabled={running}
                        className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${running
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20'
                            }`}
                    >
                        {running ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {running ? 'Running Suite...' : 'Run Evaluation Suite'}
                    </button>
                </div>

                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
                    >
                        <ResultCard
                            title="Simple Assertions"
                            passRate={results.assertions.pass_rate}
                            total={results.assertions.total}
                            passed={results.assertions.passed}
                        />
                        <ResultCard
                            title="LLM-as-a-Judge"
                            passRate={results.judge.pass_rate}
                            total={results.judge.total}
                            passed={results.judge.passed}
                        />
                        {results.macros && (
                            <ResultCard
                                title="Nutrient Accuracy"
                                passRate={results.macros.pass_rate}
                                total={results.macros.total}
                                passed={results.macros.passed}
                            />
                        )}
                    </motion.div>
                )}
            </div>

            {results && (
                <div className="space-y-4">
                    {/* Failed Assertions */}
                    {results.assertions.failed_examples?.length > 0 && (
                        <div className="bg-red-950/10 border border-red-900/50 rounded-xl p-4">
                            <h4 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Failed Assertions
                            </h4>
                            <div className="space-y-2">
                                {results.assertions.failed_examples.map((fail: any, i: number) => (
                                    <div key={i} className="bg-red-950/20 p-3 rounded text-xs font-mono text-red-200">
                                        <div>Input: "{fail.input}"</div>
                                        <div className="opacity-70 mt-1">Reason: {fail.reason}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Failed Macros */}
                    {results.macros?.failed_examples?.length > 0 && (
                        <div className="bg-yellow-950/10 border border-yellow-900/50 rounded-xl p-4">
                            <h4 className="text-yellow-400 font-bold text-sm mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Nutrient Alerts
                            </h4>
                            <div className="space-y-2">
                                {results.macros.failed_examples.map((fail: any, i: number) => (
                                    <div key={i} className="bg-yellow-950/20 p-3 rounded text-xs font-mono text-yellow-200">
                                        <div>Food: "{fail.input}"</div>
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <div className="opacity-70">Reason: {fail.reason}</div>
                                            <div className="opacity-50">{JSON.stringify(fail.output, null, 0)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Failed Judge */}
                    {results.judge.failed_examples?.length > 0 && (
                        <div className="bg-orange-950/10 border border-orange-900/50 rounded-xl p-4">
                            <h4 className="text-orange-400 font-bold text-sm mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Judge Rejections
                            </h4>
                            <div className="space-y-2">
                                {results.judge.failed_examples.map((fail: any, i: number) => (
                                    <div key={i} className="bg-orange-950/20 p-3 rounded text-xs font-mono text-orange-200 space-y-2">
                                        <div className="font-bold">Input: "{fail.input}"</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-black/30 p-2 rounded">
                                                <span className="block text-[10px] uppercase tracking-wider opacity-50 mb-1">Expected</span>
                                                {JSON.stringify(fail.expected, null, 2)}
                                            </div>
                                            <div className="bg-black/30 p-2 rounded border border-orange-500/20">
                                                <span className="block text-[10px] uppercase tracking-wider opacity-50 mb-1">Actual</span>
                                                {JSON.stringify(fail.actual, null, 2)}
                                            </div>
                                        </div>
                                        <div className="text-orange-300 italic px-2 border-l-2 border-orange-500">
                                            "Judge: {fail.judge_reason}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ResultCard({ title, passRate, total, passed }: any) {
    const percentage = Math.round(passRate * 100);
    const isGood = percentage >= 90;

    return (
        <div className={`p-4 rounded-lg border ${isGood ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-red-950/10 border-red-900/30'}`}>
            <h4 className="text-neutral-400 text-xs font-bold uppercase tracking-widest">{title}</h4>
            <div className="mt-2 flex items-end gap-2">
                <span className={`text-3xl font-bold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                    {percentage}%
                </span>
                <span className="text-sm text-neutral-500 mb-1">
                    ({passed}/{total} Passed)
                </span>
            </div>
            <div className="w-full bg-neutral-800 h-1.5 mt-3 rounded-full overflow-hidden">
                <div
                    className={`h-full ${isGood ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
