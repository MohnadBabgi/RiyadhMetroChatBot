import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { getTranslation } from './data/translations.js';

// Import routes
import chatRoutes from './routes/chat.js';
import faqRoutes from './routes/faqs.js';
import adminRoutes, { initializeAdmin } from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';

// Import services
import { initializeDatabase, faqOperations } from './services/database.js';
import { initializeEmbeddings } from './services/embeddings.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Chat endpoint has stricter rate limiting
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: { error: 'Too many chat requests, please slow down.' }
});
app.use('/api/chat', chatLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Auto-seed database from CSV if empty
async function seedDatabaseFromCSV() {
  const csvPath = path.join(__dirname, '../Dataset.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('❌ Dataset.csv not found at:', csvPath);
    return;
  }

  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true
    });

    console.log(`📄 Found ${records.length} records in CSV`);
    let inserted = 0;

    for (const record of records) {
      const question = record['السؤال']?.trim();
      const answer = record['الإجابة']?.trim();

      if (!question || !answer || question === '0' || answer === '0') {
        continue;
      }

      // Detect category based on keywords
      const text = `${question} ${answer}`.toLowerCase();
      let category = 'general';
      if (text.includes('خط') || text.includes('line')) category = 'lines';
      else if (text.includes('محطة') || text.includes('station')) category = 'stations';
      else if (text.includes('موعد') || text.includes('ساعة') || text.includes('وقت')) category = 'schedules';
      else if (text.includes('تذكرة') || text.includes('سعر') || text.includes('ريال')) category = 'tickets';

      // Look for English translation
      const translation = getTranslation(question, answer);

      faqOperations.create({
        question,
        question_en: translation?.question_en || null,
        answer,
        answer_en: translation?.answer_en || null,
        category,
        tags: [],
        language: 'ar', // Primary language is still Arabic
        featured: false
      });
      inserted++;
    }

    console.log(`✅ Auto-seeded ${inserted} FAQs from Dataset.csv`);
  } catch (error) {
    console.error('❌ Failed to auto-seed database:', error.message);
  }
}

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Starting Riyadh Metro FAQ Assistant...');

    // Initialize database
    console.log('📦 Initializing database...');
    await initializeDatabase();

    // Auto-seed if database is empty
    const faqCount = faqOperations.count();
    if (faqCount === 0) {
      console.log('📄 Database empty, auto-seeding from Dataset.csv...');
      await seedDatabaseFromCSV();
    } else {
      console.log(`📊 Found ${faqCount} FAQs in database`);
    }

    // Initialize admin user
    await initializeAdmin();

    // Initialize embeddings model
    console.log('🧠 Loading embedding model...');
    await initializeEmbeddings();

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      const clientDistPath = path.join(__dirname, '../client/dist');
      console.log(`📂 Serving static files from: ${clientDistPath}`);

      app.use(express.static(clientDistPath));

      // Handle client-side routing
      app.get('*', (req, res) => {
        // Skip API routes that might have slipped through (though they are defined before)
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
      });
    }

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
