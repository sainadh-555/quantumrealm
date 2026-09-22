import React from 'react';
import { ExternalLink, Bot } from 'lucide-react';

export default function QumiWorkspace() {
  const streamlitUrl = "https://quantum-ai-tutor.streamlit.app/";

  return (
    <div className="flex flex-col h-full bg-[#0a0718] text-gray-100 rounded-3xl border border-purple-500/20 shadow-2xl overflow-hidden relative max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg font-['Space_Grotesk'] text-white">QUMI AI Tutor</h2>
            <p className="text-xs text-purple-300 font-mono">Dedicated Streamlit App</p>
          </div>
        </div>
        <a 
          href={streamlitUrl} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Open in New Tab <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Embedded Iframe */}
      <div className="flex-1 w-full h-full bg-white relative">
        <iframe 
          src={streamlitUrl}
          className="w-full h-full border-none absolute inset-0"
          title="Qumi AI Tutor Streamlit App"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
