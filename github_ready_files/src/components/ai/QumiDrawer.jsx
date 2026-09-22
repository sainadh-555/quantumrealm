import React from 'react';
import { Bot, X, ExternalLink } from 'lucide-react';

export default function QumiDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;
  const streamlitUrl = "https://quantum-ai-tutor.streamlit.app/";

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
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white font-['Space_Grotesk']">
                  Qumi AI
                </h3>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Powered by Streamlit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a 
              href={streamlitUrl} 
              target="_blank" 
              rel="noreferrer"
              title="Open in new tab"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div className="flex-1 w-full bg-white relative">
          <iframe 
            src={streamlitUrl}
            className="w-full h-full border-none absolute inset-0"
            title="Qumi AI Tutor Streamlit App"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>

      </div>
    </div>
  );
}
