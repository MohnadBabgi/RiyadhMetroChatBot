import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Train, Globe, Github, Linkedin } from 'lucide-react';
import { useLanguageStore, useTranslation } from '../stores/languageStore';
import { chatApi } from '../services/api';
import ChatMessage from '../components/ChatMessage';
import QuickButtons from '../components/QuickButtons';
import TypingIndicator from '../components/TypingIndicator';

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { language, toggleLanguage, direction } = useLanguageStore();
  const t = useTranslation();
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Add welcome message on mount
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      type: 'bot',
      content: t.welcomeMessage,
      timestamp: new Date()
    }]);
  }, [language]);
  
  const handleSend = async () => {
    const query = input.trim();
    if (!query || isLoading) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await chatApi.sendMessage(query, sessionId);
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: language === 'ar' ? response.answer : (response.answerEn || response.answer),
        matchedQuestion: language === 'ar' ? response.matchedQuestion : (response.matchedQuestionEn || response.matchedQuestion),
        confidence: response.confidence,
        isConfident: response.isConfident,
        suggestions: response.suggestions,
        candidates: response.candidates,
        logId: response.logId,
        category: response.category,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        content: language === 'ar' 
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : 'Sorry, an error occurred. Please try again.',
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleQuickQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };
  
  const handleSuggestionClick = (suggestion) => {
    const question = language === 'ar' ? suggestion.question : (suggestion.questionEn || suggestion.question);
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-metro flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Train className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t.appTitle}</h1>
              <p className="text-sm text-slate-400">{t.appSubtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="btn-ghost flex items-center gap-2"
              title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            >
              <Globe className="w-5 h-5" />
              <span className="font-medium">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Chat Area */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSuggestionClick}
                  language={language}
                />
              ))}
            </AnimatePresence>
            
            {isLoading && <TypingIndicator />}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Quick Buttons */}
          {messages.length <= 1 && (
            <QuickButtons 
              onQuestionClick={handleQuickQuestion} 
              language={language}
            />
          )}
          
          {/* Input Area */}
          <div className="sticky bottom-0 p-4 glass border-t border-slate-700/50">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.placeholder}
                  dir={direction}
                  className="input-field pe-14 text-lg"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`absolute ${direction === 'rtl' ? 'left-3' : 'right-3'} p-2 rounded-lg transition-all duration-200
                    ${input.trim() 
                      ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/25' 
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <Send className={`w-5 h-5 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <p className="text-center text-xs text-slate-500 mt-3">
                {language === 'ar' 
                  ? 'اضغط Enter للإرسال' 
                  : 'Press Enter to send'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 glass border-t border-slate-700/50">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-6 mb-2">
            <a 
              href="https://github.com/MohnadBabgi/RiyadhMetroChatBot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-slate-500 hover:text-white transition-all duration-300"
              title="GitHub"
            >
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
            <a href=""></a>
            <a 
              href="https://www.linkedin.com/in/mohanadbabgi/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-slate-500 hover:text-[#0077b5] transition-all duration-300"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
          </div>
          
          <div className="flex flex-col items-center gap-1 text-xs text-slate-500">
            <p>
              {language === 'ar' 
                ? '© 2026 مساعد مترو الرياض' 
                : '© 2026 Riyadh Metro Assistant'}
            </p>
            <p className="flex items-center gap-1">
              {language === 'ar' ? 'تم التطوير بواسطة' : 'Developed by'}
              <span className="text-sky-400 font-medium">Mohanad Babgi</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ChatPage;
