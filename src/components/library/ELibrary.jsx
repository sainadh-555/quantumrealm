import React, { useState } from 'react';
import { BookOpen, Search, FlaskConical, Filter, Star, ExternalLink, Book } from 'lucide-react';

const LIBRARY_ITEMS = [
  { id: 1, title: 'Quantum Superposition', category: 'Fundamentals', time: '10 min read', icon: Star, desc: 'Learn how qubits can exist in multiple states simultaneously.', conceptId: 'superposition' },
  { id: 2, title: 'Entanglement & Bell States', category: 'Core Principles', time: '15 min read', icon: Book, desc: 'Spooky action at a distance and maximally entangled states.', conceptId: 'entanglement' },
  { id: 3, title: 'Grover\'s Algorithm', category: 'Algorithms', time: '20 min read', icon: BookOpen, desc: 'O(√N) unstructured search algorithm explained visually.', conceptId: 'grover' },
  { id: 4, title: 'Qubit Decoherence', category: 'Hardware', time: '12 min read', icon: Star, desc: 'Why quantum computers need extreme cooling.', conceptId: 'qubit' }
];

export default function ELibrary({ onExploreInLab }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredItems = LIBRARY_ITEMS.filter(item => 
    (filter === 'All' || item.category === filter) &&
    (item.title.toLowerCase().includes(search.toLowerCase()) || item.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-8 flex flex-col overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white font-['Space_Grotesk'] mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-cyan-400" /> Quantum Library
          </h1>
          <p className="text-gray-400">Deep-dive technical resources, documentation, and research papers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search library..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#080b20] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#080b20] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Fundamentals">Fundamentals</option>
            <option value="Core Principles">Core Principles</option>
            <option value="Algorithms">Algorithms</option>
            <option value="Hardware">Hardware</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-[#0a0718] border border-white/10 hover:border-cyan-500/40 rounded-2xl p-5 flex flex-col transition-all hover:-translate-y-1 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 mb-1">{item.category} • {item.time}</span>
            <h3 className="text-lg font-bold text-white mb-2 font-['Space_Grotesk']">{item.title}</h3>
            <p className="text-sm text-gray-400 mb-6 flex-1">{item.desc}</p>
            
            <div className="flex items-center gap-2 mt-auto">
              <button className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors">
                Read Article <ExternalLink className="w-3 h-3" />
              </button>
              {onExploreInLab && item.conceptId && (
                <button 
                  onClick={() => onExploreInLab(item.conceptId)}
                  className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-colors"
                  title="Try in Quantum Lab"
                >
                  <FlaskConical className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center py-20 text-gray-500 font-mono">
          No resources found matching your search.
        </div>
      )}
    </div>
  );
}
