import express from 'express';
import { body, validationResult } from 'express-validator';
import { searchFaqs, detectLanguage } from '../services/embeddings.js';
import { logOperations } from '../services/database.js';

const router = express.Router();

// POST /api/chat - Process user query and return answer
router.post('/',
    body('query').isString().trim().isLength({ min: 2, max: 500 }),
    body('sessionId').optional().isString(),
    async (req, res) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Invalid query',
                    details: errors.array()
                });
            }

            const { query, sessionId } = req.body;

            // Search for best match
            const result = await searchFaqs(query, 5);

            // Prepare response based on confidence
            let response;
            if (result.isConfident && result.bestMatch) {
                response = {
                    success: true,
                    answer: result.bestMatch.answer,
                    answerEn: result.bestMatch.answerEn,
                    matchedQuestion: result.bestMatch.question,
                    matchedQuestionEn: result.bestMatch.questionEn,
                    category: result.bestMatch.category,
                    confidence: result.bestMatch.confidence,
                    isConfident: true,
                    suggestions: result.suggestions.map(s => ({
                        id: s.id,
                        question: s.question,
                        questionEn: s.questionEn,
                        confidence: s.confidence
                    })),
                    language: result.language,
                    processingTime: result.processingTime,
                    logId: null
                };
            } else {
                // Low confidence response
                response = {
                    success: true,
                    answer: result.language === 'ar'
                        ? 'لست متأكدًا تمامًا - إليك أقرب النتائج'
                        : "I'm not fully sure—here are the closest results",
                    answerEn: "I'm not fully sure—here are the closest results",
                    matchedQuestion: result.bestMatch?.question || null,
                    matchedQuestionEn: result.bestMatch?.questionEn || null,
                    category: result.bestMatch?.category || null,
                    confidence: result.bestMatch?.confidence || 0,
                    isConfident: false,
                    candidates: result.allResults.slice(0, 3).map(c => ({
                        id: c.id,
                        question: c.question,
                        questionEn: c.questionEn,
                        answer: c.answer,
                        answerEn: c.answerEn,
                        confidence: c.confidence
                    })),
                    suggestions: [],
                    language: result.language,
                    processingTime: result.processingTime,
                    logId: null
                };
            }

            // Log the query
            try {
                const logEntry = logOperations.create({
                    query,
                    language: result.language,
                    topFaqId: result.bestMatch?.id || null,
                    score: result.bestMatch?.score || null,
                    sessionId
                });
                response.logId = logEntry.id;
            } catch (logError) {
                console.error('Failed to log query:', logError.message);
            }

            res.json(response);

        } catch (error) {
            console.error('Chat error:', error);
            res.status(500).json({
                error: 'Failed to process query',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// POST /api/chat/feedback - Submit feedback for a query
router.post('/feedback',
    body('logId').isInt({ min: 1 }),
    body('feedback').isIn(['positive', 'negative']),
    body('reason').optional().isString().isLength({ max: 200 }),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Invalid feedback data',
                    details: errors.array()
                });
            }

            const { logId, feedback, reason } = req.body;

            logOperations.updateFeedback(logId, feedback, reason);

            res.json({ success: true, message: 'Feedback recorded' });

        } catch (error) {
            console.error('Feedback error:', error);
            res.status(500).json({ error: 'Failed to record feedback' });
        }
    }
);

export default router;
