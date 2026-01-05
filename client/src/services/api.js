import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

// Chat API
export const chatApi = {
    sendMessage: async (query, sessionId = null) => {
        const response = await api.post('/chat', { query, sessionId });
        return response.data;
    },

    sendFeedback: async (logId, feedback, reason = null) => {
        const response = await api.post('/chat/feedback', { logId, feedback, reason });
        return response.data;
    }
};

// FAQ API
export const faqApi = {
    getAll: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await api.get(`/faqs?${params}`);
        return response.data;
    },

    getCategories: async () => {
        const response = await api.get('/faqs/categories');
        return response.data;
    },

    getFeatured: async () => {
        const response = await api.get('/faqs/featured');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/faqs/${id}`);
        return response.data;
    }
};

// Admin API
export const adminApi = {
    getFaqs: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await api.get(`/admin/faqs?${params}`);
        return response.data;
    },

    createFaq: async (faq) => {
        const response = await api.post('/admin/faqs', faq);
        return response.data;
    },

    updateFaq: async (id, faq) => {
        const response = await api.put(`/admin/faqs/${id}`, faq);
        return response.data;
    },

    deleteFaq: async (id) => {
        const response = await api.delete(`/admin/faqs/${id}`);
        return response.data;
    },

    regenerateEmbeddings: async () => {
        const response = await api.post('/admin/faqs/regenerate-embeddings');
        return response.data;
    }
};

// Analytics API
export const analyticsApi = {
    getDashboard: async (days = 30) => {
        const response = await api.get(`/analytics/dashboard?days=${days}`);
        return response.data;
    },

    getLogs: async (limit = 100) => {
        const response = await api.get(`/analytics/logs?limit=${limit}`);
        return response.data;
    },

    exportCsv: async (days = 30) => {
        const response = await api.get(`/analytics/export?days=${days}`, {
            responseType: 'blob'
        });
        return response.data;
    }
};

export default api;
