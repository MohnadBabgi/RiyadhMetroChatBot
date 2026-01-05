import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, MessageSquare, FileQuestion, LogOut, 
  TrendingUp, AlertTriangle, HelpCircle, BarChart3,
  Download, RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { analyticsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../stores/languageStore';
import AdminLayout from '../components/AdminLayout';

function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);
  const t = useTranslation();
  
  useEffect(() => {
    fetchAnalytics();
  }, [days]);
  
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await analyticsApi.getDashboard(days);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExport = async () => {
    try {
      const blob = await analyticsApi.exportCsv(days);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.admin.dashboard}</h1>
            <p className="text-slate-400">{t.admin.analytics}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
            <button onClick={fetchAnalytics} className="btn-ghost p-2" title="Refresh">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              {t.admin.export}
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : analytics ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={MessageSquare}
                label={t.admin.totalQueries}
                value={analytics.totalQueries.toLocaleString()}
                color="bg-sky-500"
                subtext={`Last ${days} days`}
              />
              <StatCard
                icon={TrendingUp}
                label={t.admin.avgConfidence}
                value={`${analytics.avgConfidence}%`}
                color="bg-emerald-500"
              />
              <StatCard
                icon={AlertTriangle}
                label={t.admin.lowConfidence}
                value={analytics.lowConfidenceCount.toLocaleString()}
                color="bg-amber-500"
                subtext="< 55% confidence"
              />
              <StatCard
                icon={HelpCircle}
                label={t.admin.totalFaqs}
                value={analytics.totalFaqs.toLocaleString()}
                color="bg-purple-500"
              />
            </div>
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Queries Over Time */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Queries Over Time</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.queriesByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#f8fafc' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Top FAQs */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Matched FAQs</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.topFaqs.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#64748b" fontSize={12} />
                      <YAxis type="category" dataKey="question" stroke="#64748b" fontSize={10} width={150} tick={{ width: 150 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#f8fafc' }}
                      />
                      <Bar dataKey="hits" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Unanswered Queries */}
            {analytics.unansweredQueries.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Low Confidence Queries
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-start py-3 px-4 text-slate-400 font-medium">Query</th>
                        <th className="text-start py-3 px-4 text-slate-400 font-medium">Score</th>
                        <th className="text-start py-3 px-4 text-slate-400 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.unansweredQueries.slice(0, 10).map((query, idx) => (
                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="py-3 px-4 text-white">{query.query}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-lg">
                              {Math.round(query.score * 100)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-sm">
                            {new Date(query.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-slate-400">
            Failed to load analytics
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
