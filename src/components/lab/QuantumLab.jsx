import React, { useState, useEffect } from 'react';
import GatePalette from '../GatePalette';
import CircuitCanvas from '../CircuitCanvas';
import CodeEditor from '../CodeEditor';
import RunButton from '../RunButton';
import ResultsPanel from '../ResultsPanel';
import GateExplanationModal from '../GateExplanationModal';
import PresetSelectorModal from '../PresetSelectorModal';
import { runSimulation } from '../../services/quantumApi';
import { validateCircuit } from '../../utils/circuitValidation';
import { PRESET_CIRCUITS } from '../../data/presets';
import { ProgressService } from '../../services/ProgressService';
import {
  FlaskConical,
  Sparkles,
  Bot,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Zap,
  Play,
  Layers,
  CheckCircle2
} from 'lucide-react';

export default function QuantumLab({
  initialConcept,
  onOpenQumi,
  onNavigateHome,
  onCircuitUpdate
}) {
  // Starter circuits for injected concepts
  const conceptStarters = {
    superposition: {
      qubits: 1,
      classicalBits: 1,
      columns: 3,
      operations: [
        { id: 'h-1', gate: 'H', qubit: 0, column: 0 },
        { id: 'h-m', gate: 'MEASURE', qubit: 0, column: 1 }
      ]
    },
    entanglement: {
      qubits: 2,
      classicalBits: 2,
      columns: 4,
      operations: [
        { id: 'b-1', gate: 'H', qubit: 0, column: 0 },
        { id: 'b-2', gate: 'CX', control: 0, target: 1, column: 1 },
        { id: 'b-3', gate: 'MEASURE', qubit: 0, column: 2 },
        { id: 'b-4', gate: 'MEASURE', qubit: 1, column: 2 }
      ]
    },
    grover: PRESET_CIRCUITS.find(p => p.id === 'grover-2qubit') || PRESET_CIRCUITS[0],
    qubit: {
      qubits: 1,
      classicalBits: 1,
      columns: 3,
      operations: [
        { id: 'q-1', gate: 'MEASURE', qubit: 0, column: 0 }
      ]
    }
  };

  const getInitialCircuit = () => {
    if (initialConcept && conceptStarters[initialConcept]) {
      return conceptStarters[initialConcept];
    }
    return PRESET_CIRCUITS[0]; // Default: Bell State
  };

  const [circuit, setCircuit] = useState(getInitialCircuit());
  const [history, setHistory] = useState([getInitialCircuit()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedGate, setSelectedGate] = useState(null);
  const [selectedOpId, setSelectedOpId] = useState(null);
  const [explainedGate, setExplainedGate] = useState(null);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [circuitError, setCircuitError] = useState(null);

  // If initialConcept changes, load that circuit
  useEffect(() => {
    if (initialConcept && conceptStarters[initialConcept]) {
      const c = conceptStarters[initialConcept];
      setCircuit(c);
      setHistory([c]);
      setHistoryIndex(0);
      setResults(null);
    }
  }, [initialConcept]);

  useEffect(() => {
    onCircuitUpdate?.({ circuit, results });
  }, [circuit, results]);

  const updateCircuitState = (newCircuit) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCircuit);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCircuit(newCircuit);
    setCircuitError(null);
  };

  const handleRunSimulation = async () => {
    setCircuitError(null);
    const validation = validateCircuit(circuit);
    if (!validation.isValid) {
      setCircuitError(validation.error);
      return;
    }

    setIsRunning(true);
    try {
      const res = await runSimulation(circuit);
      
      // Fetch AI insight for the results
      let aiInsight = null;
      try {
        const insightRes = await import('../../services/AIService').then(m => m.AIService.explainSimulationResult(circuit, res));
        // Extract the plain text from markdown if needed, or just pass it
        aiInsight = typeof insightRes === 'string' ? insightRes.split('\n').slice(0, 3).join(' ') : "Simulation completed successfully.";
      } catch (e) {
        console.warn('AI Insight failed to load', e);
      }

      setResults({ ...res, aiInsight });
      ProgressService.addXP(25, 'Executed Quantum Circuit');
    } catch (err) {
      setCircuitError('Simulation execution failed. Please check gate connections.');
    } finally {
      setIsRunning(false);
    }
  };

  // Accessible quick add gate to first available wire
  const handleQuickAddGate = (gateId) => {
    const colIdx = Math.max(0, circuit.operations.length);
    if (gateId === 'CX' || gateId === 'CZ') {
      if (circuit.qubits < 2) return;
      const newOp = {
        id: `quick-op-${Date.now()}`,
        gate: gateId,
        control: 0,
        target: 1,
        column: colIdx
      };
      updateCircuitState({
        ...circuit,
        columns: Math.max(circuit.columns, colIdx + 2),
        operations: [...circuit.operations, newOp]
      });
    } else {
      const newOp = {
        id: `quick-op-${Date.now()}`,
        gate: gateId,
        qubit: 0,
        column: colIdx
      };
      updateCircuitState({
        ...circuit,
        columns: Math.max(circuit.columns, colIdx + 2),
        operations: [...circuit.operations, newOp]
      });
    }
  };

  // --- Dock Resizing Logic ---
  const [dockHeight, setDockHeight] = useState(64); // 64px collapsed, 300px medium, etc.
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newHeight = window.innerHeight - e.clientY;
      setDockHeight(Math.max(64, Math.min(newHeight, window.innerHeight * 0.8)));
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleDock = () => {
    setDockHeight(prev => prev > 100 ? 64 : 300);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#040612] overflow-hidden text-gray-200 font-sans select-none">
      
      {/* Top Engineering Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 bg-[#0a0d24] shrink-0 z-20 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-cyan-400">
            <FlaskConical className="w-4 h-4" />
            <span className="font-bold font-['Space_Grotesk'] text-sm uppercase tracking-widest text-white">Quantum Lab</span>
          </div>
          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
          <div className="hidden sm:flex items-center space-x-1 text-xs font-semibold">
            <button className="px-2 py-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition">File</button>
            <button className="px-2 py-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition">Edit</button>
            <button className="px-2 py-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition">View</button>
            <button className="px-2 py-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition">Simulate</button>
            <button className="px-2 py-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition">Learn</button>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={() => setIsPresetsOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-200 border border-white/10 flex items-center space-x-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Presets</span>
          </button>

          <button
            onClick={onOpenQumi}
            className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Ask Qumi</span>
          </button>

          <div className="h-4 w-px bg-white/10 hidden sm:block mx-2"></div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold font-['Space_Grotesk'] flex items-center space-x-2 transition-all ${
              isRunning
                ? 'bg-cyan-500/50 text-black cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20'
            }`}
          >
            {isRunning ? (
              <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-black" />
            )}
            <span>RUN SIMULATION</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (3 Columns) */}
      <div className="flex-1 flex flex-row items-stretch min-h-0 overflow-hidden relative z-0">
        
        {/* Left: Gate Palette (Fixed Width) */}
        <GatePalette
          selectedGate={selectedGate}
          onSelectGate={(gate) => setSelectedGate(selectedGate?.id === gate.id ? null : gate)}
          onExplainGate={(gate) => setExplainedGate(gate)}
        />

        {/* Center: Circuit Canvas (Flexible, Scrolls Horizontally Inside) */}
        <CircuitCanvas
          circuit={circuit}
          onAddQubit={() => {
            if (circuit.qubits < 8) updateCircuitState({ ...circuit, qubits: circuit.qubits + 1, classicalBits: circuit.classicalBits + 1 });
          }}
          onRemoveQubit={() => {
            if (circuit.qubits > 1) {
              const targetQubit = circuit.qubits - 1;
              const filteredOps = circuit.operations.filter(op => op.qubit !== targetQubit && op.control !== targetQubit && op.target !== targetQubit);
              updateCircuitState({ ...circuit, qubits: circuit.qubits - 1, classicalBits: Math.max(1, circuit.classicalBits - 1), operations: filteredOps });
            }
          }}
          onAddColumn={() => {
            if (circuit.columns < 30) updateCircuitState({ ...circuit, columns: circuit.columns + 1 });
          }}
          onRemoveColumn={() => {
            if (circuit.columns > 4) {
              const targetCol = circuit.columns - 1;
              const filteredOps = circuit.operations.filter(op => op.column !== targetCol);
              updateCircuitState({ ...circuit, columns: circuit.columns - 1, operations: filteredOps });
            }
          }}
          onClearCircuit={() => {
            updateCircuitState({ ...circuit, operations: [] });
            setResults(null);
            setSelectedOpId(null);
          }}
          onDropGate={(gateId, qubitIdx, colIdx) => {
            const existingOps = [...circuit.operations];
            if (gateId === 'CX' || gateId === 'CZ' || gateId === 'SWAP') {
              const targetQubit = (qubitIdx + 1) % circuit.qubits;
              const newOp = { id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, gate: gateId, control: qubitIdx, target: targetQubit, column: colIdx };
              const cleanedOps = existingOps.filter(op => !(op.column === colIdx && (op.qubit === qubitIdx || op.qubit === targetQubit || op.control === qubitIdx || op.target === targetQubit)));
              cleanedOps.push(newOp);
              updateCircuitState({ ...circuit, operations: cleanedOps });
              setSelectedOpId(newOp.id);
            } else {
              const newOp = { id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, gate: gateId, qubit: qubitIdx, column: colIdx };
              const cleanedOps = existingOps.filter(op => !(op.column === colIdx && (op.qubit === qubitIdx || op.control === qubitIdx || op.target === qubitIdx)));
              cleanedOps.push(newOp);
              updateCircuitState({ ...circuit, operations: cleanedOps });
              setSelectedOpId(newOp.id);
            }
            setSelectedGate(null);
          }}
          onRemoveOp={(opId) => {
            const filtered = circuit.operations.filter(op => op.id !== opId);
            updateCircuitState({ ...circuit, operations: filtered });
            if (selectedOpId === opId) setSelectedOpId(null);
          }}
          onChangeTarget={(opId, newTarget) => {
            const updated = circuit.operations.map(op => (op.id === opId ? { ...op, target: newTarget } : op));
            updateCircuitState({ ...circuit, operations: updated });
          }}
          selectedGate={selectedGate}
          selectedOpId={selectedOpId}
          onSelectOp={(op) => setSelectedOpId(op ? op.id : null)}
          onUndo={() => {
            if (historyIndex > 0) {
              const prevIdx = historyIndex - 1;
              setHistoryIndex(prevIdx);
              setCircuit(history[prevIdx]);
            }
          }}
          onRedo={() => {
            if (historyIndex < history.length - 1) {
              const nextIdx = historyIndex + 1;
              setHistoryIndex(nextIdx);
              setCircuit(history[nextIdx]);
            }
          }}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onLoadPreset={() => setIsPresetsOpen(true)}
          isRunning={isRunning}
        />

        {/* Right: Inspector / Code (Fixed Width) */}
        <CodeEditor
          circuit={circuit}
          selectedOpId={selectedOpId}
          onResetCircuit={() => updateCircuitState(PRESET_CIRCUITS[0])}
          onCircuitUpdate={(newCircuit) => updateCircuitState(newCircuit)}
          onOpenQumi={onOpenQumi}
        />

      </div>

      {/* Expandable Bottom Results Dock */}
      <div 
        className="shrink-0 flex flex-col bg-[#070919] border-t border-white/10 z-30 transition-[height] duration-75 ease-linear"
        style={{ height: `${dockHeight}px` }}
      >
        {/* Resize Handle */}
        <div 
          className="h-1.5 w-full cursor-ns-resize hover:bg-cyan-500/50 active:bg-cyan-500 flex justify-center items-center group -mt-[3px] absolute z-40"
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="w-12 h-[3px] rounded-full bg-white/20 group-hover:bg-white/80" />
        </div>

        <ResultsPanel
          results={results}
          circuit={circuit}
          isRunning={isRunning}
          isCollapsed={dockHeight < 100}
          onToggleCollapse={toggleDock}
        />
      </div>

      {/* Modals */}
      <GateExplanationModal
        gate={explainedGate}
        onClose={() => setExplainedGate(null)}
      />

      <PresetSelectorModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={(p) => {
          updateCircuitState(p);
          setIsPresetsOpen(false);
        }}
      />

    </div>
  );
}
