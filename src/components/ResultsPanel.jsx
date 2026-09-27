import React, { useState } from 'react';
import ProbabilityChart from './ProbabilityChart';
import StateVector from './StateVector';
import BlochSphere from './BlochSphere';
import CircuitInfo from './CircuitInfo';
import { BarChart3, Binary, Compass, Info, CheckCircle2, Sparkles, Download } from 'lucide-react';

export default function ResultsPanel({ results, circuit, isRunning }) {
  const [activeTab, setActiveTab] = useState('probability');

  if (!results && !isRunning) {
    return (
      <div className="w-full glass-panel rounded-2xl border border-white/10 p-8 text-center bg-[#070919]/80 shadow-2xl flex flex-col items-center justify-center space-y-3 min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-200 font-['Space_Grotesk']">
          Ready for Quantum Execution
        </h3>
        <p className="text-xs text-gray-400 max-w-md">
          Build your circuit using the gate palette above, then click <strong className="text-cyan-300">▶ RUN SIMULATION</strong> to observe computational basis probabilities, state vector amplitudes, and 3D Bloch sphere projections.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'probability', label: '1. Probability', icon: BarChart3 },
    { id: 'statevector', label: '2. State Vector', icon: Binary },
    { id: 'bloch', label: '3. Bloch Sphere', icon: Compass },
    { id: 'info', label: '4. Circuit Information', icon: Info },
  ];

  return (
    <div className="w-full glass-panel rounded-2xl border border-white/10 overflow-hidden bg-[#070919]/90 shadow-2xl flex flex-col">
      
      {/* Results Header with Tabs */}
      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
        
        <div className="flex items-center space-x-3">
          <h3 className="font-bold text-sm tracking-wide text-gray-100 font-['Space_Grotesk'] uppercase flex items-center gap-2">
            <span>Simulation Results</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/30">
            {results?.backend || 'Qiskit Aer'}
          </span>
          {results?.error && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 font-mono border border-red-500/30 ml-2">
              ⚠️ {results.error}
            </span>
          )}
        </div>

        {/* Tab Buttons & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          </div>

          {/* Download Actions */}
          <div className="flex items-center">
            <button
              onClick={() => {
                const json = JSON.stringify(results, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `quantum_results_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10 ml-2"
              title="Download Results JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Results</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="p-6">
        {activeTab === 'probability' && (
          <ProbabilityChart
            probabilities={results?.probabilities}
            counts={results?.counts}
            shots={results?.shots || 1024}
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

    </div>
  );
}
