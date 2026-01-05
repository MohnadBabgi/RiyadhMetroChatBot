import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, ThumbsUp, ThumbsDown, Search, 
  Download, Filter, Calendar
} from 'lucide-react';
import { analyticsApi } from '../services/api';
import { useTranslation } from '../stores/languageStore';
import AdminLayout from '../components/AdminLayout';

function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, positive, negative, low
  const [search, setSearch] = useState('');
  const t = useTranslation();
  
  useEffect(() => {
    fetchLogs();
  }, []);
  
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await analyticsApi.getLogs(500);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredLogs = logs.filter(log => {
    // Apply filter
    if (filter === 'positive' && log.feedback !== 'positive') return false;
    if (filter === 'negative' && log.feedback !== 'negative') return false;
    if (filter === 'low' && log.score >= 55) return false;
    
    // Apply search
    if (search && !log.query.toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });
  
  const handleExport = async () => {
    try {
      const blob = await analyticsApi.exportCsv(30);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-400 bg-emerald-400/10';
    if (score >= 55) return 'text-sky-400 bg-sky-400/10';
    return 'text-amber-400 bg-amber-400/10';
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.admin.logs}</h1>
            <p className="text-slate-400">{filteredLogs.length} of {logs.length} queries</p>
          </div>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t.admin.export} CSV
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-64 max-w-md relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queries..."
              className="input-field ps-12"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            {['all', 'positive', 'negative', 'low'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {f === 'all' ? 'All' : f === 'positive' ? '👍 Positive' : f === 'negative' ? '👎 Negative' : '⚠️ Low Score'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Logs Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-start py-4 px-4 text-slate-300 font-medium">Query</th>
                    <th className="text-start py-4 px-4 text-slate-300 font-medium">Matched FAQ</th>
                    <th className="text-start py-4 px-4 text-slate-300 font-medium">Score</th>
                    <th className="text-start py-4 px-4 text-slate-300 font-medium">Feedback</th>
                    <th className="text-start py-4 px-4 text-slate-300 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="border-t border-slate-700/50 hover:bg-slate-700/30"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                          <div>
                            <p className="text-white max-w-xs" dir={log.language === 'ar' ? 'rtl' : 'ltr'}>
                              {log.query}
                            </p>
                            <span className="text-xs text-slate-500">{log.language.toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-slate-300 line-clamp-2 max-w-xs" dir="rtl">
                          {log.matchedQuestion || '-'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {log.score !== null ? (
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getScoreColor(log.score)}`}>
                            {log.score}%
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {log.feedback === 'positive' && (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm">Positive</span>
                          </div>
                        )}
                        {log.feedback === 'negative' && (
                          <div className="flex items-center gap-1 text-red-400">
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-sm">Negative</span>
                            {log.feedbackReason && (
                              <span className="text-xs text-slate-500">({log.feedbackReason})</span>
                            )}
                          </div>
                        )}
                        {!log.feedback && (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No logs found
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminLogs;
