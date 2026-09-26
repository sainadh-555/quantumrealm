import React from 'react';

export default function ELibrary() {
  return (
    <div className="flex-1 w-full h-full">
      <iframe
        src={`${import.meta.env.BASE_URL}elibrary/index.html`}
        className="w-full h-full border-none"
        title="QuantumVault E-Library"
      />
    </div>
  );
}
