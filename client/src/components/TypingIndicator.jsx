import { motion } from 'framer-motion';
import { useTranslation } from '../stores/languageStore';

function TypingIndicator() {
  const t = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start"
    >
      <div className="chat-bubble-bot flex items-center gap-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
          <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
          <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
        </div>
        <span className="text-sm text-slate-400">{t.thinking}</span>
      </div>
    </motion.div>
  );
}

export default TypingIndicator;
