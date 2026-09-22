import React, { useState } from 'react';
import { X, Bot, Send, Sparkles, User, MessageSquare } from 'lucide-react';

export default function AITutorModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Greetings, Quantum Explorer! I am your AI Tutor by Neural Nomads. Ask me anything about quantum gates, Qiskit syntax, superposition, or entanglement."
    }
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const quickQuestions = [
    "How does the Hadamard gate create superposition?",
    "What is a Bell State (|Φ⁺⟩)?",
    "Why do we need measurement gates?",
    "How does CNOT entangle two qubits?"
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Generate intelligent AI Quantum response
    setTimeout(() => {
      let responseText = "Quantum state analysis: ";
      const qLower = query.toLowerCase();

      if (qLower.includes("hadamard") || qLower.includes("superposition")) {
        responseText = "The Hadamard (H) gate transforms basis states |0⟩ and |1⟩ into equal superposition states (|0⟩ + |1⟩)/√2 and (|0⟩ - |1⟩)/√2. On the Bloch sphere, it performs a 180° rotation around the X+Z diagonal axis!";
      } else if (qLower.includes("bell") || qLower.includes("entangle")) {
        responseText = "A Bell State is created by applying an H gate to q0, followed by a CNOT (CX) with control=q0 and target=q1. This yields (|00⟩ + |11⟩)/√2, meaning measuring q0 as 0 guarantees q1 is 0, and measuring q0 as 1 guarantees q1 is 1!";
      } else if (qLower.includes("measure")) {
        responseText = "Measurement gates collapse a quantum superposition state into a definite classical binary bit (0 or 1) based on the state probabilities. In Qiskit, `qc.measure(qubit, cbit)` maps qubit outputs to classical registers.";
      } else {
        responseText = `Great question! In Qiskit, circuit operations modify statevectors using unitary matrices. You can build this exact circuit visually in the canvas and press ▶ RUN SIMULATION to see the resulting probabilities and 3D Bloch sphere vector!`;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: responseText }]);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-pink-500/30 bg-[#0a0d24] p-6 shadow-2xl space-y-4 flex flex-col h-[580px]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Bot className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-100 font-['Space_Grotesk']">
                Neural Nomads AI Quantum Tutor
              </h3>
              <p className="text-xs text-pink-400 font-mono">Ask questions & learn quantum physics</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-[#040612]/90 rounded-xl border border-white/5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                m.sender === 'user' ? 'bg-cyan-500 text-black font-bold' : 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
              }`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-xl text-xs max-w-[80%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100'
                  : 'bg-white/5 border border-white/10 text-gray-200'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Question Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-pink-500/20 text-[10px] text-gray-300 hover:text-pink-300 border border-white/10 shrink-0 font-mono transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
          <input
            type="text"
            placeholder="Ask AI Tutor a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-[#0d122b] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
          />
          <button
            onClick={() => handleSend()}
            className="p-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-black font-bold transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
