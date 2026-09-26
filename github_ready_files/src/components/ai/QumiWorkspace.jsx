import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Plus,
  Image as ImageIcon,
  FileText,
  File,
  X,
  Sparkles,
  FlaskConical,
  BookOpen
} from 'lucide-react';
import { AIService } from '../../services/AIService';

export default function QumiWorkspace({ mode = 'tutor', circuit, results, onCircuitAction }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() && !attachedFile) return;

    const userMsg = {
      role: 'user',
      content: inputValue,
      file: attachedFile
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setAttachedFile(null);
    setShowAttachmentMenu(false);
    setIsTyping(true);

    try {
      // Build the structured context for the AI backend
      const context = {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        circuit: circuit || null,
        results: results || null,
        code: null // If code editor state were passed down, we'd include it here
      };

      // Call the real AI endpoint
      const response = await AIService.askQumi(context);

      let actionPayload = null;
      if (response.type === 'ACTION' && response.action) {
        actionPayload = response.action;
        
        // If the AI generated a circuit, we can automatically trigger the UI action
        // or just render the button for the user to click. For safety, we render the button.
        if (actionPayload.type === 'circuit' && actionPayload.circuitData) {
          // The UI button will trigger `onCircuitAction(actionPayload.circuitData)`
        }
      }

      const aiMsg = {
        role: 'assistant',
        content: response.content || "I am speechless.",
        action: actionPayload
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered a quantum interference error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttach = (type) => {
    // Mocking file attachment for frontend UI/UX purposes
    let fileName = '';
    let icon = null;
    
    if (type === 'image') { fileName = 'quantum-circuit.png'; icon = <ImageIcon className="w-4 h-4" />; }
    if (type === 'pdf') { fileName = 'quantum-notes.pdf'; icon = <FileText className="w-4 h-4" />; }
    if (type === 'doc') { fileName = 'research-paper.docx'; icon = <File className="w-4 h-4" />; }
    
    setAttachedFile({ name: fileName, type, icon });
    setShowAttachmentMenu(false);
  };

  const EmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 mt-12 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-3xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 mb-6 relative">
        <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
        <Bot className="w-12 h-12 text-purple-400 relative z-10" />
      </div>
      <h2 className="text-3xl font-black font-['Space_Grotesk'] text-white mb-2 tracking-wide">QUMI</h2>
      <p className="text-purple-300 font-mono text-sm mb-8 tracking-widest uppercase">Your Quantum Learning Companion</p>
      
      <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
        Ask me about quantum computing, circuits, algorithms or simulation results. 
        I'm here to help you master the quantum realm.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={() => setInputValue("Explain superposition like I'm a beginner.")} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-gray-300 transition-colors">
          "Explain superposition"
        </button>
        <button onClick={() => setInputValue("Analyze this circuit")} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-gray-300 transition-colors">
          "Analyze this circuit"
        </button>
        <button onClick={() => setInputValue("Why is my result 50/50?")} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-gray-300 transition-colors">
          "Why is my result 50/50?"
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0718] text-gray-100 rounded-3xl border border-purple-500/20 shadow-2xl overflow-hidden relative max-w-5xl mx-auto">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth flex flex-col">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-none shadow-lg' 
                    : 'bg-white/5 border border-purple-500/20 rounded-bl-none'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-purple-400 font-['Space_Grotesk'] font-bold text-sm">
                      <Bot className="w-4 h-4" /> QUMI
                    </div>
                  )}
                  
                  {msg.file && (
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl mb-3 text-sm font-mono opacity-90 border border-white/10">
                      {msg.file.icon} {msg.file.name}
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap font-sans text-sm sm:text-base leading-relaxed">
                    {msg.content}
                  </div>

                  {msg.action && (
                    <div className="mt-4 pt-3 border-t border-purple-500/20">
                      <button 
                        onClick={() => onCircuitAction?.(msg.action.type, msg.action.circuitData)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors text-sm font-bold"
                      >
                        {msg.action.type === 'circuit' ? <FlaskConical className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        {msg.action.label}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-purple-500/20 rounded-2xl rounded-bl-none p-5 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 shrink-0 relative">
        <div className="max-w-4xl mx-auto">
          
          {/* File Attachment Chip */}
          {attachedFile && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-purple-500/20 text-purple-200 border border-purple-500/30 rounded-lg w-max animate-in slide-in-from-bottom-2 text-sm">
              {attachedFile.icon}
              <span className="font-mono">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="p-1 hover:bg-black/20 rounded-md">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Attachment Menu */}
          {showAttachmentMenu && (
            <div className="absolute bottom-[80px] left-6 sm:left-8 bg-[#110c24] border border-purple-500/30 p-2 rounded-xl shadow-2xl flex flex-col gap-1 animate-in slide-in-from-bottom-2 z-10 w-48">
              <button onClick={() => handleAttach('image')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-500/20 text-left text-sm text-gray-300 hover:text-white transition-colors">
                <ImageIcon className="w-4 h-4 text-cyan-400" /> Upload Image
              </button>
              <button onClick={() => handleAttach('pdf')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-500/20 text-left text-sm text-gray-300 hover:text-white transition-colors">
                <FileText className="w-4 h-4 text-purple-400" /> Upload PDF
              </button>
              <button onClick={() => handleAttach('doc')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-500/20 text-left text-sm text-gray-300 hover:text-white transition-colors">
                <File className="w-4 h-4 text-amber-400" /> Upload Document
              </button>
            </div>
          )}

          <div className="relative flex items-center bg-[#1a1532] border border-purple-500/40 rounded-2xl shadow-inner shadow-black/50 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
            
            {/* Plus Attachment Button */}
            <button
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-3 ml-1 text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl transition-colors"
              title="Add Context / Attachment"
            >
              <Plus className={`w-6 h-6 transition-transform ${showAttachmentMenu ? 'rotate-45' : ''}`} />
            </button>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedFile ? "Ask Qumi about this document..." : "Ask Qumi anything about quantum..."}
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-4 px-2 text-white placeholder-gray-500 leading-normal max-h-32 min-h-[56px] hide-scrollbar"
              rows={1}
            />

            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && !attachedFile) || isTyping}
              className="p-3 mr-2 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-900/50 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
