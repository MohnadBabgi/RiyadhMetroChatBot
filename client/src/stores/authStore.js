import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (username, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/admin/login', { username, password });
                    const { token, user } = response.data;

                    set({
                        token,
                        user,
                        isAuthenticated: true,
                        isLoading: false
                    });

                    return true;
                } catch (error) {
                    set({
                        error: error.response?.data?.error || 'Login failed',
                        isLoading: false
                    });
                    return false;
                }
            },

            logout: () => {
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    error: null
                });
            },

            verifyToken: async () => {
                const { token } = get();
                if (!token) return false;

                try {
                    await api.get('/admin/verify', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    return true;
                } catch {
                    get().logout();
                    return false;
                }
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
        }
    )
);
