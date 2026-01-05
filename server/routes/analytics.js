import express from 'express';
import jwt from 'jsonwebtoken';
import { logOperations, faqOperations } from '../services/database.js';

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

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', authenticateToken, (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const analytics = logOperations.getAnalytics(days);
        const faqCount = faqOperations.count();

        res.json({
            success: true,
            data: {
                ...analytics,
                totalFaqs: faqCount,
                period: `${days} days`
            }
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// GET /api/analytics/logs - Get query logs
router.get('/logs', authenticateToken, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = logOperations.getRecent(limit);

        res.json({
            success: true,
            data: logs.map(log => ({
                id: log.id,
                query: log.query,
                language: log.language,
                matchedQuestion: log.matched_question,
                score: log.score ? Math.round(log.score * 100) : null,
                feedback: log.feedback,
                feedbackReason: log.feedback_reason,
                createdAt: log.created_at
            }))
        });

    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// GET /api/analytics/export - Export analytics as CSV
router.get('/export', authenticateToken, (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const logs = logOperations.getRecent(1000);

        // Create CSV
        const headers = ['ID', 'Query', 'Language', 'Matched Question', 'Score', 'Feedback', 'Feedback Reason', 'Date'];
        const rows = logs.map(log => [
            log.id,
            `"${(log.query || '').replace(/"/g, '""')}"`,
            log.language,
            `"${(log.matched_question || '').replace(/"/g, '""')}"`,
            log.score ? Math.round(log.score * 100) : '',
            log.feedback || '',
            log.feedback_reason || '',
            log.created_at
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=query_logs_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

export default router;
