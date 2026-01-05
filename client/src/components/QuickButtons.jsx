import { motion } from 'framer-motion';
import { useTranslation } from '../stores/languageStore';

// Example questions for each category
const categoryQuestions = {
  ar: {
    tickets: 'كم تبلغ تكلفة التذكرة؟',
    schedules: 'ما هي ساعات عمل المترو؟',
    lines: 'كم عدد خطوط مترو الرياض؟',
    stations: 'أين تقع محطة العليا؟',
    facilities: 'هل يوجد واي فاي في المترو؟',
    safety: 'هل المترو آمن للعائلات؟'
  },
  en: {
    tickets: 'How much does a ticket cost?',
    schedules: 'What are the metro operating hours?',
    lines: 'How many lines does Riyadh Metro have?',
    stations: 'Where is Al-Olaya station located?',
    facilities: 'Is there WiFi on the metro?',
    safety: 'Is the metro safe for families?'
  }
};

function QuickButtons({ onQuestionClick, language }) {
  const t = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pb-4"
    >
      <p className="text-sm text-slate-400 mb-3 text-center">
        {language === 'ar' ? 'أو اختر موضوعاً:' : 'Or choose a topic:'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {t.quickButtons.map((button, idx) => (
          <motion.button
            key={button.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onQuestionClick(categoryQuestions[language][button.key])}
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 
                     text-slate-300 hover:text-white text-sm font-medium
                     rounded-xl border border-slate-700/50 hover:border-slate-600
                     shadow-lg hover:shadow-xl transition-all duration-200
                     hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>{t.categoryIcons[button.key]}</span>
            <span>{button.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default QuickButtons;
