import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Zap,
  HelpCircle,
  FlaskConical,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { AIService } from '../../services/AIService';
import { qumiProvider } from '../../services/QumiProvider';

export default function QumiDrawer({
  isOpen,
  onClose,
  circuit,
  results,
  onExploreInLab,
  onCircuitAction
}) {
  const [messages, setMessages] = useState([
    {
      id: 'msg-init',
      sender: 'qumi',
      text: "Hello! I'm **Qumi**, your Quantum Learning Companion. ⚛️\n\nI understand the concepts you're learning, the mistakes you make in Quantum Rush, and the exact circuit currently in Quantum Lab. Ask me anything or choose a quick prompt below!",
      suggestedActions: []
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [modelStatus, setModelStatus] = useState({ status: 'OFFLINE', progress: 0, message: '' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = qumiProvider.setProgressListener(setModelStatus);
      qumiProvider.initialize();
      return () => unsubscribe();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (textToSend = inputVal) => {
    const query = (textToSend || '').trim();
    if (!query) return;

    const userMsg = { id: `msg-${Date.now()}`, sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    const q = query.toLowerCase();
    
    // Call the local QMe AI engine
    const context = {
      messages: [...messages, userMsg],
      circuit: circuit,
      results: results,
      mode: 'simulation'
    };
    
    try {
      const response = await AIService.askQumi(context);
      
      let actionPayload = null;
      if (response.type === 'ACTION' && response.action) {
        actionPayload = response.action;
      } else if (response.action) {
        actionPayload = response.action;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `msg-qumi-${Date.now()}`,
          sender: 'qumi',
          text: response.content || "I am speechless.",
          suggestedActions: actionPayload ? [actionPayload] : []
        }
      ]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-qumi-${Date.now()}`,
          sender: 'qumi',
          text: "I encountered an error processing that question. Please try asking about quantum concepts or circuit analysis!",
          suggestedActions: []
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const contextualActions = [
    "Explain superposition like I'm 10",
    "Build a Bell state",
    "Why am I getting this result?",
    "Explain my current circuit",
    "Quiz me on quantum gates"
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-[#080b22] border-l border-cyan-500/30 flex flex-col h-full shadow-2xl shadow-cyan-500/20 overflow-hidden">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070a1a] rounded-[14px] flex items-center justify-center text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#080b22]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white font-['Space_Grotesk']">
                  Qumi
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  AI COMPANION
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                "Your Quantum Learning Companion"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streamlit Link Bar */}
        <div className="px-4 py-2 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-b border-purple-500/20">
          <a 
            href="https://quantum-ai-tutor.streamlit.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200 hover:text-white text-[11px] font-bold transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            Open Advanced AI Tutor (Streamlit)
          </a>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-b border-white/5 flex items-center space-x-1.5 overflow-x-auto bg-black/20 hide-scrollbar">
          {contextualActions.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10 text-[11px] whitespace-nowrap shrink-0 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Model Status Bar */}
        {modelStatus.status === 'INIT' && (
          <div className="bg-purple-900/40 border-b border-purple-500/30 px-4 py-1.5 text-[10px] font-mono text-purple-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              <span>{modelStatus.message}</span>
            </div>
            <span>{modelStatus.progress}%</span>
          </div>
        )}
        {modelStatus.status === 'ERROR' && (
          <div className="bg-red-900/40 border-b border-red-500/30 px-4 py-1.5 text-[10px] font-mono text-red-200 flex items-center space-x-2">
            <span>⚠️ {modelStatus.message}</span>
          </div>
        )}

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs sm:text-sm selection:bg-cyan-500/30">
          {messages.map(msg => {
            const isQumi = msg.sender === 'qumi';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${isQumi ? 'justify-start' : 'justify-end'}`}
              >
                {isQumi && (
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="flex flex-col space-y-2 max-w-[85%]">
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      isQumi
                        ? 'bg-white/[0.04] border border-white/10 text-gray-200 shadow-sm'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-medium shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Interactive Action Pills from Qumi */}
                  {isQumi && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => {
                            onCircuitAction?.(action.type);
                            if (action.type.startsWith('LOAD_')) {
                              const concept = action.type === 'LOAD_BELL' ? 'entanglement' : 'superposition';
                              onExploreInLab?.(concept);
                            }
                          }}
                          className="px-3 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-[11px] font-mono flex items-center space-x-1 transition-all shadow-sm active:scale-95"
                        >
                          <Zap className="w-3 h-3 text-purple-400" />
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 pl-9">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
              <span className="text-[11px] text-gray-400 ml-1">Qumi is analyzing quantum state...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/10 bg-[#06081a]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2 bg-white/[0.03] border border-white/10 rounded-2xl px-3 py-1.5 focus-within:border-cyan-500/50"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isTyping || modelStatus.status === 'INIT'}
              placeholder={isTyping ? "Qumi is thinking..." : "Ask Qumi about circuits, gates, or concepts..."}
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none py-1 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping || modelStatus.status === 'INIT'}
              className="p-2 rounded-xl bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-black hover:bg-cyan-400 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
