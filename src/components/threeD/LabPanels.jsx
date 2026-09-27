import React from 'react';
import { Activity, BarChart, Hash, Zap } from 'lucide-react';

export function StateInspector({ prob0, prob1, theta, phi, isTechnical }) {
  return (
    <div className="p-5 rounded-2xl bg-[#090b1e] border border-cyan-500/20 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-2">
          <Activity className="w-4 h-4" /> State Inspector
        </h3>
        {isTechnical && (
          <div className="px-2 py-1 bg-cyan-900/30 rounded text-[10px] font-mono text-cyan-300">
            θ: {(theta * 180 / Math.PI).toFixed(1)}° | φ: {(phi * 180 / Math.PI).toFixed(1)}°
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Probability 0 */}
        <div>
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <span className="text-gray-400">P(|0⟩)</span>
            <span className="text-emerald-400 font-bold">{(prob0 * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${prob0 * 100}%` }} />
          </div>
        </div>

        {/* Probability 1 */}
        <div>
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <span className="text-gray-400">P(|1⟩)</span>
            <span className="text-rose-400 font-bold">{(prob1 * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-rose-400 transition-all duration-300" style={{ width: `${prob1 * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GateControls({ onApplyGate, activeModule }) {
  if (activeModule === 'algorithm') {
    return (
      <div className="p-5 rounded-2xl bg-[#090b1e] border border-cyan-500/20 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase">Algorithm Playback</h3>
        <p className="text-xs text-gray-400">Step-by-step execution is controlled via the timeline above or by advancing the simulation manually.</p>
        <button onClick={() => onApplyGate('H')} className="w-full py-2 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 font-bold text-xs">
          Apply Next Gate (H)
        </button>
      </div>
    );
  }

  const gates = [
    { id: 'X', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30' },
    { id: 'Y', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30' },
    { id: 'Z', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30' },
    { id: 'H', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30' }
  ];

  if (activeModule === 'bell') {
    gates.push({ id: 'CX', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30 col-span-4' });
  }

  return (
    <div className="p-5 rounded-2xl bg-[#090b1e] border border-white/10 space-y-4">
      <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase flex items-center gap-2">
        <Zap className="w-4 h-4" /> Transformations
      </h3>
      <div className={`grid ${activeModule === 'bell' ? 'grid-cols-4' : 'grid-cols-4'} gap-2`}>
        {gates.map(g => (
          <button
            key={g.id}
            onClick={() => onApplyGate(g.id)}
            className={`py-3 rounded-xl border text-sm font-bold font-mono transition-colors ${g.color}`}
          >
            {g.id}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MeasurementPanel({ onMeasure, onShots, shotsResult }) {
  return (
    <div className="p-5 rounded-2xl bg-[#090b1e] border border-white/10 space-y-4">
      <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase flex items-center gap-2">
        <BarChart className="w-4 h-4" /> Measurement
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onMeasure}
          className="py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wide transition-colors"
        >
          Single Measure
        </button>
        <button
          onClick={() => onShots(1024)}
          className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-[11px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors"
        >
          <Hash className="w-3.5 h-3.5" /> 1024 Shots
        </button>
      </div>

      {shotsResult && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-center gap-6">
            {Object.entries(shotsResult).map(([state, prob]) => (
              <div key={state} className="flex flex-col items-center justify-end h-24 w-12">
                <span className="text-[10px] font-mono text-gray-400 mb-1">{(prob * 100).toFixed(0)}%</span>
                <div className="w-full bg-cyan-400/80 rounded-t-sm transition-all duration-500" style={{ height: `${prob * 100}%` }} />
                <span className="text-xs font-mono font-bold mt-1 text-white">|{state}⟩</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ParameterControls({ theta, phi, onUpdateState }) {
  return (
    <div className="p-5 rounded-2xl bg-[#090b1e] border border-indigo-500/20 space-y-4">
      <h3 className="text-xs font-bold text-indigo-400 tracking-widest uppercase">Parameter Lab</h3>
      
      <div>
        <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-2">
          <span>Amplitude (θ): {(theta * 180 / Math.PI).toFixed(0)}°</span>
        </div>
        <input
          type="range"
          min="0"
          max={Math.PI}
          step="0.01"
          value={theta}
          onChange={(e) => onUpdateState(parseFloat(e.target.value), phi)}
          className="w-full accent-indigo-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
        />
      </div>

      <div>
        <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-2">
          <span>Phase (φ): {(phi * 180 / Math.PI).toFixed(0)}°</span>
        </div>
        <input
          type="range"
          min="0"
          max={2 * Math.PI}
          step="0.01"
          value={phi}
          onChange={(e) => onUpdateState(theta, parseFloat(e.target.value))}
          className="w-full accent-purple-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}
