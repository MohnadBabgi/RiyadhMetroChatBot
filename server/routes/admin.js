import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { faqOperations, getDatabase, saveDatabase } from '../services/database.js';
import { generateAndSaveFaqEmbedding, generateAllEmbeddings, loadFaqEmbeddings } from '../services/embeddings.js';

const router = express.Router();

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Initialize admin user if not exists
async function initializeAdmin() {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM admin_users WHERE username = ?');
    stmt.bind(['admin']);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    const admin = results[0];

    if (!admin) {
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)', ['admin', hashedPassword]);
        saveDatabase();
        console.log('✅ Admin user created');
    }
}

// Export for calling after database init
export { initializeAdmin };

// POST /api/admin/login - Admin login
router.post('/login',
    body('username').isString().trim().notEmpty(),
    body('password').isString().notEmpty(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: 'Invalid credentials format' });
            }

            const { username, password } = req.body;
            const db = await getDatabase();

            const stmt = db.prepare('SELECT * FROM admin_users WHERE username = ?');
            stmt.bind([username]);
            let user = null;
            if (stmt.step()) {
                user = stmt.getAsObject();
            }
            stmt.free();

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT
            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                success: true,
                token,
                user: { id: user.id, username: user.username }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

// GET /api/admin/verify - Verify token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// ============ FAQ CRUD ============

// GET /api/admin/faqs - Get all FAQs (admin)
router.get('/faqs', authenticateToken, (req, res) => {
    try {
        const faqs = faqOperations.getAll(req.query);
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
                featured: faq.featured === 1,
                hasEmbedding: !!faq.embedding,
                createdAt: faq.created_at,
                updatedAt: faq.updated_at
            }))
        });
    } catch (error) {
        console.error('Admin get FAQs error:', error);
        res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
});

// POST /api/admin/faqs - Create FAQ
router.post('/faqs',
    authenticateToken,
    body('question').isString().trim().isLength({ min: 5 }),
    body('answer').isString().trim().isLength({ min: 5 }),
    body('category').optional().isString(),
    body('tags').optional().isArray(),
    body('featured').optional().isBoolean(),
    body('questionEn').optional().isString(),
    body('answerEn').optional().isString(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: 'Validation failed', details: errors.array() });
            }

            const { question, questionEn, answer, answerEn, category, tags, featured } = req.body;

            // Create FAQ
            const faq = faqOperations.create({
                question,
                question_en: questionEn,
                answer,
                answer_en: answerEn,
                category: category || 'general',
                tags: tags || [],
                featured: featured || false
            });

            // Generate embedding
            try {
                await generateAndSaveFaqEmbedding(faq.id);
            } catch (embError) {
                console.error('Failed to generate embedding:', embError.message);
            }

            res.status(201).json({ success: true, data: faq });

        } catch (error) {
            console.error('Create FAQ error:', error);
            res.status(500).json({ error: 'Failed to create FAQ' });
        }
    }
);

// PUT /api/admin/faqs/:id - Update FAQ
router.put('/faqs/:id',
    authenticateToken,
    body('question').optional().isString().trim().isLength({ min: 5 }),
    body('answer').optional().isString().trim().isLength({ min: 5 }),
    body('category').optional().isString(),
    body('tags').optional().isArray(),
    body('featured').optional().isBoolean(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: 'Validation failed', details: errors.array() });
            }

            const id = parseInt(req.params.id);
            const existing = faqOperations.getById(id);

            if (!existing) {
                return res.status(404).json({ error: 'FAQ not found' });
            }

            const { question, questionEn, answer, answerEn, category, tags, featured } = req.body;

            const updatedFaq = faqOperations.update(id, {
                question,
                question_en: questionEn,
                answer,
                answer_en: answerEn,
                category,
                tags,
                featured
            });

            // Regenerate embedding if question or answer changed
            if (question || answer) {
                try {
                    await generateAndSaveFaqEmbedding(id);
                } catch (embError) {
                    console.error('Failed to regenerate embedding:', embError.message);
                }
            }

            res.json({ success: true, data: updatedFaq });

        } catch (error) {
            console.error('Update FAQ error:', error);
            res.status(500).json({ error: 'Failed to update FAQ' });
        }
    }
);

// DELETE /api/admin/faqs/:id - Delete FAQ
router.delete('/faqs/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = faqOperations.getById(id);

        if (!existing) {
            return res.status(404).json({ error: 'FAQ not found' });
        }

        faqOperations.delete(id);

        // Reload embeddings
        await loadFaqEmbeddings();

        res.json({ success: true, message: 'FAQ deleted' });

    } catch (error) {
        console.error('Delete FAQ error:', error);
        res.status(500).json({ error: 'Failed to delete FAQ' });
    }
});

// POST /api/admin/faqs/regenerate-embeddings - Regenerate all embeddings
router.post('/faqs/regenerate-embeddings', authenticateToken, async (req, res) => {
    try {
        const count = await generateAllEmbeddings();
        res.json({ success: true, message: `Regenerated embeddings for ${count} FAQs` });
    } catch (error) {
        console.error('Regenerate embeddings error:', error);
        res.status(500).json({ error: 'Failed to regenerate embeddings' });
    }
});

export default router;
