import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let SQL = null;
const dbPath = path.join(__dirname, '../../data/metro_faq.db');

export async function getDatabase() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

async function initDatabase() {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

// Save database to file
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

export async function initializeDatabase() {
  await getDatabase();

  // Create FAQs table
  db.run(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      question_en TEXT,
      answer TEXT NOT NULL,
      answer_en TEXT,
      category TEXT DEFAULT 'general',
      tags TEXT DEFAULT '[]',
      language TEXT DEFAULT 'ar',
      featured INTEGER DEFAULT 0,
      embedding TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Query Logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS query_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      language TEXT DEFAULT 'ar',
      top_faq_id INTEGER,
      score REAL,
      feedback TEXT,
      feedback_reason TEXT,
      session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Admin Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      name_ar TEXT NOT NULL,
      icon TEXT DEFAULT '📋',
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Insert default categories if not exist
  const defaultCategories = [
    ['general', 'معلومات عامة', '🚇', 1],
    ['lines', 'الخطوط', '🛤️', 2],
    ['stations', 'المحطات', '🏢', 3],
    ['schedules', 'المواعيد', '🕐', 4],
    ['tickets', 'التذاكر', '🎫', 5],
    ['facilities', 'المرافق', '🏗️', 6],
    ['accessibility', 'إمكانية الوصول', '♿', 7],
    ['safety', 'السلامة', '🛡️', 8],
    ['app', 'التطبيق', '📱', 9]
  ];

  defaultCategories.forEach(([name, nameAr, icon, order]) => {
    try {
      db.run(
        'INSERT OR IGNORE INTO categories (name, name_ar, icon, sort_order) VALUES (?, ?, ?, ?)',
        [name, nameAr, icon, order]
      );
    } catch (e) {
      // Ignore duplicates
    }
  });

  saveDatabase();
  console.log('✅ Database initialized successfully');
  return db;
}

// Helper to convert result to objects
function rowsToObjects(stmt) {
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}

// FAQ CRUD Operations
export const faqOperations = {
  getAll: (filters = {}) => {
    let query = 'SELECT * FROM faqs WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.language) {
      query += ' AND language = ?';
      params.push(filters.language);
    }
    if (filters.featured !== undefined) {
      query += ' AND featured = ?';
      params.push(filters.featured ? 1 : 0);
    }
    if (filters.search) {
      query += ' AND (question LIKE ? OR answer LIKE ? OR question_en LIKE ? OR answer_en LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT ${parseInt(filters.limit)}`;
    }
    if (filters.offset) {
      query += ` OFFSET ${parseInt(filters.offset)}`;
    }

    const stmt = db.prepare(query);
    params.forEach((p, i) => stmt.bind({ [i + 1]: p }));
    return rowsToObjects(stmt);
  },

  getById: (id) => {
    const stmt = db.prepare('SELECT * FROM faqs WHERE id = ?');
    stmt.bind([id]);
    const results = rowsToObjects(stmt);
    return results[0] || null;
  },

  create: (faq) => {
    db.run(`
      INSERT INTO faqs (question, question_en, answer, answer_en, category, tags, language, featured, embedding)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      faq.question,
      faq.question_en || null,
      faq.answer,
      faq.answer_en || null,
      faq.category || 'general',
      JSON.stringify(faq.tags || []),
      faq.language || 'ar',
      faq.featured ? 1 : 0,
      faq.embedding ? JSON.stringify(faq.embedding) : null
    ]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0];
    saveDatabase();
    return { id, ...faq };
  },

  update: (id, faq) => {
    const updates = [];
    const params = [];

    if (faq.question !== undefined) { updates.push('question = ?'); params.push(faq.question); }
    if (faq.question_en !== undefined) { updates.push('question_en = ?'); params.push(faq.question_en); }
    if (faq.answer !== undefined) { updates.push('answer = ?'); params.push(faq.answer); }
    if (faq.answer_en !== undefined) { updates.push('answer_en = ?'); params.push(faq.answer_en); }
    if (faq.category !== undefined) { updates.push('category = ?'); params.push(faq.category); }
    if (faq.tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(faq.tags)); }
    if (faq.language !== undefined) { updates.push('language = ?'); params.push(faq.language); }
    if (faq.featured !== undefined) { updates.push('featured = ?'); params.push(faq.featured ? 1 : 0); }
    if (faq.embedding !== undefined) { updates.push('embedding = ?'); params.push(JSON.stringify(faq.embedding)); }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    if (updates.length > 1) {
      db.run(`UPDATE faqs SET ${updates.join(', ')} WHERE id = ?`, params);
      saveDatabase();
    }

    return faqOperations.getById(id);
  },

  delete: (id) => {
    db.run('DELETE FROM faqs WHERE id = ?', [id]);
    saveDatabase();
    return { changes: 1 };
  },

  updateEmbedding: (id, embedding) => {
    db.run('UPDATE faqs SET embedding = ? WHERE id = ?', [JSON.stringify(embedding), id]);
    saveDatabase();
  },

  getAllWithEmbeddings: () => {
    const stmt = db.prepare('SELECT id, question, question_en, answer, answer_en, category, embedding FROM faqs WHERE embedding IS NOT NULL');
    return rowsToObjects(stmt);
  },

  count: () => {
    const result = db.exec('SELECT COUNT(*) as count FROM faqs');
    return result[0]?.values[0]?.[0] || 0;
  }
};

// Query Log Operations
export const logOperations = {
  create: (log) => {
    db.run(`
      INSERT INTO query_logs (query, language, top_faq_id, score, session_id)
      VALUES (?, ?, ?, ?, ?)
    `, [
      log.query,
      log.language || 'ar',
      log.topFaqId || null,
      log.score || null,
      log.sessionId || null
    ]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0];
    saveDatabase();
    return { id };
  },

  updateFeedback: (id, feedback, reason = null) => {
    db.run('UPDATE query_logs SET feedback = ?, feedback_reason = ? WHERE id = ?', [feedback, reason, id]);
    saveDatabase();
    return { changes: 1 };
  },

  getRecent: (limit = 100) => {
    const stmt = db.prepare(`
      SELECT ql.*, f.question as matched_question 
      FROM query_logs ql 
      LEFT JOIN faqs f ON ql.top_faq_id = f.id 
      ORDER BY ql.created_at DESC 
      LIMIT ?
    `);
    stmt.bind([limit]);
    return rowsToObjects(stmt);
  },

  getAnalytics: (days = 30) => {
    // Total queries
    const totalResult = db.exec(`
      SELECT COUNT(*) FROM query_logs 
      WHERE created_at >= datetime('now', '-${days} days')
    `);
    const totalQueries = totalResult[0]?.values[0]?.[0] || 0;

    // Average confidence
    const avgResult = db.exec(`
      SELECT AVG(score) FROM query_logs 
      WHERE score IS NOT NULL AND created_at >= datetime('now', '-${days} days')
    `);
    const avgConfidence = avgResult[0]?.values[0]?.[0] || 0;

    // Low confidence queries
    const lowResult = db.exec(`
      SELECT COUNT(*) FROM query_logs 
      WHERE score < 0.55 AND created_at >= datetime('now', '-${days} days')
    `);
    const lowConfidenceCount = lowResult[0]?.values[0]?.[0] || 0;

    // Feedback distribution
    const feedbackStmt = db.prepare(`
      SELECT feedback, COUNT(*) as count FROM query_logs 
      WHERE feedback IS NOT NULL AND created_at >= datetime('now', '-${days} days')
      GROUP BY feedback
    `);
    const feedbackStats = rowsToObjects(feedbackStmt);

    // Top matched FAQs
    const topStmt = db.prepare(`
      SELECT f.id, f.question, COUNT(ql.id) as hits 
      FROM query_logs ql 
      JOIN faqs f ON ql.top_faq_id = f.id 
      WHERE ql.created_at >= datetime('now', '-${days} days')
      GROUP BY f.id 
      ORDER BY hits DESC 
      LIMIT 10
    `);
    const topFaqs = rowsToObjects(topStmt);

    // Queries by day
    const byDayStmt = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM query_logs 
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at) 
      ORDER BY date
    `);
    const queriesByDay = rowsToObjects(byDayStmt);

    // Unanswered queries (low confidence)
    const unansweredStmt = db.prepare(`
      SELECT query, score, created_at FROM query_logs 
      WHERE score < 0.55 AND created_at >= datetime('now', '-${days} days')
      ORDER BY created_at DESC 
      LIMIT 50
    `);
    const unansweredQueries = rowsToObjects(unansweredStmt);

    return {
      totalQueries,
      avgConfidence: Math.round(avgConfidence * 100),
      lowConfidenceCount,
      feedbackStats,
      topFaqs,
      queriesByDay,
      unansweredQueries
    };
  }
};

// Category Operations
export const categoryOperations = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY sort_order');
    return rowsToObjects(stmt);
  }
};

export default { getDatabase, initializeDatabase, saveDatabase, faqOperations, logOperations, categoryOperations };
