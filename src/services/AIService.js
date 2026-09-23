/**
 * AIService.js
 * 
 * Qumi: "Your Quantum Learning Companion"
 * AI Pedagogical & Quantum State Analysis Engine
 * Uses WebLLM for local inference when available, falling back to deterministic rules.
 */
import quantumKnowledge from './quantumKnowledge.json';
import { qumiProvider } from './QumiProvider.js';

export class AIService {

  /**
   * Generates the system prompt based on current application context
   */
  static getSystemPrompt(context) {
    const { circuit, results, code, mode, currentTopic, learnerLevel } = context;
    
    let prompt = `You are Qumi, the quantum computing tutor inside Quantum Relum.
Your domain is quantum computing and closely related mathematics and physics.
You help beginners and advanced learners understand quantum concepts, gates, circuits, Qiskit, algorithms, simulation results, state vectors, and probabilities.

For non-quantum questions (like sports, java, weather, etc.), politely state that the topic is outside your domain and redirect the user toward quantum computing.
Be educational, clear, accurate, and concise.

Current Context:
Mode: ${mode || 'Simulation'}
`;

    if (mode === 'learning') {
      prompt += `Current Learning Topic: ${currentTopic || 'General'}\nLearner Level: ${learnerLevel || 'Beginner'}\nTailor your explanation to this level.\n`;
    }

    if (circuit) {
      prompt += `\nUser's Current Circuit:
Qubits: ${circuit.qubits || 1}
Operations: ${circuit.operations && circuit.operations.length > 0 ? JSON.stringify(circuit.operations) : 'Empty'}
`;
    }

    if (results && results.counts) {
      prompt += `\nLatest Simulation Results:
Counts: ${JSON.stringify(results.counts)}
`;
    }

    prompt += `
When the user requests to create or modify a circuit (e.g. "Build a Bell state"), you MUST provide a structured JSON action block at the very end of your response to execute it.
Only include the JSON block if you are building or modifying a circuit.

Format for the JSON block:
\`\`\`json
{
  "action": "createCircuit",
  "gates": [
    { "type": "H", "qubits": [0], "column": 0 },
    { "type": "CX", "qubits": [0, 1], "column": 1 }
  ]
}
\`\`\`

Never pretend to have analyzed a circuit or simulation if the actual context was not supplied. Do not fabricate simulation results.
`;

    return prompt;
  }

  /**
   * Main entry point for the local Qumi AI engine.
   */
  static async askQumi(context) {
    const { messages } = context;
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    // Convert UI messages to LLM messages format
    const llmMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // 1. Domain Guardrails (Fast Rejection)
    const nonQuantumKeywords = ['president', 'weather', 'java', 'c++', 'cricket', 'football', 'sports', 'politics', 'movie', 'song'];
    if (nonQuantumKeywords.some(kw => lastMessage.includes(kw))) {
      return {
        type: 'TEXT',
        content: "That's outside my domain. I'm Qumi, your Quantum Tutor. Ask me about quantum computing, circuits, gates, algorithms, Qiskit, or your simulation.",
        action: null
      };
    }

    // 2. Try Local LLM via QumiProvider
    if (qumiProvider.status === 'READY') {
      console.log('[QUMI] Using Local WebLLM Provider');
      const responseText = await qumiProvider.generateResponse(
        this.getSystemPrompt(context),
        llmMessages
      );

      if (responseText) {
        return this.parseLLMResponse(responseText);
      }
    }
    
    // 3. Fallback: Deterministic Engine (If LLM is offline or fails)
    console.log('[QUMI] Using Deterministic Fallback Engine');
    return this.deterministicFallback(lastMessage, context);
  }

  /**
   * Parses the LLM text response for JSON action blocks
   */
  static parseLLMResponse(responseText) {
    let content = responseText;
    let action = null;

    // Look for ```json block at the end of the text
    const jsonMatch = responseText.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
    if (jsonMatch) {
      try {
        const parsedAction = JSON.parse(jsonMatch[1]);
        if (parsedAction && parsedAction.action) {
          action = parsedAction.action; // e.g. "createCircuit"
          // We map 'createCircuit' to our internal action flags
          if (action === 'createCircuit') {
            // For the sake of the existing UI, map to specific circuit concepts if needed, 
            // or return the raw gates to be built.
            // Currently QumiWorkspace handles 'entanglement' and 'superposition' specifically.
            // We will return the structured data so the UI can process it.
            action = { type: 'BUILD_CIRCUIT', data: parsedAction };
          }
        }
        // Remove the JSON block from the text shown to the user
        content = content.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.error('[QUMI] Failed to parse action JSON from LLM:', e);
      }
    }

    return {
      type: 'TEXT',
      content,
      action
    };
  }

  // --- Deterministic Fallback Engine ---

  static deterministicFallback(lastMessage, context) {
    const { circuit, results } = context;

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

    // Knowledge Base Lookup
    for (const [key, data] of Object.entries(quantumKnowledge.concepts)) {
      if (lastMessage.includes(key)) {
        return this.explainConcept(data);
      }
    }
    for (const [key, data] of Object.entries(quantumKnowledge.gates)) {
      if (lastMessage.includes(key) || (key === 'h' && lastMessage.includes('hadamard'))) {
        return this.explainGate(key, data);
      }
    }

    // Fallback Clarification
    return {
      type: 'TEXT',
      content: `I can help with quantum concepts, circuits, simulation results, or Qiskit. What would you like to explore?`,
      action: null
    };
  }

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

    return { type: 'TEXT', content: analysis, action: null };
  }

  static explainResults(results, circuit) {
    if (!results || !results.counts || Object.keys(results.counts).length === 0) {
      return { type: 'TEXT', content: "I don't have a simulation result yet. Run the circuit first and I can analyze the output." };
    }

    const counts = results.counts;
    const states = Object.keys(counts);
    let explanation = `### 📊 Results Analysis\n\nI see you ran **${results.shots || 1024} shots**.\n\n`;
    
    if (states.length > 1) {
      const is5050 = states.length === 2 && Math.abs(counts[states[0]] - counts[states[1]]) < (results.shots * 0.1);
      if (is5050) {
        explanation += `The results are roughly split 50/50 between **|${states[0]}⟩** and **|${states[1]}⟩**.\n\nThis indicates your qubits were in a state of **superposition** before measurement! Each time we measure, the quantum state randomly collapses into one of those classical states.`;
      } else {
        explanation += `The probabilities are spread across multiple states: ${states.map(s => `**|${s}⟩**`).join(', ')}.\n\nThis distribution represents the amplitudes of your quantum state vector collapsing upon measurement.`;
      }
    } else {
      explanation += `The result is 100% deterministic, landing entirely on **|${states[0]}⟩**.\n\nThis means there was no superposition or uncertainty remaining when the measurement was applied.`;
    }

    return { type: 'TEXT', content: explanation, action: null };
  }

  static explainConcept(data) {
    let msg = `**${data.name}**\n\n${data.intuition}\n\n`;
    if (data.example) msg += `*Analogy:* ${data.example}\n\n`;
    
    let action = null;
    if (data.starterCircuit) {
      msg += `I can build a starter circuit to demonstrate this!`;
      action = data.starterCircuit;
    }

    return { type: 'TEXT', content: msg, action };
  }

  static explainGate(key, data) {
    let msg = `**${data.name} (${key.toUpperCase()})**\n\n${data.definition}\n\n`;
    msg += `**Matrix:**\n\`\`\`\n${data.matrix[0]}\n${data.matrix[1]}\n\`\`\`\n`;
    
    return { type: 'TEXT', content: msg, action: null };
  }

  static generateCircuitAction(conceptId) {
    let explanation = "";
    if (conceptId === 'entanglement') {
      explanation = "A Bell state is the simplest example of quantum entanglement. I can create one by applying an **H gate** to q0 to create superposition, followed by a **CNOT gate** from q0 to q1 to entangle them.\n\nYour current circuit will be replaced with a Bell-state circuit. Continue?";
    } else {
      explanation = "I can build a starter circuit to demonstrate this concept. Your current circuit will be replaced. Continue?";
    }
    return { type: 'TEXT', content: explanation, action: conceptId };
  }

  static generateQuiz() {
    return {
      type: 'TEXT',
      content: "Let's test you.\n\nWhich gate creates an equal superposition from |0⟩?\n\nA. Pauli-X\nB. Hadamard (H)\nC. Pauli-Z\nD. CNOT",
      action: 'QUIZ_1'
    };
  }

  static explainQuestion(question, selectedIndex) {
    // Used by the Quantum Rush Quiz system
    if (selectedIndex === question.correctAnswer) return { text: "Correct!" };
    
    return {
      text: `Not quite! The correct answer was ${String.fromCharCode(65 + question.correctAnswer)}. ${question.explanation}`,
      starterCircuitConcept: question.concept
    };
  }

  static generateHint(question) {
    return `Think about what the ${question.concept} concept fundamentally changes about a quantum state.`;
  }
}
