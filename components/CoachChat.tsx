
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithCoach } from '../services/geminiService';
import { Send, User, MessageSquareQuote, Loader2 } from 'lucide-react';

export const CoachChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: '¡Hola! Soy tu entrenador personal de IA. ¿Cómo te sientes hoy? Cuéntame sobre tu entrenamiento, lesiones, o dudas de nutrición.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role,
        text: m.text
      }));
      
      const response = await chatWithCoach(userMsg.text, history);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 max-w-5xl mx-auto border-x border-neutral-900 shadow-2xl">
      {/* Chat Header */}
      <div className="p-6 border-b border-neutral-800 bg-neutral-950 z-10">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <MessageSquareQuote className="text-white" size={24} />
           </div>
           <div>
              <h2 className="text-xl font-bold text-white">Entrenador IA</h2>
              <p className="text-sm text-neutral-400">Especialista en rendimiento, recuperación y estrategia.</p>
           </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
             <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-orange-600' : 'bg-blue-600'}`}>
                {msg.role === 'user' ? <User size={16} text-white /> : <MessageSquareQuote size={16} className="text-white" />}
             </div>
             <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
               msg.role === 'user' 
               ? 'bg-neutral-800 text-white rounded-tr-none' 
               : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none'
             }`}>
               {msg.text}
             </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                 <Loader2 size={16} className="animate-spin text-white" />
              </div>
              <div className="bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-2xl rounded-tl-none">
                 <span className="text-neutral-400 text-sm">Escribiendo...</span>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-neutral-800 bg-neutral-950">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre rutinas, dolores, o consejos..."
            className="w-full bg-neutral-900 text-white rounded-xl py-4 pl-6 pr-16 border border-neutral-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-orange-600 rounded-lg text-white hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
