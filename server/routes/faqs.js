import express from 'express';
import { faqOperations, categoryOperations } from '../services/database.js';

const router = express.Router();

// GET /api/faqs - Get all FAQs (public)
router.get('/', (req, res) => {
    try {
        const { category, language, featured, search, limit, offset } = req.query;

        const filters = {};
        if (category) filters.category = category;
        if (language) filters.language = language;
        if (featured !== undefined) filters.featured = featured === 'true';
        if (search) filters.search = search;
        if (limit) filters.limit = parseInt(limit);
        if (offset) filters.offset = parseInt(offset);

        const faqs = faqOperations.getAll(filters);
        const total = faqOperations.count();

        res.json({
            success: true,
            data: faqs.map(faq => ({
                id: faq.id,
                question: faq.question,
                questionEn: faq.question_en,
                answer: faq.answer,
                answerEn: faq.answer_en,
                category: faq.category,
                tags: JSON.parse(faq.tags || '[]'),
                language: faq.language,
                featured: faq.featured === 1
            })),
            total,
            count: faqs.length
        });

    } catch (error) {
        console.error('Get FAQs error:', error);
        res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
});

// GET /api/faqs/categories - Get all categories
router.get('/categories', (req, res) => {
    try {
        const categories = categoryOperations.getAll();
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/faqs/featured - Get featured FAQs
router.get('/featured', (req, res) => {
    try {
        const faqs = faqOperations.getAll({ featured: true, limit: 10 });
        res.json({
            success: true,
            data: faqs.map(faq => ({
                id: faq.id,
                question: faq.question,
                questionEn: faq.question_en,
                answer: faq.answer,
                answerEn: faq.answer_en,
                category: faq.category
            }))
        });
    } catch (error) {
        console.error('Get featured FAQs error:', error);
        res.status(500).json({ error: 'Failed to fetch featured FAQs' });
    }
});

// GET /api/faqs/:id - Get single FAQ
router.get('/:id', (req, res) => {
    try {
        const faq = faqOperations.getById(parseInt(req.params.id));

        if (!faq) {
            return res.status(404).json({ error: 'FAQ not found' });
        }

        res.json({
            success: true,
            data: {
                id: faq.id,
                question: faq.question,
                questionEn: faq.question_en,
                answer: faq.answer,
                answerEn: faq.answer_en,
                category: faq.category,
                tags: JSON.parse(faq.tags || '[]'),
                language: faq.language,
                featured: faq.featured === 1
            }
        });

    } catch (error) {
        console.error('Get FAQ error:', error);
        res.status(500).json({ error: 'Failed to fetch FAQ' });
    }
});

export default router;
