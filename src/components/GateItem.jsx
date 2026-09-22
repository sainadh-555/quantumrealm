import React from 'react';
import { Info, GripVertical } from 'lucide-react';

export default function GateItem({ gate, onSelectGate, onExplainGate, isSelected }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', gate.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelectGate && onSelectGate(gate)}
      className={`group relative flex items-center justify-between p-2 rounded border transition-all cursor-grab active:cursor-grabbing select-none ${
        isSelected
          ? 'bg-[#151a2d] border-cyan-500 border-l-4'
          : 'bg-[#0b0e1b] border-white/5 hover:border-white/20 hover:bg-[#121626]'
      }`}
    >
      <div className="flex items-center space-x-2.5">
        {/* Grip indicator */}
        <GripVertical className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 transition-colors" />

        {/* Gate Symbol Badge */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm shadow-inner ${gate.color}`}>
          {gate.symbol}
        </div>

        {/* Gate Name */}
        <div>
          <h4 className="text-xs font-semibold text-gray-200 group-hover:text-white font-mono">
            {gate.name}
          </h4>
          <p className="text-[10px] text-gray-400 line-clamp-1">
            {gate.description}
          </p>
        </div>
      </div>

      {/* Info Button for Educational Explanation */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onExplainGate(gate);
        }}
        className="p-1 rounded-md text-gray-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
        title="Explain Gate"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
