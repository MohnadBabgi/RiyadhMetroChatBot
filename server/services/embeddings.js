import { faqOperations } from './database.js';

// In-memory FAQ search index
let faqIndex = [];
let isInitialized = false;

// English to Arabic translation dictionary for cross-lingual search
const englishToArabic = {
    'metro': 'مترو',
    'train': 'قطار',
    'station': 'محطة',
    'stations': 'محطات',
    'line': 'خط',
    'lines': 'خطوط',
    'ticket': 'تذكرة',
    'tickets': 'تذاكر',
    'price': 'سعر',
    'cost': 'تكلفة',
    'fare': 'أجرة',
    'riyadh': 'الرياض',
    'airport': 'مطار',
    'schedule': 'جدول',
    'time': 'وقت',
    'times': 'مواعيد',
    'hours': 'ساعات',
    'operating': 'تشغيل',
    'work': 'عمل',
    'open': 'مفتوح',
    'close': 'إغلاق',
    'first': 'أول',
    'last': 'آخر',
    'morning': 'صباح',
    'evening': 'مساء',
    'night': 'ليل',
    'midnight': 'منتصف الليل',
    // Colors (line names)
    'blue': 'أزرق',
    'red': 'أحمر',
    'orange': 'برتقالي',
    'yellow': 'أصفر',
    'green': 'أخضر',
    'purple': 'بنفسجي',
    // Facilities
    'wifi': 'واي فاي',
    'internet': 'إنترنت',
    'bathroom': 'دورات مياه',
    'restroom': 'دورات مياه',
    'toilet': 'دورات مياه',
    'elevator': 'مصعد',
    'escalator': 'سلم كهربائي',
    'parking': 'مواقف',
    'car': 'سيارة',
    'app': 'تطبيق',
    'application': 'تطبيق',
    'download': 'تحميل',
    // Travel & Journey
    'trip': 'رحلة',
    'journey': 'رحلة',
    'duration': 'مدة',
    'travel': 'سفر',
    'go': 'ذهاب',
    'arrive': 'وصول',
    'arrival': 'وصول',
    'departure': 'مغادرة',
    'depart': 'انطلاق',
    'leave': 'مغادرة',
    'waiting': 'انتظار',
    'wait': 'انتظار',
    // Questions
    'how': 'كيف',
    'what': 'ما',
    'when': 'متى',
    'where': 'أين',
    'which': 'أي',
    'much': 'كم',
    'many': 'كم',
    'long': 'طويل',
    // Safety & Services
    'safe': 'آمن',
    'safety': 'أمان',
    'security': 'أمن',
    'camera': 'كاميرا',
    'family': 'عائلة',
    'families': 'عائلات',
    'children': 'أطفال',
    'child': 'طفل',
    'disability': 'إعاقة',
    'disabled': 'ذوي الإعاقة',
    'accessible': 'متاح',
    'accessibility': 'إمكانية الوصول',
    // Payment
    'pay': 'دفع',
    'payment': 'دفع',
    'card': 'بطاقة',
    'subscription': 'اشتراك',
    'monthly': 'شهري',
    'discount': 'خصم',
    'student': 'طالب',
    'students': 'طلاب',
    // Station names
    'olaya': 'العليا',
    'kafd': 'مركز الملك عبدالله المالي',
    'king abdullah': 'الملك عبدالله',
    'financial': 'المالي',
    'district': 'مركز',
    'museum': 'المتحف',
    'national museum': 'المتحف الوطني',
    'palace': 'قصر الحكم',
    'qasr': 'قصر',
    // Numbers
    'one': 'واحد',
    'two': 'اثنين',
    'three': 'ثلاثة',
    'four': 'أربعة',
    'five': 'خمسة',
    'six': 'ستة',
    // Days
    'friday': 'الجمعة',
    'saturday': 'السبت',
    'weekend': 'عطلة نهاية الأسبوع',
    'weekday': 'أيام الأسبوع',
    // Speed & Technical
    'speed': 'سرعة',
    'fast': 'سريع',
    'electric': 'كهربائي',
    'automatic': 'ذاتي',
    'driver': 'سائق',
    'minutes': 'دقائق',
    'minute': 'دقيقة',
    // Common phrases (partial matches)
    'ticket price': 'تكلفة التذكرة',
    'how much': 'كم',
    'opening hours': 'ساعات عمل',
    'working hours': 'ساعات عمل',
    'operating hours': 'ساعات عمل',
};

// Normalize Arabic and English text
function normalizeText(text) {
    if (!text) return '';

    return text
        // Normalize Arabic characters
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ة]/g, 'ه')
        .replace(/[ى]/g, 'ي')
        .replace(/[ؤ]/g, 'و')
        .replace(/[ئ]/g, 'ي')
        // Remove diacritics
        .replace(/[\u064B-\u065F]/g, '')
        // Remove definite article 'Al' (ال) from beginning of words
        .replace(/(^|\s)ال/g, '$1')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

// Translate English query to Arabic keywords for cross-lingual search
function translateEnglishToArabic(query) {
    let translatedQuery = query.toLowerCase();
    let arabicTerms = [];

    // First, check for multi-word phrases (longer matches first)
    const sortedPhrases = Object.keys(englishToArabic)
        .filter(key => key.includes(' '))
        .sort((a, b) => b.length - a.length);

    for (const phrase of sortedPhrases) {
        if (translatedQuery.includes(phrase)) {
            arabicTerms.push(englishToArabic[phrase]);
            // Remove the matched phrase to avoid double translation
            translatedQuery = translatedQuery.replace(phrase, '');
        }
    }

    // Then translate individual words
    const words = translatedQuery.split(/\s+/);
    for (const word of words) {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        if (cleanWord && englishToArabic[cleanWord]) {
            arabicTerms.push(englishToArabic[cleanWord]);
        }
    }

    // If we managed to translate some terms, use those as the query
    // This removes the "noise" of English words that don't match the Arabic corpus
    if (arabicTerms.length > 0) {
        return arabicTerms.join(' ');
    }
    return query;
}

// Tokenize text into words
function tokenize(text) {
    const normalized = normalizeText(text);
    // Split on whitespace and punctuation, filter empty strings
    return normalized.split(/[\s\u0600-\u06FF\w]+|[^\s\u0600-\u06FF\w]+/u)
        .filter(token => token.length > 1)
        .concat(normalized.split(/\s+/).filter(token => token.length > 1));
}

// Simple word tokenizer for Arabic and English
function simpleTokenize(text) {
    const normalized = normalizeText(text);
    // Split on spaces and filter out short tokens
    return normalized.split(/\s+/)
        .filter(token => token.length >= 2)
        .map(token => token.replace(/[^\u0600-\u06FFa-z0-9]/g, ''));
}

// Calculate Jaccard similarity between two sets of tokens
function jaccardSimilarity(tokens1, tokens2) {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
}

// Calculate word overlap with TF-IDF-like weighting
function calculateSimilarity(queryTokens, faqTokens, allFaqTokens) {
    if (queryTokens.length === 0 || faqTokens.length === 0) return 0;

    // Calculate document frequency for IDF
    const docFreq = {};
    for (const tokens of allFaqTokens) {
        const uniqueTokens = new Set(tokens);
        for (const token of uniqueTokens) {
            docFreq[token] = (docFreq[token] || 0) + 1;
        }
    }

    const totalDocs = allFaqTokens.length;
    const faqTokenSet = new Set(faqTokens);

    let score = 0;
    let totalWeight = 0;

    for (const token of queryTokens) {
        const idf = docFreq[token] ? Math.log(totalDocs / docFreq[token]) + 1 : 1;
        totalWeight += idf;

        if (faqTokenSet.has(token)) {
            // Token frequency in FAQ
            const tf = faqTokens.filter(t => t === token).length / faqTokens.length;
            score += tf * idf;
        }
    }

    // Normalize
    return totalWeight > 0 ? score / totalWeight : 0;
}

// Detect language of text
export function detectLanguage(text) {
    // Simple detection based on Arabic character presence
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text) ? 'ar' : 'en';
}

// Initialize the search index
export async function initializeEmbeddings() {
    console.log('📚 Initializing FAQ search index...');
    await loadFaqEmbeddings();
    isInitialized = true;
    console.log('✅ Search index ready');
    return true;
}

// Load all FAQs into memory for search
export async function loadFaqEmbeddings() {
    const faqs = faqOperations.getAll();

    faqIndex = faqs.map(faq => {
        // Arabic tokens
        const qAr = simpleTokenize(faq.question || '');
        const aAr = simpleTokenize(faq.answer || '');
        const tokensAr = [...qAr, ...aAr];

        // English tokens
        const qEn = simpleTokenize(faq.question_en || '');
        const aEn = simpleTokenize(faq.answer_en || '');
        const tokensEn = [...qEn, ...aEn];

        return {
            id: faq.id,
            question: faq.question,
            questionEn: faq.question_en,
            answer: faq.answer,
            answerEn: faq.answer_en,
            category: faq.category,
            // Store separated tokens
            tokensAr,
            questionTokensAr: qAr,
            tokensEn,
            questionTokensEn: qEn,
            // Keep legacy for safety if needed, but primary logic will use specific ones
            tokens: [...tokensAr, ...tokensEn],
            questionTokens: [...qAr, ...qEn]
        };
    });

    console.log(`📚 Loaded ${faqIndex.length} FAQs into search index`);
    return faqIndex;
}

// Generate a simple embedding (token list for now)
export async function generateEmbedding(text) {
    return simpleTokenize(text);
}

// Helper to calculate score for a specific language
function calculateLanguageScore(queryTokens, faqTokens, faqQuestionTokens, allTokens) {
    if (queryTokens.length === 0 || faqTokens.length === 0) return 0;

    const questionSim = calculateSimilarity(queryTokens, faqQuestionTokens, allTokens);
    const fullSim = calculateSimilarity(queryTokens, faqTokens, allTokens);
    const jaccardQuestion = jaccardSimilarity(queryTokens, faqQuestionTokens);

    // Calculate query coverage (percentage of query keyword found in question)
    const querySet = new Set(queryTokens);
    const questionSet = new Set(faqQuestionTokens);
    const intersection = [...querySet].filter(x => questionSet.has(x));
    const queryCoverage = querySet.size > 0 ? intersection.length / querySet.size : 0;

    // Combined score
    return (questionSim * 0.3) +
        (fullSim * 0.1) +
        (jaccardQuestion * 0.2) +
        (queryCoverage * 0.4);
}

// Search FAQs using text similarity
export async function searchFaqs(query, topK = 5) {
    const startTime = Date.now();

    if (!isInitialized || faqIndex.length === 0) {
        await loadFaqEmbeddings();
        isInitialized = true;
    }

    const language = detectLanguage(query);

    // Prepare queries for both languages
    let queryAr = [];
    let queryEn = [];

    if (language === 'en') {
        const translated = translateEnglishToArabic(query);
        queryAr = simpleTokenize(translated);
        queryEn = simpleTokenize(query);
        console.log(`Twist: English query "${query}" -> Ar keywords: "${translated}"`);
    } else {
        queryAr = simpleTokenize(query);
        // We don't translate Ar -> En currently
    }

    // Get token sets for IDF (using combined for simplicity or split?)
    const allTokensAr = faqIndex.map(f => f.tokensAr);
    const allTokensEn = faqIndex.map(f => f.tokensEn);

    // Calculate similarities
    const results = faqIndex.map(faq => {
        // 1. Calculate Arabic Match Score
        let scoreAr = 0;
        if (queryAr.length > 0 && faq.tokensAr.length > 0) {
            scoreAr = calculateLanguageScore(queryAr, faq.tokensAr, faq.questionTokensAr, allTokensAr);
        }

        // 2. Calculate English Match Score
        let scoreEn = 0;
        if (queryEn.length > 0 && faq.tokensEn.length > 0) {
            scoreEn = calculateLanguageScore(queryEn, faq.tokensEn, faq.questionTokensEn, allTokensEn);
        }

        // Take the BEST match between English and Arabic scores
        const bestScore = Math.max(scoreAr, scoreEn);

        return {
            ...faq,
            score: Math.min(bestScore, 1),
            confidence: Math.round(Math.min(bestScore * 100, 100)),
            matchedLanguage: scoreEn > scoreAr ? 'en' : 'ar',
            scoreDetails: { scoreAr, scoreEn } // Debug info
        };
    });

    // Sort by similarity (highest first)
    results.sort((a, b) => b.score - a.score);

    // Boost results if there are exact substring matches
    for (const result of results) {
        // Boost Arabic
        const normQueryAr = language === 'en' ? normalizeText(translateEnglishToArabic(query)) : normalizeText(query);
        const normQuestionAr = normalizeText(result.question);

        if (normQuestionAr.includes(normQueryAr)) {
            result.score = Math.min(result.score + 0.2, 1);
        }

        // Boost English (if applicable)
        if (language === 'en' && result.questionEn) {
            const normQueryEn = normalizeText(query);
            const normQuestionEn = normalizeText(result.questionEn);
            if (normQuestionEn.includes(normQueryEn)) {
                result.score = Math.min(result.score + 0.2, 1);
            }
        }

        result.confidence = Math.round(result.score * 100);
    }

    // Re-sort after boosting
    results.sort((a, b) => b.score - a.score);

    // Get top K results
    const topResults = results.slice(0, topK);

    const processingTime = Date.now() - startTime;

    // Determine if confident
    const threshold = parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.55;
    const isConfident = topResults.length > 0 && topResults[0].score >= threshold;

    return {
        bestMatch: topResults[0] || null,
        suggestions: topResults.slice(1, 4), // Next 3 as suggestions
        allResults: topResults,
        isConfident,
        language,
        processingTime
    };
}

// Generate and save embedding for a single FAQ
export async function generateAndSaveFaqEmbedding(faqId) {
    // In this simple version, we just reload the index
    await loadFaqEmbeddings();
    return [];
}

// Generate embeddings for all FAQs
export async function generateAllEmbeddings() {
    await loadFaqEmbeddings();
    console.log(`✅ Rebuilt search index for ${faqIndex.length} FAQs`);
    return faqIndex.length;
}

export default {
    initializeEmbeddings,
    loadFaqEmbeddings,
    generateEmbedding,
    searchFaqs,
    detectLanguage,
    generateAndSaveFaqEmbedding,
    generateAllEmbeddings
};
