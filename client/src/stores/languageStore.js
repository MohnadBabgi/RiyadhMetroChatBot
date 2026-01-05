import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLanguageStore = create(
    persist(
        (set) => ({
            language: 'ar',
            direction: 'rtl',

            setLanguage: (lang) => set({
                language: lang,
                direction: lang === 'ar' ? 'rtl' : 'ltr'
            }),

            toggleLanguage: () => set((state) => ({
                language: state.language === 'ar' ? 'en' : 'ar',
                direction: state.language === 'ar' ? 'ltr' : 'rtl'
            })),
        }),
        {
            name: 'language-storage',
        }
    )
);

// Translation strings
export const translations = {
    ar: {
        appTitle: 'مساعد مترو الرياض',
        appSubtitle: 'اسأل أي سؤال عن مترو الرياض',
        placeholder: 'اكتب سؤالك هنا...',
        send: 'إرسال',
        thinking: 'جاري التفكير...',
        confidence: 'نسبة الثقة',
        relatedQuestions: 'أسئلة ذات صلة',
        notSure: 'لست متأكدًا تمامًا - إليك أقرب النتائج',
        helpful: 'هل كانت هذه الإجابة مفيدة؟',
        categories: {
            general: 'معلومات عامة',
            lines: 'الخطوط',
            stations: 'المحطات',
            schedules: 'المواعيد',
            tickets: 'التذاكر',
            facilities: 'المرافق',
            accessibility: 'إمكانية الوصول',
            safety: 'السلامة',
            app: 'التطبيق'
        },
        categoryIcons: {
            general: '🚇',
            lines: '🛤️',
            stations: '🏢',
            schedules: '🕐',
            tickets: '🎫',
            facilities: '🏗️',
            accessibility: '♿',
            safety: '🛡️',
            app: '📱'
        },
        quickButtons: [
            { key: 'tickets', label: 'التذاكر والأسعار' },
            { key: 'schedules', label: 'ساعات العمل' },
            { key: 'lines', label: 'الخطوط' },
            { key: 'stations', label: 'المحطات' },
            { key: 'facilities', label: 'المرافق' },
            { key: 'safety', label: 'السلامة' }
        ],
        welcomeMessage: 'مرحباً! أنا مساعد مترو الرياض. كيف يمكنني مساعدتك اليوم؟',
        admin: {
            login: 'تسجيل الدخول',
            logout: 'تسجيل الخروج',
            dashboard: 'لوحة التحكم',
            faqs: 'الأسئلة الشائعة',
            logs: 'سجل البحث',
            analytics: 'التحليلات',
            totalQueries: 'إجمالي الاستعلامات',
            avgConfidence: 'متوسط الثقة',
            lowConfidence: 'ثقة منخفضة',
            totalFaqs: 'إجمالي الأسئلة',
            username: 'اسم المستخدم',
            password: 'كلمة المرور',
            addFaq: 'إضافة سؤال',
            editFaq: 'تعديل السؤال',
            deleteFaq: 'حذف السؤال',
            question: 'السؤال',
            answer: 'الإجابة',
            category: 'التصنيف',
            featured: 'مميز',
            save: 'حفظ',
            cancel: 'إلغاء',
            export: 'تصدير',
            search: 'بحث...'
        }
    },
    en: {
        appTitle: 'Riyadh Metro Assistant',
        appSubtitle: 'Ask any question about Riyadh Metro',
        placeholder: 'Type your question here...',
        send: 'Send',
        thinking: 'Thinking...',
        confidence: 'Confidence',
        relatedQuestions: 'Related Questions',
        notSure: "I'm not fully sure—here are the closest results",
        helpful: 'Was this answer helpful?',
        categories: {
            general: 'General Info',
            lines: 'Lines',
            stations: 'Stations',
            schedules: 'Schedules',
            tickets: 'Tickets',
            facilities: 'Facilities',
            accessibility: 'Accessibility',
            safety: 'Safety',
            app: 'App'
        },
        categoryIcons: {
            general: '🚇',
            lines: '🛤️',
            stations: '🏢',
            schedules: '🕐',
            tickets: '🎫',
            facilities: '🏗️',
            accessibility: '♿',
            safety: '🛡️',
            app: '📱'
        },
        quickButtons: [
            { key: 'tickets', label: 'Tickets & Prices' },
            { key: 'schedules', label: 'Operating Hours' },
            { key: 'lines', label: 'Metro Lines' },
            { key: 'stations', label: 'Stations' },
            { key: 'facilities', label: 'Facilities' },
            { key: 'safety', label: 'Safety' }
        ],
        welcomeMessage: "Hello! I'm Riyadh Metro Assistant. How can I help you today?",
        admin: {
            login: 'Login',
            logout: 'Logout',
            dashboard: 'Dashboard',
            faqs: 'FAQs',
            logs: 'Query Logs',
            analytics: 'Analytics',
            totalQueries: 'Total Queries',
            avgConfidence: 'Avg Confidence',
            lowConfidence: 'Low Confidence',
            totalFaqs: 'Total FAQs',
            username: 'Username',
            password: 'Password',
            addFaq: 'Add FAQ',
            editFaq: 'Edit FAQ',
            deleteFaq: 'Delete FAQ',
            question: 'Question',
            answer: 'Answer',
            category: 'Category',
            featured: 'Featured',
            save: 'Save',
            cancel: 'Cancel',
            export: 'Export',
            search: 'Search...'
        }
    }
};

export const useTranslation = () => {
    const { language } = useLanguageStore();
    return translations[language] || translations.ar;
};
