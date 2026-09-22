import React, { useState, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  RefreshCw,
  FileCode,
  Edit3,
  Bot,
  AlertCircle
} from 'lucide-react';
import { circuitToQiskit } from '../utils/circuitToQiskit';
import { CodeParser } from '../services/CodeParser';
import { QUANTUM_GATES } from '../data/quantumGates';

export default function CodeEditor({
  circuit,
  selectedOpId,
  onResetCircuit,
  onCircuitUpdate,
  onOpenQumi
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableCode, setEditableCode] = useState('');
  const [parseError, setParseError] = useState(null);
  const [activeTab, setActiveTab] = useState('code');

  useEffect(() => {
    if (selectedOpId) {
      setActiveTab('inspector');
    }
  }, [selectedOpId]);

  const generatedCode = circuitToQiskit(circuit);

  // Sync editable text when circuit updates from visual editor (unless user is actively typing)
  useEffect(() => {
    if (!isEditing) {
      setEditableCode(generatedCode);
      setParseError(null);
    }
  }, [circuit, isEditing, generatedCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editableCode : generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const codeToDownload = isEditing ? editableCode : generatedCode;
    const blob = new Blob([codeToDownload], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum_circuit.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Debounced parsing of Qiskit code to avoid layout thrashing
  useEffect(() => {
    if (!isEditing) return;

    const timeoutId = setTimeout(() => {
      const parseResult = CodeParser.parseQiskit(editableCode);
      if (parseResult.success && parseResult.circuit) {
        setParseError(null);
        onCircuitUpdate?.(parseResult.circuit);
      } else {
        setParseError(parseResult.error || 'Syntax warning: Invalid Qiskit command');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [editableCode, isEditing]);

  const handleCodeChange = (e) => {
    setEditableCode(e.target.value);
  };

  // Helper for syntax styling in preview mode
  const renderSyntaxLine = (line) => {
    if (line.trim().startsWith('#')) {
      return <span className="text-gray-500 italic">{line}</span>;
    }
    if (line.includes('from qiskit import')) {
      return (
        <span>
          <span className="text-pink-400">from</span> qiskit <span className="text-pink-400">import</span> <span className="text-cyan-300 font-semibold">QuantumCircuit</span>
        </span>
      );
    }
    if (line.includes('QuantumCircuit(')) {
      return (
        <span>
          <span className="text-cyan-300">qc</span> = <span className="text-purple-400">QuantumCircuit</span>({line.split('QuantumCircuit(')[1]}
        </span>
      );
    }
    if (line.startsWith('qc.')) {
      const parts = line.split('.');
      const gateCall = parts[1] || '';
      const gateName = gateCall.split('(')[0];
      const args = gateCall.split('(')[1] || '';
      return (
        <span>
          <span className="text-cyan-300">qc</span>.<span className="text-amber-300 font-semibold">{gateName}</span>({args}
        </span>
      );
    }
    return <span className="text-gray-200">{line}</span>;
  };

  const codeLines = (isEditing ? editableCode : generatedCode).split('\n');

  return (
    <div className="w-full lg:w-96 shrink-0 border-l border-white/10 overflow-hidden flex flex-col bg-[#070918] h-full min-h-[360px] relative z-10">
      
      {/* Editor Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`font-semibold text-sm tracking-wide font-['Space_Grotesk'] uppercase pb-1 border-b-2 transition-colors ${
              activeTab === 'code' ? 'text-cyan-400 border-cyan-400' : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            Qiskit Code
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`font-semibold text-sm tracking-wide font-['Space_Grotesk'] uppercase pb-1 border-b-2 transition-colors ${
              activeTab === 'inspector' ? 'text-purple-400 border-purple-400' : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            Inspector
          </button>
        </div>

        {/* Toolbar Buttons (Only show in Code tab) */}
        {activeTab === 'code' && (
          <div className="flex items-center space-x-1">
          
          {/* Toggle Edit Mode */}
          <button
            onClick={() => {
              if (!isEditing) setEditableCode(generatedCode);
              setIsEditing(!isEditing);
            }}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
              isEditing
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
            title="Toggle Live Qiskit Code Editing"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">{isEditing ? 'Editing' : 'Edit'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center space-x-1 text-xs"
            title="Copy Qiskit Code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-emerald-400">Copied</span>
              </>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Download .py Script"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResetCircuit}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Reset Code"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        )}
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto bg-[#040612]/95 flex flex-col selection:bg-cyan-500/30">
        
        {activeTab === 'code' ? (
          <div className="p-3 font-mono text-xs flex-1 flex flex-col">
            {isEditing ? (
              <div className="flex-1 flex flex-col h-full">
                <textarea
                  value={editableCode}
                  onChange={handleCodeChange}
                  spellCheck="false"
                  className="w-full flex-1 bg-transparent text-gray-100 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 p-2 rounded-lg border border-white/5"
                  placeholder="# Type Qiskit code here e.g.:&#10;qc.h(0)&#10;qc.cx(0, 1)&#10;qc.measure_all()"
                />
                {parseError && (
                  <div className="mt-2 text-[10px] font-mono text-amber-400 flex items-center gap-1.5 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-3">
                {/* Line Numbers */}
                <div className="select-none text-gray-600 text-right pr-2 border-r border-white/5 space-y-1">
                  {codeLines.map((_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>

                {/* Syntax Highlighted Lines */}
                <div className="flex-1 space-y-1 whitespace-pre">
                  {codeLines.map((line, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {renderSyntaxLine(line)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 flex-1 flex flex-col items-center justify-center text-center">
            {!selectedOpId ? (
              <div className="text-gray-500 flex flex-col items-center">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No gate selected.</p>
                <p className="text-xs mt-1">Click a gate on the circuit canvas to inspect its properties.</p>
              </div>
            ) : (
              (() => {
                const selectedOp = circuit.operations.find(op => op.id === selectedOpId);
                if (!selectedOp) return <div className="text-gray-500">Selection lost.</div>;
                const gateDef = QUANTUM_GATES.find(g => g.id === selectedOp.gate) || { 
                  name: selectedOp.gate, 
                  description: 'Custom Gate', 
                  detail: 'Details unavailable.',
                  matrix: '?'
                };
                return (
                  <div className="flex flex-col items-start w-full text-left space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded flex items-center justify-center font-mono font-bold text-xl border ${gateDef.color || 'bg-cyan-500/20 border-cyan-400 text-cyan-300'}`}>
                        {selectedOp.gate}
                      </div>
                      <div>
                        <h4 className="font-bold text-white font-['Space_Grotesk'] text-lg">{gateDef.name}</h4>
                        <p className="text-cyan-400 text-xs font-mono">{gateDef.description}</p>
                      </div>
                    </div>
                    
                    <div className="bg-black/30 border border-white/5 p-3 rounded text-xs text-gray-300 w-full leading-relaxed">
                      {gateDef.detail}
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full text-xs font-mono">
                      <div className="bg-[#121626] border border-white/5 p-2 rounded">
                        <span className="text-gray-500 block mb-1">Target Qubit</span>
                        <span className="text-white">q{selectedOp.target !== undefined ? selectedOp.target : selectedOp.qubit}</span>
                      </div>
                      {selectedOp.control !== undefined && (
                        <div className="bg-[#121626] border border-white/5 p-2 rounded">
                          <span className="text-gray-500 block mb-1">Control Qubit</span>
                          <span className="text-white">q{selectedOp.control}</span>
                        </div>
                      )}
                      <div className="bg-[#121626] border border-white/5 p-2 rounded">
                        <span className="text-gray-500 block mb-1">Column Step</span>
                        <span className="text-white">{selectedOp.column + 1}</span>
                      </div>
                    </div>

                    {gateDef.matrix && (
                      <div className="w-full mt-2">
                        <span className="text-gray-500 text-[10px] uppercase block mb-1">Unitary Matrix</span>
                        <div className="bg-black/40 border border-white/5 p-3 rounded font-mono text-purple-300 whitespace-pre overflow-x-auto text-xs">
                          {gateDef.matrix}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        )}

      </div>

      {/* Editor Footer */}
      <div className="px-4 py-2 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-[10px] font-mono text-gray-500">
        <div className="flex items-center space-x-1 text-cyan-400/80">
          <FileCode className="w-3 h-3" />
          <span>{isEditing ? 'Bi-directional Code Parser Active' : 'Auto-synchronized with circuit JSON'}</span>
        </div>

        {onOpenQumi && (
          <button
            onClick={onOpenQumi}
            className="text-purple-300 hover:text-purple-200 flex items-center gap-1 font-sans font-medium"
          >
            <Bot className="w-3 h-3 text-purple-400" />
            <span>Explain with Qumi</span>
          </button>
        )}
      </div>

    </div>
  );
}
