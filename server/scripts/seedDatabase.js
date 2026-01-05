import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import database service
import { initializeDatabase, faqOperations } from '../services/database.js';

// Category detection based on keywords
function detectCategory(question, answer) {
    const text = `${question} ${answer}`.toLowerCase();

    if (text.includes('خط') || text.includes('line')) {
        if (text.includes('أزرق') || text.includes('blue')) return 'lines';
        if (text.includes('أحمر') || text.includes('red')) return 'lines';
        if (text.includes('برتقالي') || text.includes('orange')) return 'lines';
        if (text.includes('أصفر') || text.includes('yellow')) return 'lines';
        if (text.includes('أخضر') || text.includes('green')) return 'lines';
        if (text.includes('بنفسجي') || text.includes('purple')) return 'lines';
        return 'lines';
    }

    if (text.includes('محطة') || text.includes('station')) return 'stations';
    if (text.includes('موعد') || text.includes('ساعة') || text.includes('وقت') || text.includes('schedule') || text.includes('time')) return 'schedules';
    if (text.includes('تذكرة') || text.includes('سعر') || text.includes('ريال') || text.includes('ticket') || text.includes('price')) return 'tickets';
    if (text.includes('مصعد') || text.includes('إعاقة') || text.includes('accessibility') || text.includes('elevator')) return 'accessibility';
    if (text.includes('أمان') || text.includes('كاميرا') || text.includes('safety') || text.includes('security')) return 'safety';
    if (text.includes('تطبيق') || text.includes('app')) return 'app';
    if (text.includes('واي فاي') || text.includes('wifi') || text.includes('تكييف') || text.includes('دورات مياه')) return 'facilities';

    return 'general';
}

// Check if FAQ is notable enough to be featured
function shouldBeFeatured(question) {
    const featuredKeywords = [
        'ما هو مترو',
        'ساعات عمل',
        'تكلفة التذكرة',
        'تطبيق',
        'المطار',
        'عطلة نهاية الأسبوع'
    ];

    return featuredKeywords.some(keyword => question.includes(keyword));
}

async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');

    // Initialize database
    await initializeDatabase();

    // Check if already seeded
    const existingCount = faqOperations.count();
    if (existingCount > 0) {
        console.log(`⚠️  Database already contains ${existingCount} FAQs.`);
        console.log('   Delete data/metro_faq.db to re-seed.\n');
        return;
    }

    // Read CSV file
    const csvPath = path.join(__dirname, '../../Dataset.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('❌ Dataset.csv not found at:', csvPath);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        bom: true
    });

    console.log(`📄 Found ${records.length} FAQ records in CSV\n`);

    // Process and insert FAQs
    let inserted = 0;
    let skipped = 0;

    for (const record of records) {
        const question = record['السؤال']?.trim();
        const answer = record['الإجابة']?.trim();

        // Skip invalid records
        if (!question || !answer || question === '0' || answer === '0') {
            skipped++;
            continue;
        }

        // Detect category
        const category = detectCategory(question, answer);
        const featured = shouldBeFeatured(question);

        // Insert FAQ
        try {
            faqOperations.create({
                question,
                answer,
                category,
                tags: [],
                language: 'ar',
                featured
            });
            inserted++;

            if (inserted % 20 === 0) {
                console.log(`📊 Processed ${inserted} FAQs...`);
            }
        } catch (error) {
            console.error(`❌ Failed to insert FAQ: ${question.substring(0, 50)}...`);
            console.error(error.message);
        }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Inserted: ${inserted} FAQs`);
    console.log(`   Skipped: ${skipped} invalid records`);
    console.log(`   Categories: general, lines, stations, schedules, tickets, facilities, accessibility, safety, app`);
}

// Run seeder
seedDatabase()
    .then(() => {
        console.log('\n🎉 Database ready!');
        console.log('\nTo start the application, run:');
        console.log('  npm run dev');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
