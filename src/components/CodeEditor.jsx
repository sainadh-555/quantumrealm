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

export default function CodeEditor({
  circuit,
  onResetCircuit,
  onCircuitUpdate,
  onOpenQumi
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableCode, setEditableCode] = useState('');
  const [parseError, setParseError] = useState(null);

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

  const handleCodeChange = (e) => {
    const val = e.target.value;
    setEditableCode(val);

    // Live parse Qiskit code to circuit model
    const parseResult = CodeParser.parseQiskit(val);
    if (parseResult.success && parseResult.circuit) {
      setParseError(null);
      onCircuitUpdate?.(parseResult.circuit);
    } else {
      setParseError(parseResult.error || 'Syntax warning');
    }
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
    <div className="w-full lg:w-96 shrink-0 glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col bg-[#070918]/90 shadow-2xl h-full min-h-[360px]">
      
      {/* Editor Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm tracking-wide text-gray-100 font-['Space_Grotesk'] uppercase">
            Qiskit Code
          </h3>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20">
            Python
          </span>
        </div>

        {/* Toolbar Buttons */}
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
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-[#040612]/95 flex flex-col selection:bg-cyan-500/30">
        
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
