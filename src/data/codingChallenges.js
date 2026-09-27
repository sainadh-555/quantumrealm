export const CODING_CHALLENGES = [
  {
    id: 'bell-state',
    title: 'Create a Bell State',
    description: 'Entangle two qubits to create the |Φ+⟩ Bell state. Apply a Hadamard gate to qubit 0, followed by a CNOT gate with qubit 0 as control and qubit 1 as target.',
    xp: 150,
    difficulty: 'Beginner',
    expectedOperations: [
      { gate: 'H', qubit: 0 },
      { gate: 'CX', control: 0, target: 1 }
    ],
    validate: (circuit) => {
      const ops = circuit.operations || [];
      const hasH = ops.some(op => op.gate === 'H' && op.qubit === 0);
      const hasCX = ops.some(op => op.gate === 'CX' && op.control === 0 && op.target === 1);
      return hasH && hasCX && ops.length <= 4;
    }
  },
  {
    id: 'ghz-state',
    title: 'Create a GHZ State',
    description: 'Create a 3-qubit Greenberger–Horne–Zeilinger (GHZ) state. Start with a Hadamard on q0, then entangle q0 to q1, and q1 to q2 using CNOT gates.',
    xp: 250,
    difficulty: 'Intermediate',
    expectedOperations: [
      { gate: 'H', qubit: 0 },
      { gate: 'CX', control: 0, target: 1 },
      { gate: 'CX', control: 1, target: 2 }
    ],
    validate: (circuit) => {
      const ops = circuit.operations || [];
      const hasH = ops.some(op => op.gate === 'H' && op.qubit === 0);
      const hasCX1 = ops.some(op => op.gate === 'CX' && op.control === 0 && op.target === 1);
      const hasCX2 = ops.some(op => op.gate === 'CX' && op.control === 1 && op.target === 2);
      return hasH && hasCX1 && hasCX2 && circuit.qubits >= 3;
    }
  }
];
