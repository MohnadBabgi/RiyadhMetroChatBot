import { Routes, Route, Navigate } from 'react-router-dom';
import { useLanguageStore } from './stores/languageStore';
import ChatPage from './pages/ChatPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminFaqs from './pages/AdminFaqs';
import AdminLogs from './pages/AdminLogs';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { language, direction } = useLanguageStore();
  
  return (
    <div dir={direction} lang={language} className="min-h-screen">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<ChatPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/faqs" element={<ProtectedRoute><AdminFaqs /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute><AdminLogs /></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
