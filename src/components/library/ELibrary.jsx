import React, { useState } from 'react';
import { Search, Book, Bookmark, Compass, Zap, Layers, PlayCircle, Library } from 'lucide-react';

const LIBRARY_CONTENT = [
  { id: 'qubit', category: 'FOUNDATIONS', title: 'Qubit (Quantum Bit)', content: 'The fundamental unit of quantum information. Unlike a classical bit (0 or 1), a qubit can exist in a superposition of both states simultaneously until measured.' },
  { id: 'basis-states', category: 'FOUNDATIONS', title: 'Basis States (|0⟩ and |1⟩)', content: 'The two orthogonal basis states of a single qubit. They correspond to the classical 0 and 1, represented as column vectors in quantum mechanics.' },
  { id: 'superposition', category: 'FOUNDATIONS', title: 'Superposition', content: 'A principle where a quantum system can exist in multiple states at once. Applying a Hadamard (H) gate to a |0⟩ state puts it in an equal superposition of |0⟩ and |1⟩.' },
  { id: 'measurement', category: 'FOUNDATIONS', title: 'Measurement', content: 'The act of observing a quantum state, which forces it to collapse into one of its basis states (e.g., |0⟩ or |1⟩) based on its probability amplitudes.' },
  { id: 'phase', category: 'FOUNDATIONS', title: 'Quantum Phase', content: 'The angle of a quantum state in the complex plane. While global phase has no observable effect, relative phase is crucial for quantum interference.' },
  
  { id: 'h-gate', category: 'GATES', title: 'Hadamard Gate (H)', content: 'Creates a superposition. It maps |0⟩ to (|0⟩ + |1⟩)/√2 and |1⟩ to (|0⟩ - |1⟩)/√2. It represents a 90-degree rotation around the Y-axis followed by a 180-degree rotation around X.' },
  { id: 'x-gate', category: 'GATES', title: 'Pauli-X Gate (NOT)', content: 'The quantum equivalent of a classical NOT gate. It flips |0⟩ to |1⟩ and |1⟩ to |0⟩. Visually, it is a 180-degree rotation around the X-axis of the Bloch sphere.' },
  { id: 'y-gate', category: 'GATES', title: 'Pauli-Y Gate', content: 'Applies a bit and phase flip. It rotates the state 180 degrees around the Y-axis of the Bloch sphere.' },
  { id: 'z-gate', category: 'GATES', title: 'Pauli-Z Gate', content: 'A phase-flip gate. It leaves |0⟩ unchanged but flips the sign of |1⟩. It rotates the state 180 degrees around the Z-axis of the Bloch sphere.' },
  { id: 's-gate', category: 'GATES', title: 'S Gate (Phase)', content: 'Applies a 90-degree rotation around the Z-axis. It is the square root of the Pauli-Z gate.' },
  { id: 't-gate', category: 'GATES', title: 'T Gate', content: 'Applies a 45-degree rotation around the Z-axis. It is the square root of the S gate.' },
  { id: 'cnot', category: 'GATES', title: 'CNOT (Controlled-NOT)', content: 'A 2-qubit gate. It flips the target qubit ONLY if the control qubit is |1⟩. Essential for creating entanglement.' },
  { id: 'cz', category: 'GATES', title: 'CZ (Controlled-Z)', content: 'A 2-qubit gate. Applies a Z gate to the target ONLY if the control is |1⟩.' },
  { id: 'swap', category: 'GATES', title: 'SWAP Gate', content: 'Exchanges the states of two qubits.' },

  { id: 'bell-states', category: 'CIRCUITS', title: 'Bell States (Entanglement)', content: 'Four specific maximally entangled two-qubit states. The most common is created by applying an H gate to the control qubit, followed by a CNOT to the target.' },
  { id: 'interference', category: 'CIRCUITS', title: 'Quantum Interference', content: 'The addition of probability amplitudes. Constructive interference increases the probability of an outcome, while destructive interference cancels it out.' },

  { id: 'grover', category: 'ALGORITHMS', title: "Grover's Algorithm", content: 'A quantum algorithm that searches an unsorted database of N items in O(√N) time, providing a quadratic speedup over classical algorithms.' },
  { id: 'shor', category: 'ALGORITHMS', title: "Shor's Algorithm", content: 'A quantum algorithm for integer factorization that runs exponentially faster than the best-known classical equivalent. It poses a threat to RSA encryption.' },
  { id: 'qft', category: 'ALGORITHMS', title: 'Quantum Fourier Transform (QFT)', content: 'The quantum analogue of the discrete Fourier transform. It is a critical component in many quantum algorithms, including Shor\'s and quantum phase estimation.' },
  { id: 'teleportation', category: 'ALGORITHMS', title: 'Quantum Teleportation', content: 'A protocol for transmitting quantum information from one qubit to another using entanglement and classical communication, without moving the physical particle.' },
  
  { id: 'bloch-sphere', category: 'VISUALIZATION', title: 'Bloch Sphere', content: 'A geometric representation of the pure state space of a single qubit. The poles represent the |0⟩ and |1⟩ states, while the equator represents equal superpositions.' },
  
  { id: 'vqe', category: 'ADVANCED', title: 'Variational Quantum Eigensolver (VQE)', content: 'A hybrid quantum-classical algorithm used to find the lowest eigenvalue of a matrix, typically used in quantum chemistry to find molecular ground states.' },
  { id: 'qaoa', category: 'ADVANCED', title: 'QAOA', content: 'Quantum Approximate Optimization Algorithm. A hybrid algorithm designed to solve combinatorial optimization problems.' },
  { id: 'error-correction', category: 'ADVANCED', title: 'Quantum Error Correction', content: 'Techniques used to protect quantum information from errors due to decoherence and other quantum noise by encoding a logical qubit into multiple physical qubits.' },
];

const CATEGORIES = [
  { id: 'ALL', label: 'All Topics', icon: <Library className="w-4 h-4" /> },
  { id: 'FOUNDATIONS', label: 'Foundations', icon: <Compass className="w-4 h-4" /> },
  { id: 'GATES', label: 'Quantum Gates', icon: <Zap className="w-4 h-4" /> },
  { id: 'CIRCUITS', label: 'Circuits & States', icon: <Layers className="w-4 h-4" /> },
  { id: 'ALGORITHMS', label: 'Algorithms', icon: <PlayCircle className="w-4 h-4" /> },
  { id: 'VISUALIZATION', label: 'Visualization', icon: <Book className="w-4 h-4" /> },
  { id: 'ADVANCED', label: 'Advanced', icon: <Bookmark className="w-4 h-4" /> },
];

export default function ELibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedTopic, setSelectedTopic] = useState(null);

  const filteredContent = LIBRARY_CONTENT.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
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
                    {selectedTopic.title}
                  </h1>
                  <p className="text-lg text-gray-300 leading-relaxed max-w-3xl">
                    {selectedTopic.content}
                  </p>
                  
                  <div className="mt-12 pt-8 border-t border-white/10 flex gap-4">
                    <button className="px-6 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-sm font-semibold transition-all">
                      Try in Quantum Lab
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-semibold transition-all">
                      Ask Qumi Tutor
                    </button>
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
                      className="group cursor-pointer bg-white/[0.02] border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 rounded-2xl p-6 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">
                          {item.category}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-100 mb-2 font-['Space_Grotesk'] group-hover:text-white transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                    <Search className="w-12 h-12 text-gray-600 mb-4" />
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

// Helper icon component since it wasn't imported at the top
const ArrowUpRight = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 17l9.2-9.2M17 17V7H7"/>
  </svg>
);
