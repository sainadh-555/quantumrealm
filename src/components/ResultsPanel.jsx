import React, { useState } from 'react';
import ProbabilityChart from './ProbabilityChart';
import StateVector from './StateVector';
import BlochSphere from './BlochSphere';
import CircuitInfo from './CircuitInfo';
import { BarChart3, Binary, Compass, Info, CheckCircle2, Sparkles, Download } from 'lucide-react';

export default function ResultsPanel({ results, circuit, isRunning, isCollapsed, onToggleCollapse }) {
  const [activeTab, setActiveTab] = useState('probability');

  const handleDownloadResults = () => {
    if (!results) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "quantum_results.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!results && !isRunning) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-200 font-['Space_Grotesk']">
          Ready for Quantum Execution
        </h3>
        {!isCollapsed && (
          <p className="text-xs text-gray-400 max-w-md mt-2">
            Build your circuit using the gate palette above, then click <strong className="text-cyan-300">▶ RUN SIMULATION</strong> to observe computational basis probabilities, state vector amplitudes, and 3D Bloch sphere projections.
          </p>
        )}
      </div>
    );
  }

  const tabs = [
    { id: 'probability', label: '1. Probability', icon: BarChart3 },
    { id: 'statevector', label: '2. State Vector', icon: Binary },
    { id: 'bloch', label: '3. Bloch Sphere', icon: Compass },
    { id: 'info', label: '4. Circuit Info', icon: Info },
  ];

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-[#070919]">
      
      {/* Results Header with Tabs */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        
        <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={onToggleCollapse}>
          <h3 className="font-bold text-sm tracking-wide text-gray-100 font-['Space_Grotesk'] uppercase flex items-center gap-2">
            <span>Simulation Results</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/30">
            {results?.backend || 'Qiskit Aer'}
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (isCollapsed) onToggleCollapse();
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all border-b-2 ${
                    isActive && !isCollapsed
                      ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                      : 'text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          <button
            onClick={handleDownloadResults}
            className="ml-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center space-x-1 text-xs"
            title="Download Results (.json)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">.json</span>
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'probability' && (
            <ProbabilityChart
              probabilities={results?.probabilities}
              counts={results?.counts}
              shots={results?.shots || 1024}
              aiInsight={results?.aiInsight}
            />
          )}

          {activeTab === 'statevector' && (
            <StateVector
              statevector={results?.statevector}
              numQubits={circuit.qubits}
            />
          )}

          {activeTab === 'bloch' && (
            <BlochSphere
              blochStates={results?.blochStates}
              qubits={circuit.qubits}
            />
          )}

          {activeTab === 'info' && (
            <CircuitInfo
              circuit={circuit}
              results={results}
            />
          )}
        </div>
      )}

    </div>
  );
}
