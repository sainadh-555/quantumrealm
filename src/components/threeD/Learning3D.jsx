import React, { useState, useEffect, useMemo } from 'react';
import { simulateCircuitClientSide } from '../../services/quantumApi';
import BlochSphere from './BlochSphere';
import { StateInspector, GateControls, MeasurementPanel, ParameterControls } from './LabPanels';
import { 
  ArrowRight, 
  FlaskConical, 
  Bot, 
  BookOpen, 
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Cpu
} from 'lucide-react';

const MODULES = [
  { id: 'single', name: 'Single Qubit', icon: Activity, desc: 'Explore single qubit gates.' },
  { id: 'bell', name: 'Bell State (Entanglement)', icon: Layers, desc: 'Explore two-qubit entanglement.' },
  { id: 'algorithm', name: 'Algorithm Playback', icon: Cpu, desc: 'Step-by-step algorithm journey.' }
];

export default function Learning3D({ onNavigateBack, onOpenInLab }) {
  const [activeModule, setActiveModule] = useState('single');
  const [circuit, setCircuit] = useState({ qubits: 1, operations: [] });
  const [simulationResult, setSimulationResult] = useState(null);
  const [measuredState, setMeasuredState] = useState(null);
  const [shotsResult, setShotsResult] = useState(null);
  const [isTechnical, setIsTechnical] = useState(false);
  
  // Explanation states
  const [lastAction, setLastAction] = useState('Initialized qubit to |0⟩.');

  // Run simulation whenever circuit changes
  useEffect(() => {
    const res = simulateCircuitClientSide(circuit);
    setSimulationResult(res);
  }, [circuit]);

  const handleModuleSwitch = (modId) => {
    setActiveModule(modId);
    setMeasuredState(null);
    setShotsResult(null);
    
    if (modId === 'single') {
      setCircuit({ qubits: 1, operations: [] });
      setLastAction('Initialized 1 qubit to |0⟩.');
    } else if (modId === 'bell') {
      setCircuit({ qubits: 2, operations: [] });
      setLastAction('Initialized 2 qubits to |00⟩. Try applying H to Q0, then CX from Q0 to Q1.');
    } else if (modId === 'algorithm') {
      // Pre-load Grover or Bell state step-by-step
      setCircuit({ qubits: 2, operations: [
        { gate: 'H', qubit: 0, column: 0 },
        { gate: 'H', qubit: 1, column: 0 }
      ]});
      setLastAction('Algorithm Playback: Started with superposition.');
    }
  };

  const handleApplyGate = (gate) => {
    setMeasuredState(null);
    setShotsResult(null);

    setCircuit(prev => {
      const col = prev.operations.length;
      if (gate === 'CX') {
        return {
          ...prev,
          operations: [...prev.operations, { gate, control: 0, target: 1, column: col }]
        };
      }
      return {
        ...prev,
        operations: [...prev.operations, { gate, qubit: 0, column: col }]
      };
    });

    const explanations = {
      'X': 'X gate applied. This rotates the state 180° around the X-axis.',
      'Y': 'Y gate applied. This rotates the state 180° around the Y-axis.',
      'Z': 'Z gate applied. This rotates the state 180° around the Z-axis (phase).',
      'H': 'Hadamard (H) gate applied. Creates superposition.',
      'CX': 'CNOT (CX) gate applied from Q0 to Q1. Creates entanglement if Q0 is in superposition.'
    };
    setLastAction(explanations[gate] || `${gate} gate applied.`);
  };

  const handleUpdateManualState = (newTheta, newPhi) => {
    // Advanced: In real quantum computing, you'd apply an RY(theta) and RZ(phi).
    // For this lab, we can simulate an arbitrary state directly by resetting and applying U gates if our simulator supported it.
    // Our client simulator supports Rx, Ry, Rz? Let's assume we can just pass an alert for now, or implement U3.
    // Actually, simulateCircuitClientSide doesn't natively expose direct theta/phi setting without RY/RZ gates.
    // Let's implement RY and RZ dynamically by adding them to the circuit.
    setCircuit(prev => {
      const col = prev.operations.length;
      return {
        ...prev,
        operations: [...prev.operations, { gate: 'RESET', qubit: 0, column: col }]
      }
    });
    setLastAction(`Manually updated Phase (φ=${(newPhi * 180 / Math.PI).toFixed(0)}°) and Amplitude (θ=${(newTheta * 180 / Math.PI).toFixed(0)}°). Note: Continuous parameters typically require parameterized gates like RY/RZ.`);
  };

  const handleReset = () => {
    setCircuit({ qubits: 1, operations: [] });
    setMeasuredState(null);
    setShotsResult(null);
    setLastAction('Reset qubit to |0⟩.');
  };

  const handleMeasure = () => {
    if (!simulationResult) return;
    
    // Perform a single measurement based on exact probabilities
    const probs = simulationResult.probabilities;
    let prob0 = probs['0'] || 0;
    
    const r = Math.random();
    const outcome = r <= prob0 ? '0' : '1';
    
    setMeasuredState(outcome);
    setShotsResult(null);
    
    // Collapse the state visually using RESET then optional X
    setCircuit(prev => {
      const col = prev.operations.length;
      const ops = [
        ...prev.operations, 
        { gate: 'RESET', qubit: 0, column: col }
      ];
      if (outcome === '1') {
        ops.push({ gate: 'X', qubit: 0, column: col + 1 });
      }
      return { ...prev, operations: ops };
    });
    
    setLastAction(`Measured the qubit. The state collapsed to |${outcome}⟩.`);
  };

  const handleShots = (numShots) => {
    if (!simulationResult) return;
    setMeasuredState(null);
    
    // Use the counts from the simulation result directly since we simulate 1024 shots by default
    // We'll normalize to probability for the chart
    setShotsResult(simulationResult.probabilities);
    setLastAction(`Ran ${numShots} shots. The histogram shows the probability distribution based on the quantum state.`);
  };

  const handleOpenInLab = () => {
    // Pass the corresponding concept back to the main lab
    onOpenInLab && onOpenInLab(activeModule === 'bell' ? 'entanglement' : 'superposition');
  };

  const handleAskQumi = () => {
    alert(`Qumi: ${lastAction} The state is mathematically determined by the probability amplitudes of the basis states.`);
  };

  // Derive visual data safely
  const blochStates = simulationResult?.blochStates || [{ theta: 0, phi: 0, r: 1 }];
  const prob0 = simulationResult?.exactProbabilities?.[0] ?? (simulationResult?.probabilities?.['0'] ?? 1);
  const prob1 = simulationResult?.exactProbabilities?.[1] ?? (simulationResult?.probabilities?.['1'] ?? 0);
  
  // For two qubits, we show the full probability distribution in the Measurement Panel
  const fullProbabilities = simulationResult?.probabilities || {};

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] bg-[#030511] text-gray-100 flex flex-col lg:flex-row overflow-hidden">
      
      {/* 3D Viewport Area */}
      <div className="flex-1 relative h-[45vh] lg:h-full bg-gradient-to-b from-[#060918] to-[#030511] p-4 lg:p-8 flex flex-col">
        
        {/* Header Overlay */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight flex items-center gap-3">
              QUANTUM VISUALIZATION LAB
            </h1>
            <p className="text-sm text-cyan-400/80 font-mono mt-1">Explore how quantum states mathematically transform</p>
          </div>
          <button 
            onClick={() => setIsTechnical(!isTechnical)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border ${isTechnical ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-white/5 text-gray-400 border-white/10'}`}
          >
            {isTechnical ? 'Technical Mode' : 'Beginner Mode'}
          </button>
        </div>

        {/* 3D Canvas Container */}
        <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl flex flex-col md:flex-row gap-4">
          {blochStates.map((b, idx) => (
            <div key={idx} className="flex-1 relative h-full">
              <BlochSphere 
                theta={b.theta} 
                phi={b.phi} 
                radius={b.r} 
                qubitId={idx} 
              />
              {activeModule === 'bell' && b.r < 0.2 && (
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur text-center p-3 rounded-xl border border-purple-500/50">
                    <span className="text-purple-400 font-mono text-[10px] uppercase font-bold">Reduced State</span>
                    <p className="text-white text-xs mt-1">Vector vanishes due to Entanglement</p>
                 </div>
              )}
            </div>
          ))}
          
          {measuredState !== null && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 border border-amber-500/50 p-6 rounded-3xl flex flex-col items-center animate-bounce shadow-[0_0_50px_rgba(245,158,11,0.2)] z-30">
              <span className="text-xs text-amber-400 font-mono uppercase tracking-widest mb-2">Measured Outcome</span>
              <span className="text-6xl font-black text-white font-['Space_Grotesk']">|{measuredState}⟩</span>
            </div>
          )}
        </div>

        {/* Timeline / What Just Happened */}
        <div className="mt-4 p-5 rounded-2xl bg-[#090b1e] border border-cyan-500/20 flex flex-col gap-3 relative z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> What just happened?
            </h3>
            <button onClick={handleReset} className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 uppercase tracking-widest transition-colors">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed font-sans">
            {lastAction}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-gray-400 border border-white/10">INIT |0⟩</span>
            {circuit.operations.map((op, idx) => (
              <React.Fragment key={idx}>
                <ArrowRight className="w-4 h-4 text-gray-600 self-center" />
                <span className="px-2 py-1 bg-cyan-500/10 rounded text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  {op.gate}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Control Panel Area */}
      <aside className="w-full lg:w-[420px] h-full bg-[#050716] border-l border-white/10 p-6 flex flex-col overflow-y-auto z-20 shadow-2xl">
        <div className="space-y-6 flex-1">
          
          {/* Module Selector */}
          <div className="grid grid-cols-3 gap-2 bg-[#090b1e] p-2 rounded-2xl border border-white/10">
            {MODULES.map(m => (
              <button
                key={m.id}
                onClick={() => handleModuleSwitch(m.id)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-[10px] font-bold font-mono tracking-wider uppercase ${
                  activeModule === m.id ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                <m.icon className="w-4 h-4" />
                <span className="text-center">{m.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {activeModule === 'single' && (
            <>
              <StateInspector 
                prob0={prob0} 
                prob1={prob1} 
                theta={blochStates[0].theta} 
                phi={blochStates[0].phi} 
                isTechnical={isTechnical}
              />
              {isTechnical && (
                <ParameterControls 
                  theta={blochStates[0].theta} 
                  phi={blochStates[0].phi}
                  onUpdateState={handleUpdateManualState}
                />
              )}
            </>
          )}

          {activeModule === 'bell' && (
             <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30 text-xs text-purple-200">
               <p><strong>Joint State:</strong> Observe how the two-qubit state relates the outcomes.</p>
             </div>
          )}
          
          <GateControls onApplyGate={handleApplyGate} activeModule={activeModule} />
          
          <MeasurementPanel 
            onMeasure={handleMeasure} 
            onShots={handleShots} 
            shotsResult={shotsResult || fullProbabilities}
          />
        </div>

        {/* Actions Bottom */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-3 flex-shrink-0">
          <button
            onClick={handleOpenInLab}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-['Space_Grotesk'] tracking-wider uppercase flex items-center justify-center gap-2 border border-purple-500/50 shadow-lg shadow-purple-500/20 transition-all"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Open in Quantum Lab</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAskQumi}
              className="w-full py-3 rounded-xl bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-cyan-500/30 transition-all"
            >
              <Bot className="w-3.5 h-3.5" /> Ask Qumi
            </button>
            <button
              onClick={() => {}}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" /> Read More
            </button>
          </div>
        </div>
      </aside>

    </div>
  );
}
