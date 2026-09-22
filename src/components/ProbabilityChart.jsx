import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { Info, BarChart3 } from 'lucide-react';

export default function ProbabilityChart({ probabilities = {}, counts = {}, shots = 1024, aiInsight = null }) {
  const chartData = Object.keys(probabilities).map((state) => ({
    state: `|${state}⟩`,
    probability: (probabilities[state] * 100).toFixed(1),
    count: counts[state] || 0
  }));

  const COLORS = ['#00f2fe', '#4facfe', '#7f00ff', '#a855f7', '#ec4899', '#10b981'];

  return (
    <div className="w-full flex flex-col space-y-4">
      
      {/* Top Banner / Explanation */}
      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Measurement probabilities after <strong>{shots}</strong> shots.
          </span>
        </div>
      </div>

      {/* AI Insight (What happened?) */}
      {aiInsight && (
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 shadow-inner flex space-x-3 items-start animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/40">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-purple-300 font-['Space_Grotesk'] mb-1">AI INSIGHT: What happened?</h4>
            <p className="text-sm text-gray-300 leading-relaxed font-sans">{aiInsight}</p>
          </div>
        </div>
      )}

      {/* Recharts Bar Chart */}
      <div className="h-64 w-full bg-[#080b1e]/60 rounded-xl p-4 border border-white/5">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs font-mono">
            No simulation results available. Click ▶ RUN SIMULATION.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="state"
                stroke="#94a3b8"
                tick={{ fill: '#00f2fe', fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#94a3b8"
                unit="%"
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c1024',
                  borderColor: '#00f2fe',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 8px 32px rgba(0, 242, 254, 0.2)'
                }}
                formatter={(value, name, props) => [
                  `${value}% (${props.payload.count} shots)`,
                  'Probability'
                ]}
              />
              <Bar dataKey="probability" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Animated Probability Bars (Basis States Table) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {chartData.map((d, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-cyan-300 font-bold text-sm">{d.state}</span>
              <div className="font-mono text-white text-sm font-semibold">{d.probability}%</div>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${d.probability}%` }} 
              />
            </div>
            <div className="text-[10px] text-gray-400 font-mono text-right">{d.count} shots</div>
          </div>
        ))}
      </div>

    </div>
  );
}
