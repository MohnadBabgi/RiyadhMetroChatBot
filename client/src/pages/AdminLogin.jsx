import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Train, Lock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../stores/languageStore';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();
  
  const from = location.state?.from?.pathname || '/admin';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    const success = await login(username, password);
    if (success) {
      navigate(from, { replace: true });
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-metro flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/25">
            <Train className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {t.admin.dashboard}
          </h1>
          <p className="text-slate-400 mt-2">{t.admin.login}</p>
        </div>
        
        {/* Login Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t.admin.username}
              </label>
              <div className="relative">
                <User className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field ps-12"
                  placeholder="admin"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t.admin.password}
              </label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field ps-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  {t.admin.login}
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-slate-500 text-sm mt-6">
          <a href="/" className="text-sky-400 hover:text-sky-300 transition-colors">
            ← {t.appTitle}
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default AdminLogin;
