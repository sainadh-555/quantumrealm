import React from 'react';

export default function ELibrary() {
  const baseUrl = import.meta.env.BASE_URL;
  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] bg-[#040612] text-gray-100 overflow-hidden">
      <iframe
        src={`${baseUrl}quantum-library/index.html`}
        className="w-full h-full border-none"
        title="QuantumVault Library"
      />
    </div>
  );
}
