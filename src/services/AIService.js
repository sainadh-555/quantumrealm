/**
 * AIService.js
 * 
 * Qumi: "Your Quantum Learning Companion"
 * AI Pedagogical & Quantum State Analysis Engine (Fully Local).
 */
import quantumKnowledge from './quantumKnowledge.json';

export class AIService {

  /**
   * Main entry point for the local QMe AI engine.
   * Processes the user's message, current circuit, and results to generate a response and actions.
   */
  static async askQumi(context) {
    const { messages, circuit, results, code } = context;
    // Get the latest user message
    const lastMessage = messages[messages.length - 1]?.text?.toLowerCase() || '';

    // 1. Off-topic checking (Domain Guardrails)
    const nonQuantumKeywords = ['president', 'weather', 'java', 'c++', 'cricket', 'football', 'sports', 'politics', 'movie', 'song'];
    if (nonQuantumKeywords.some(kw => lastMessage.includes(kw))) {
      return {
        type: 'TEXT',
        content: "That's outside my domain! I'm Qumi, your dedicated Quantum Learning Assistant. Ask me anything about quantum computing, quantum circuits, gates, algorithms, or the current simulation.",
        action: null
      };
    }

    // 2. Intent Detection
    if (lastMessage.includes('explain my circuit') || lastMessage.includes('analyze my circuit') || lastMessage.includes('what does this circuit do')) {
      return this.analyzeCircuit(circuit);
    }
    
    if (lastMessage.includes('result') || lastMessage.includes('why am i getting') || lastMessage.includes('output') || lastMessage.includes('50/50')) {
      return this.explainResults(results, circuit);
    }

    if (lastMessage.includes('build a bell state') || lastMessage.includes('create a bell state') || lastMessage.includes('entangled pair')) {
      return this.generateCircuitAction('entanglement');
    }

    if (lastMessage.includes('build a superposition') || lastMessage.includes('create a superposition')) {
      return this.generateCircuitAction('superposition');
    }

    if (lastMessage.includes('quiz me')) {
      return this.generateQuiz();
    }

    // 3. Knowledge Base Lookup
    for (const [key, data] of Object.entries(quantumKnowledge.concepts)) {
      if (lastMessage.includes(key)) {
        return this.explainConcept(data);
      }
    }
    for (const [key, data] of Object.entries(quantumKnowledge.gates)) {
      // Check if they mentioned the gate (e.g. "cnot", "hadamard", " h gate")
      if (lastMessage.includes(key) || (key === 'h' && lastMessage.includes('hadamard'))) {
        return this.explainGate(key, data);
      }
    }

    // 4. Default Fallback
    return {
      type: 'TEXT',
      content: `I can help with quantum concepts, circuits, simulation results, or Qiskit. What would you like to explore?`,
      action: null
    };
  }

  // --- Sub-Engines ---

  static analyzeCircuit(circuit) {
    if (!circuit || circuit.operations.length === 0) {
      return { type: 'TEXT', content: "Your circuit is currently empty! Try adding an H gate to start exploring superposition." };
    }

    let analysis = `### 🔍 Circuit Analysis\n\nYou currently have a circuit with **${circuit.qubits} qubit(s)** and **${circuit.operations.length} operation(s)**.\n\n`;
    
    const hasH = circuit.operations.some(op => op.gate === 'H');
    const hasCX = circuit.operations.some(op => op.gate === 'CX');
    const hasMeasure = circuit.operations.some(op => op.gate === 'MEASURE');

    if (hasH && hasCX) {
      analysis += "1. The **H gate** places a qubit into superposition.\n2. The **CX (CNOT) gate** then entangles it with a target qubit.\n\n**Conclusion:** This circuit structure is designed to create quantum entanglement (like a Bell state).";
    } else if (hasH) {
      analysis += "1. The **H gate** places a qubit into an equal superposition, meaning it has a 50/50 chance of being measured as 0 or 1.";
    } else {
      analysis += "This is a deterministic classical-like circuit. Since there are no superposition gates (like H), the output will be exactly predictable (100% probability for one state).";
    }

    if (!hasMeasure) {
      analysis += "\n\n⚠️ **Note:** I noticed you don't have any measurement gates. You won't be able to extract classical results until you add measurements at the end!";
    }

    return { type: 'TEXT', content: analysis };
  }

  static explainResults(results, circuit) {
    if (!results || !results.counts) {
      return { type: 'TEXT', content: "I don't see any simulation results yet. Please click **▶ Run Simulation** first so I can analyze the output!" };
    }

    let explanation = `### 📊 Result Analysis\n\nI see you ran the simulation for **${results.shots || 1024} shots** using the **${results.backend || 'Qiskit Aer'}** backend.\n\n`;
    
    const countKeys = Object.keys(results.counts);
    if (countKeys.length === 1) {
      explanation += `The simulation produced exactly one outcome (**|${countKeys[0]}⟩**) 100% of the time. This means your circuit is in a deterministic classical state with no superposition at the time of measurement.`;
    } else if (countKeys.length === 2 && Math.abs(results.counts[countKeys[0]] - results.counts[countKeys[1]]) < (results.shots * 0.1)) {
      explanation += `The results are split almost exactly 50/50 between **|${countKeys[0]}⟩** and **|${countKeys[1]}⟩**. This is the hallmark of an equal superposition!`;
    } else {
      explanation += `The results are spread across ${countKeys.length} different states. This indicates a complex superposition.`;
    }

    return { type: 'TEXT', content: explanation };
  }

  static generateCircuitAction(conceptKey) {
    const concept = quantumKnowledge.concepts[conceptKey];
    if (concept && concept.suggestedCircuit) {
      return {
        type: 'ACTION',
        content: `### 🏗️ Circuit Generator\n\nI can build a **${conceptKey}** circuit for you directly in the canvas.\n\n${concept.example}\n\n*Would you like me to replace your current circuit with this?*`,
        action: concept.suggestedCircuit
      };
    }
    return { type: 'TEXT', content: "I know about that concept, but I don't have a circuit template for it yet!" };
  }

  static explainConcept(conceptData) {
    let text = `### 🧠 ${conceptData.definition}\n\n**Intuition:**\n${conceptData.intuition}\n\n**Example:**\n${conceptData.example}`;
    let action = null;
    if (conceptData.suggestedCircuit) {
      text += `\n\n*Would you like me to build a circuit demonstrating this?*`;
      action = conceptData.suggestedCircuit;
    }
    return { type: 'ACTION', content: text, action };
  }

  static explainGate(gateName, gateData) {
    return {
      type: 'TEXT',
      content: `### 🚪 Gate Analysis\n\n**${gateData.definition}**\n\n${gateData.intuition}\n\nTry dragging this gate onto the circuit canvas to see how it affects the state vector!`
    };
  }

  static generateQuiz() {
    const quizzes = quantumKnowledge.quizzes;
    const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
    
    let text = `### 🎓 Quantum Quiz!\n\n**${randomQuiz.question}**\n\n`;
    randomQuiz.options.forEach((opt, idx) => {
      text += `${['A', 'B', 'C', 'D'][idx]}. ${opt}\n`;
    });
    text += `\n*(Try guessing! The correct answer is ${['A', 'B', 'C', 'D'][randomQuiz.correct]}: ${randomQuiz.explanation})*`;

    return { type: 'TEXT', content: text };
  }
}
