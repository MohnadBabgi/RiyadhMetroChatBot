import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Search, Star, StarOff, 
  RefreshCw, X, Check, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../services/api';
import { useTranslation } from '../stores/languageStore';
import AdminLayout from '../components/AdminLayout';

function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingFaq, setEditingFaq] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const t = useTranslation();
  
  const categories = [
    { value: '', label: 'All' },
    { value: 'general', label: t.categories.general },
    { value: 'lines', label: t.categories.lines },
    { value: 'stations', label: t.categories.stations },
    { value: 'schedules', label: t.categories.schedules },
    { value: 'tickets', label: t.categories.tickets },
    { value: 'facilities', label: t.categories.facilities },
    { value: 'accessibility', label: t.categories.accessibility },
    { value: 'safety', label: t.categories.safety },
    { value: 'app', label: t.categories.app },
  ];
  
  useEffect(() => {
    fetchFaqs();
  }, [selectedCategory]);
  
  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const filters = {};
      if (selectedCategory) filters.category = selectedCategory;
      if (search) filters.search = search;
      
      const response = await adminApi.getFaqs(filters);
      setFaqs(response.data);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchFaqs();
  };
  
  const handleCreate = () => {
    setEditingFaq({
      question: '',
      questionEn: '',
      answer: '',
      answerEn: '',
      category: 'general',
      featured: false
    });
    setIsModalOpen(true);
  };
  
  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setIsModalOpen(true);
  };
  
  const handleSave = async () => {
    if (!editingFaq.question || !editingFaq.answer) {
      toast.error('Question and answer are required');
      return;
    }
    
    try {
      if (editingFaq.id) {
        await adminApi.updateFaq(editingFaq.id, editingFaq);
        toast.success('FAQ updated successfully');
      } else {
        await adminApi.createFaq(editingFaq);
        toast.success('FAQ created successfully');
      }
      setIsModalOpen(false);
      setEditingFaq(null);
      fetchFaqs();
    } catch (error) {
      console.error('Failed to save FAQ:', error);
      toast.error('Failed to save FAQ');
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    
    try {
      await adminApi.deleteFaq(id);
      toast.success('FAQ deleted successfully');
      fetchFaqs();
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
      toast.error('Failed to delete FAQ');
    }
  };
  
  const handleToggleFeatured = async (faq) => {
    try {
      await adminApi.updateFaq(faq.id, { featured: !faq.featured });
      fetchFaqs();
    } catch (error) {
      console.error('Failed to update FAQ:', error);
    }
  };
  
  const handleRegenerateEmbeddings = async () => {
    if (!confirm('This will regenerate embeddings for all FAQs. Continue?')) return;
    
    setIsRegenerating(true);
    try {
      const response = await adminApi.regenerateEmbeddings();
      toast.success(response.message);
    } catch (error) {
      console.error('Failed to regenerate embeddings:', error);
      toast.error('Failed to regenerate embeddings');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.admin.faqs}</h1>
            <p className="text-slate-400">{faqs.length} FAQs</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerateEmbeddings}
              disabled={isRegenerating}
              className="btn-ghost flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate Embeddings
            </button>
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t.admin.addFaq}
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <form onSubmit={handleSearch} className="flex-1 min-w-64 max-w-md">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.admin.search}
                className="input-field ps-12"
              />
            </div>
          </form>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        
        {/* FAQs Table */}
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
                    <th className="text-start py-4 px-4 text-slate-300 font-medium">Question</th>
                    <th className="text-start py-4 px-4 text-slate-300 font-medium">Answer</th>
                    <th className="text-start py-4 px-4 text-slate-300 font-medium">Category</th>
                    <th className="text-start py-4 px-4 text-slate-300 font-medium">Featured</th>
                    <th className="text-start py-4 px-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((faq, idx) => (
                    <motion.tr
                      key={faq.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-t border-slate-700/50 hover:bg-slate-700/30"
                    >
                      <td className="py-4 px-4">
                        <p className="text-white line-clamp-2 max-w-xs">{faq.question}</p>
                        {faq.questionEn && (
                          <p className="text-slate-400 text-sm mt-1 line-clamp-1">{faq.questionEn}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-slate-300 line-clamp-2 max-w-sm">{faq.answer}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-slate-600/50 text-slate-300 text-sm rounded-full">
                          {t.categoryIcons[faq.category]} {t.categories[faq.category] || faq.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleFeatured(faq)}
                          className={`p-2 rounded-lg transition-colors ${
                            faq.featured 
                              ? 'text-amber-400 bg-amber-400/10' 
                              : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'
                          }`}
                        >
                          {faq.featured ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(faq)}
                            className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(faq.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {faqs.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No FAQs found
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingFaq?.id ? t.admin.editFaq : t.admin.addFaq}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t.admin.question} (Arabic) *
                  </label>
                  <input
                    type="text"
                    value={editingFaq?.question || ''}
                    onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                    className="input-field"
                    dir="rtl"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t.admin.question} (English)
                  </label>
                  <input
                    type="text"
                    value={editingFaq?.questionEn || ''}
                    onChange={(e) => setEditingFaq({ ...editingFaq, questionEn: e.target.value })}
                    className="input-field"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t.admin.answer} (Arabic) *
                  </label>
                  <textarea
                    value={editingFaq?.answer || ''}
                    onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                    className="input-field min-h-24 resize-y"
                    dir="rtl"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t.admin.answer} (English)
                  </label>
                  <textarea
                    value={editingFaq?.answerEn || ''}
                    onChange={(e) => setEditingFaq({ ...editingFaq, answerEn: e.target.value })}
                    className="input-field min-h-24 resize-y"
                    dir="ltr"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t.admin.category}
                    </label>
                    <select
                      value={editingFaq?.category || 'general'}
                      onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                      className="input-field"
                    >
                      {categories.slice(1).map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t.admin.featured}
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditingFaq({ ...editingFaq, featured: !editingFaq?.featured })}
                      className={`w-full py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                        editingFaq?.featured
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                          : 'bg-slate-700/50 border-slate-600 text-slate-400'
                      }`}
                    >
                      {editingFaq?.featured ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                      {editingFaq?.featured ? 'Featured' : 'Not Featured'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  {t.admin.cancel}
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t.admin.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

export default AdminFaqs;
