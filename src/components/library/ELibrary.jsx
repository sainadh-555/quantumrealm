import React from 'react';

export default function ELibrary() {
  return (
    <div className="flex-1 w-full h-full bg-[#0a0718]">
      <iframe 
        src="http://localhost:5174/" 
        className="w-full h-full border-0"
        title="Quantum E-Library"
      />
    </div>
  );
}
