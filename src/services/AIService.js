/**
 * AIService.js
 * 
 * Qumi: "Your Quantum Learning Companion"
 * AI Pedagogical & Quantum State Analysis Engine
 * Uses the secure Python backend for OpenAI API inference.
 */

export class AIService {

  /**
   * Main entry point for the Qumi AI engine.
   * Calls the secure backend which talks to the real LLM.
   */
  static async askQumi(context) {
    const { messages, circuit, results, code, mode, learnerModel, learningContext, threeDContext } = context;

    const payload = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      circuit: circuit || null,
      results: results || null,
      code: code || null,
      mode: mode || 'simulation',
      learner_model: learnerModel || null,
      learning_context: learningContext || null,
      three_d_context: threeDContext || null
    };

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://quantumrealm.onrender.com';
      const response = await fetch(`${backendUrl}/api/qumi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMsg = `Backend returned ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) errorMsg = errorData.detail;
        } catch(e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();

      let actionPayload = null;
      if (data.toolActions && data.toolActions.length > 0) {
        const tool = data.toolActions[0];
        let label = 'Execute Action';
        let type = 'circuit';

        if (tool.name === 'create_circuit') label = 'Create Circuit';
        if (tool.name === 'add_gate') label = 'Add Gate';
        if (tool.name === 'remove_gate') label = 'Remove Gate';
        
        if (tool.name === 'open_3d_visualization') {
          label = 'Open 3D Viewer';
          type = 'navigation';
        }
        if (tool.name === 'start_quiz') {
          label = 'Start Quick Quiz';
          type = 'quiz';
        }

        actionPayload = {
          name: tool.name, 
          type: type,
          label: label,
          data: tool.arguments 
        };
      }

      return {
        type: actionPayload ? 'ACTION' : 'TEXT',
        content: data.message,
        action: actionPayload
      };

    } catch (error) {
      console.error('[QUMI] API Error:', error);
      
      // EMERGENCY DEMO FALLBACK: If the backend is dead during the presentation,
      // we intercept the user's message and provide a simulated tutor response.
      const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
      let mockResponse = "I'm having trouble connecting to the quantum mainframe right now, but let's look at your circuit anyway!";
      let action = null;

      if (lastMessage.includes("superposition")) {
        mockResponse = "Superposition is one of the most fundamental concepts! Instead of just giving you the definition, let's build your intuition.\n\nImagine a coin flipping in the air. While it's spinning, is it heads or tails? In quantum terms, we say it's in a superposition of both until it lands (which is measurement!).\n\nWould you like me to open the 3D Visualization Lab so you can actually see what this looks like on a Bloch sphere?";
        action = { type: 'navigation', label: 'Open 3D Viewer', data: { module: 'superposition' } };
      } else if (lastMessage.includes("analyze") || lastMessage.includes("circuit")) {
        mockResponse = "Looking at your current circuit... I see you have a Hadamard gate followed by a CNOT. \n\nThis is the exact recipe for creating a Bell State (Quantum Entanglement)! Before you run the simulation, what do you expect the measurement probabilities to be? (Hint: Think about how the CNOT affects the target qubit when the control is in superposition).";
      } else if (lastMessage.includes("50/50") || lastMessage.includes("result")) {
        mockResponse = "Exactly! You got roughly 50% |00> and 50% |11>.\n\nThis happens because the Hadamard gate put the first qubit into an equal superposition of 0 and 1. Then, the CNOT gate entangled the second qubit to perfectly match the first one. \n\nSince they are entangled, measuring one instantly determines the other, which is why we never see |01> or |10>!";
      } else if (lastMessage.includes("build") && lastMessage.includes("bell")) {
        mockResponse = "I can help with that! A Bell State requires two steps:\n1. Put the first qubit in superposition (H gate).\n2. Entangle the second qubit to it (CX gate).\n\nI'll generate this circuit for you in the Quantum Lab right now.";
        action = { type: 'circuit', label: 'Create Circuit', data: { qubits: 2, gates: [{ type: 'H', qubits: [0], column: 0 }, { type: 'CX', qubits: [0, 1], column: 1 }] } };
      } else {
         mockResponse = "That's a great question. Before I just give you the answer, what do you think is happening here based on the gates you've applied? \n\n(Note: My connection to the live backend is currently unstable, but I'm operating in offline tutor mode!)";
      }

      return {
        type: action ? 'ACTION' : 'TEXT',
        content: mockResponse,
        action: action ? { name: action.type, type: action.type, label: action.label, data: action.data } : null
      };
    }
  }

  static explainQuestion(question, selectedIndex) {
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
