import React, { useState, useMemo } from 'react';
import { Search, Book, Bookmark, Compass, Zap, Layers, PlayCircle, Library, ArrowUpRight } from 'lucide-react';
import { QUANTUM_CONCEPTS } from '../../data/quantumConcepts';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function ELibrary({ onExploreInLab, onAskQumi }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Dynamically extract categories from concepts
  const CATEGORIES = useMemo(() => {
    const cats = new Set(QUANTUM_CONCEPTS.map(c => c.category));
    const catArray = Array.from(cats).map(c => ({
      id: c.toUpperCase(),
      label: c,
      icon: <Book className="w-4 h-4" />
    }));
    return [
      { id: 'ALL', label: 'All Topics', icon: <Library className="w-4 h-4" /> },
      ...catArray
    ];
  }, []);

  const filteredContent = QUANTUM_CONCEPTS.filter(item => {
    const searchTarget = (item.name + ' ' + item.description + ' ' + item.details).toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || (item.category && item.category.toUpperCase() === activeCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] bg-[#030511] text-gray-100 overflow-hidden flex flex-col md:flex-row border-t border-white/5">
      
      {/* Sidebar - Categories */}
      <div className="w-full md:w-64 bg-[#0a0718] border-r border-purple-500/20 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white tracking-wide">E-LIBRARY</h2>
          <p className="text-xs text-purple-300 font-mono mt-1">Quantum Knowledge Base</p>
        </div>
        <div className="p-4 space-y-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSelectedTopic(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#050818]">
        
        {/* Search Bar */}
        <div className="p-6 border-b border-white/5 bg-[#030511]/50 backdrop-blur-md z-10 shrink-0">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search concepts, gates, algorithms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-sans"
            />
          </div>
        </div>

        {/* Content List & Detail View */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-5xl mx-auto">
            {selectedTopic ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="mb-6 text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2 font-mono transition-colors"
                >
                  ← Back to Directory
                </button>
                <div className="bg-[#0a0718] border border-cyan-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />
                  <span className="text-xs font-mono text-cyan-500 bg-cyan-900/30 px-3 py-1 rounded-full border border-cyan-500/20 uppercase tracking-wider">
                    {selectedTopic.category}
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mt-6 mb-8 font-['Space_Grotesk']">
                    {selectedTopic.name}
                  </h1>
                  
                  <div className="prose prose-invert max-w-none text-gray-300">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {selectedTopic.details}
                    </ReactMarkdown>
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4">
                    {onExploreInLab && (
                      <button 
                        onClick={() => onExploreInLab(selectedTopic.id)}
                        className="px-6 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-sm font-semibold transition-all flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Try in Quantum Lab
                      </button>
                    )}
                    {onAskQumi && (
                      <button 
                        onClick={onAskQumi}
                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-semibold transition-all flex items-center gap-2"
                      >
                        <Compass className="w-4 h-4" />
                        Ask Qumi Tutor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-300">
                {filteredContent.length > 0 ? (
                  filteredContent.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTopic(item)}
                      className="group cursor-pointer bg-white/[0.02] border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 rounded-2xl p-6 transition-all duration-300 flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest bg-purple-900/30 px-2 py-1 rounded">
                          {item.category}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-100 mb-2 font-['Space_Grotesk'] group-hover:text-white transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed flex-1">
                        {item.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                    <Search className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-gray-400 font-['Space_Grotesk']">No concepts found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your search terms.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
