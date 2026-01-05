import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { chatApi } from '../services/api';
import { useTranslation } from '../stores/languageStore';

function ChatMessage({ message, onSuggestionClick, language }) {
  const [feedback, setFeedback] = useState(null);
  const t = useTranslation();
  
  const handleFeedback = async (type) => {
    if (feedback || !message.logId) return;
    
    setFeedback(type);
    try {
      await chatApi.sendFeedback(message.logId, type);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };
  
  if (message.type === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex justify-end"
      >
        <div className="chat-bubble-user shadow-lg shadow-sky-500/10">
          <p className="text-base leading-relaxed">{message.content}</p>
        </div>
      </motion.div>
    );
  }
  
  // Bot message
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-start gap-3"
    >
      <div className={`chat-bubble-bot ${message.isError ? 'border border-red-500/30' : ''}`}>
        {/* Confidence indicator */}
        {message.confidence !== undefined && !message.isError && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-600/50">
            {message.isConfident ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
            <span className={`text-sm font-medium ${message.isConfident ? 'text-emerald-400' : 'text-amber-400'}`}>
              {t.confidence}: {message.confidence}%
            </span>
            {message.category && (
              <span className="px-2 py-0.5 text-xs bg-slate-600/50 rounded-full text-slate-300">
                {t.categories[message.category] || message.category}
              </span>
            )}
          </div>
        )}
        
        {/* Main answer */}
        <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
        
        {/* Matched question reference */}
        {message.matchedQuestion && message.isConfident && (
          <div className="mt-3 pt-3 border-t border-slate-600/50">
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="italic">"{message.matchedQuestion}"</span>
            </p>
          </div>
        )}
        
        {/* Low confidence candidates */}
        {message.candidates && message.candidates.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-slate-400 font-medium">
              {language === 'ar' ? 'نتائج مقترحة:' : 'Suggested results:'}
            </p>
            {message.candidates.map((candidate, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick(candidate)}
                className="block w-full text-start p-3 rounded-lg bg-slate-600/30 hover:bg-slate-600/50
                         border border-slate-500/20 transition-all duration-200"
              >
                <p className="text-sm font-medium text-slate-200">
                  {language === 'ar' ? candidate.question : (candidate.questionEn || candidate.question)}
                </p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {language === 'ar' ? candidate.answer : (candidate.answerEn || candidate.answer)}
                </p>
                <span className="text-xs text-sky-400 mt-1 inline-block">
                  {candidate.confidence}% {language === 'ar' ? 'تطابق' : 'match'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Suggestions */}
      {message.suggestions && message.suggestions.length > 0 && (
        <div className="w-full">
          <p className="text-sm text-slate-400 mb-2 px-1">{t.relatedQuestions}</p>
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick(suggestion)}
                className="px-3 py-2 text-sm bg-slate-700/50 hover:bg-slate-700 
                         text-slate-300 hover:text-white rounded-lg border border-slate-600/50
                         transition-all duration-200 hover:scale-[1.02]"
              >
                {language === 'ar' ? suggestion.question : (suggestion.questionEn || suggestion.question)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Feedback buttons */}
      {message.logId && !message.isError && (
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-slate-500">{t.helpful}</span>
          <button
            onClick={() => handleFeedback('positive')}
            disabled={feedback !== null}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              feedback === 'positive' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : feedback 
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFeedback('negative')}
            disabled={feedback !== null}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              feedback === 'negative' 
                ? 'bg-red-500/20 text-red-400' 
                : feedback 
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default ChatMessage;
