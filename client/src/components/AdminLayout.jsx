import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileQuestion, History, LogOut, 
  Train, ChevronRight, Menu, X 
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../stores/languageStore';

function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const t = useTranslation();
  
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };
  
  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: t.admin.dashboard },
    { path: '/admin/faqs', icon: FileQuestion, label: t.admin.faqs },
    { path: '/admin/logs', icon: History, label: t.admin.logs },
  ];
  
  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
      >
        <item.icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
        {isActive && <ChevronRight className="w-4 h-4 ms-auto" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-e border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-metro flex items-center justify-center">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">{t.appTitle}</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>
        
        {/* User & Logout */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/50">
            <div>
              <p className="text-sm font-medium text-white">{user?.username || 'Admin'}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title={t.admin.logout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 glass border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-metro flex items-center justify-center">
              <Train className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">Admin</span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        >
          <aside
            className="w-64 h-full bg-slate-900 border-e border-slate-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-metro flex items-center justify-center">
                  <Train className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">{t.appTitle}</span>
              </Link>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navItems.map(item => (
                <NavLink key={item.path} item={item} />
              ))}
            </nav>
          </aside>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto lg:pt-0 pt-16">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
