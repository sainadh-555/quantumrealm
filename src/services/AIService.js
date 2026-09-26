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
    const { messages, circuit, results, code, mode } = context;

    const payload = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      circuit: circuit || null,
      results: results || null,
      code: code || null,
      mode: mode || 'simulation'
    };

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${backendUrl}/api/qumi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      let actionPayload = null;
      if (data.toolActions && data.toolActions.length > 0) {
        const tool = data.toolActions[0];
        let label = 'Execute Action';
        if (tool.name === 'create_circuit') label = 'Create Circuit';
        if (tool.name === 'add_gate') label = 'Add Gate';
        if (tool.name === 'remove_gate') label = 'Remove Gate';

        actionPayload = {
          name: tool.name, // The raw OpenAI tool name
          type: 'circuit', // Tells UI to show the Flask icon
          label: label,
          circuitData: tool.arguments // The generated args (qubits, gates, etc)
        };
      }

      return {
        type: actionPayload ? 'ACTION' : 'TEXT',
        content: data.message,
        action: actionPayload
      };

    } catch (error) {
      console.error('[QUMI] API Error:', error);
      return {
        type: 'TEXT',
        content: "Qumi is temporarily unavailable or cannot connect to the backend server. Please try again.",
        action: null
      };
    }
  }

}
