import React, { useMemo, useEffect } from 'react';
import QubitWire from './QubitWire';
import {
  Plus, Minus, RotateCcw, Trash2, Undo2, Redo2, Sparkles, Cpu, Layers
} from 'lucide-react';
import { QUANTUM_GATES } from '../data/quantumGates';

export default function CircuitCanvas({
  circuit,
  onAddQubit,
  onRemoveQubit,
  onAddColumn,
  onRemoveColumn,
  onClearCircuit,
  onDropGate,
  onRemoveOp,
  onChangeTarget,
  selectedGate,
  selectedOpId,
  onSelectOp,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onLoadPreset
}) {
  const { qubits, columns, operations } = circuit;

  // Calculate circuit metrics
  const gateCount = operations.length;
  
  // Calculate circuit depth (unique active columns)
  const depth = useMemo(() => {
    if (operations.length === 0) return 0;
    const colSet = new Set(operations.map(op => op.column));
    return colSet.size;
  }, [operations]);

  // Compute multi-qubit vertical connection lines for controlled gates (CX, CZ)
  const verticalConnections = useMemo(() => {
    const lines = [];
    operations.forEach(op => {
      if ((op.gate === 'CX' || op.gate === 'CZ') && op.control !== undefined && op.target !== undefined) {
        const minQ = Math.min(op.control, op.target);
        const maxQ = Math.max(op.control, op.target);
        lines.push({
          id: op.id,
          column: op.column,
          minQ,
          maxQ,
          gate: op.gate
        });
      }
    });
    return lines;
  }, [operations]);

  // Keyboard shortcut listener for deleting selected gate
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedOpId) {
        // Prevent deleting if typing in an input
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        e.preventDefault();
        onRemoveOp(selectedOpId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOpId, onRemoveOp]);

  return (
    <div
      className="flex-1 flex flex-col glass-panel rounded-2xl border border-white/10 overflow-hidden bg-[#070a1b]/90 shadow-2xl"
      onClick={() => onSelectOp && onSelectOp(null)}
    >
      
      {/* Canvas Top Action Toolbar */}
      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
        
        {/* Left: Circuit Title & Info Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-sm tracking-wide text-gray-100 font-['Space_Grotesk'] uppercase">
              Circuit Canvas
            </h3>
          </div>

          {/* Circuit Stats Pill */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
            <span className="text-cyan-300 font-semibold">{qubits}</span>
            <span className="text-gray-400">Qubits</span>
            <span className="text-gray-600">•</span>
            <span className="text-purple-300 font-semibold">{gateCount}</span>
            <span className="text-gray-400">Gates</span>
            <span className="text-gray-600">•</span>
            <span className="text-pink-300 font-semibold">{depth}</span>
            <span className="text-gray-400">Depth</span>
          </div>
        </div>

        {/* Right Controls: Add/Remove Qubits, Columns, Undo, Clear */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2" onClick={(e) => e.stopPropagation()}>
          
          {/* Preset Selector Button */}
          <button
            onClick={onLoadPreset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-300 hover:text-white hover:border-purple-400 text-xs font-medium transition-all shadow-sm shadow-purple-500/10 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Presets</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-1"></div>

          {/* Qubit Controls */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={onRemoveQubit}
              disabled={qubits <= 1}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
              title="Remove Qubit"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-cyan-300 font-semibold">
              {qubits}Q
            </span>
            <button
              onClick={onAddQubit}
              disabled={qubits >= 6}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
              title="Add Qubit"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Column Controls */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={onRemoveColumn}
              disabled={columns <= 4}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
              title="Remove Step Column"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-purple-300 font-semibold">
              {columns} Steps
            </span>
            <button
              onClick={onAddColumn}
              disabled={columns >= 12}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
              title="Add Step Column"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1"></div>

          {/* Undo / Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {/* Clear Circuit */}
          <button
            onClick={onClearCircuit}
            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
            title="Clear Entire Circuit"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>

      {/* Circuit Grid Area */}
      <div className="flex-1 p-5 overflow-x-auto relative min-h-[260px] bg-quantum-grid bg-repeat select-none">
        
        {/* Column Headers */}
        <div className="flex items-center mb-2">
          {/* Offset spacer matching label width */}
          <div className="w-16 sm:w-20 shrink-0 pr-3"></div>
          {/* Header Grid */}
          <div
            className="flex-1 grid text-center font-mono text-[10px] text-gray-500"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div key={cIdx} className="w-full">
                Col {cIdx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Qubit Wire Rows & Overlays Container */}
        <div className="relative">
          
          {/* Vertical Glowing Lines for Controlled Gates (CNOT / CZ) */}
          <div className="absolute inset-0 flex pointer-events-none z-10">
            {/* Offset spacer */}
            <div className="w-16 sm:w-20 shrink-0 pr-3"></div>
            {/* Overlay grid matching wire columns */}
            <div className="flex-1 relative h-full">
              {verticalConnections.map(conn => {
                const colCenterPct = ((conn.column + 0.5) / columns) * 100;
                const topPos = conn.minQ * 72 + 32;
                const heightVal = (conn.maxQ - conn.minQ) * 72;

                return (
                  <div
                    key={conn.id}
                    style={{
                      top: `${topPos}px`,
                      left: `${colCenterPct}%`,
                      height: `${heightVal}px`,
                      transform: 'translateX(-50%)'
                    }}
                    className="absolute w-[3px] bg-gradient-to-b from-pink-400 via-purple-400 to-pink-400 shadow-lg shadow-pink-500/70 rounded-full animate-pulse pointer-events-none"
                  />
                );
              })}
            </div>
          </div>

          {/* Individual Qubit Wires */}
          <div className="space-y-2 relative z-0">
            {Array.from({ length: qubits }).map((_, qIdx) => (
              <QubitWire
                key={qIdx}
                qubitIndex={qIdx}
                totalQubits={qubits}
                columnsCount={columns}
                operations={operations}
                onDropGate={onDropGate}
                onRemoveOp={onRemoveOp}
                onChangeTarget={onChangeTarget}
                selectedGate={selectedGate}
                selectedOpId={selectedOpId}
                onSelectOp={onSelectOp}
                onSelectSlot={() => {}}
              />
            ))}
          </div>

        </div>

        {/* Gate Inspector Panel */}
        {selectedOpId && (() => {
          const selectedOp = operations.find(op => op.id === selectedOpId);
          if (!selectedOp) return null;
          const gateDef = QUANTUM_GATES.find(g => g.id === selectedOp.gate) || { 
            name: selectedOp.gate, 
            description: 'Custom Gate', 
            detail: 'Details unavailable.',
            matrix: '?'
          };
          
          return (
            <div className="mt-6 p-4 rounded-xl bg-[#0d132b]/80 border border-cyan-500/30 flex flex-col md:flex-row items-start gap-5 animate-in fade-in slide-in-from-bottom-2 shadow-xl backdrop-blur-md">
              
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-14 h-14 rounded-xl ${gateDef.color || 'bg-cyan-500/20 text-cyan-300'} border flex items-center justify-center shrink-0 shadow-inner`}>
                  <span className="font-mono font-bold text-2xl">{selectedOp.gate}</span>
                </div>
                
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white font-['Space_Grotesk'] text-base tracking-wide flex items-center gap-2">
                      {gateDef.name} Gate
                    </h4>
                  </div>
                  <p className="text-sm text-cyan-200/90 font-medium">{gateDef.description}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{gateDef.detail}</p>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
                    <div className="px-2 py-1 rounded bg-black/30 border border-white/5 text-gray-300">
                      <span className="text-gray-500 mr-1">Target:</span>q{selectedOp.target !== undefined ? selectedOp.target : selectedOp.qubit}
                    </div>
                    {selectedOp.control !== undefined && (
                      <div className="px-2 py-1 rounded bg-black/30 border border-white/5 text-gray-300">
                        <span className="text-gray-500 mr-1">Control:</span>q{selectedOp.control}
                      </div>
                    )}
                    <div className="px-2 py-1 rounded bg-black/30 border border-white/5 text-gray-300">
                      <span className="text-gray-500 mr-1">Step:</span>{selectedOp.column + 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Matrix and Actions */}
              <div className="flex flex-col items-end shrink-0 gap-3 min-w-[140px] w-full md:w-auto">
                <div className="text-xs font-mono text-gray-400 self-end md:self-auto mb-2 md:mb-0">
                  <kbd className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 font-bold text-[10px] shadow-sm">Del</kbd> to remove
                </div>
                {gateDef.matrix && (
                  <div className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-center w-full">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Matrix</div>
                    <div className="font-mono text-xs text-purple-300 font-bold whitespace-nowrap">{gateDef.matrix}</div>
                  </div>
                )}
              </div>

            </div>
          );
        })()}

      </div>

    </div>
  );
}
