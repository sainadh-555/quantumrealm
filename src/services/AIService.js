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
      three_d_context: threeDContext || null,
      attachments: context.attachments || null
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
        if (tool.name === 'simulate_circuit') { label = 'Run Simulation'; type = 'simulate'; }
        if (tool.name === 'clear_circuit') { label = 'Clear Circuit'; type = 'clear_circuit'; }
        
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
      
      let displayError = "An unknown error occurred while connecting to the Quantum Backend.";
      if (error.message.includes("QUMI_MODEL_UNAVAILABLE")) {
        displayError = "Backend Error: QUMI_MODEL_UNAVAILABLE. The configured AI model is not supported or was deprecated.";
      } else if (error.message.includes("QUMI_SERVICE_ERROR")) {
        displayError = "Backend Error: QUMI_SERVICE_ERROR. The quantum provider is currently experiencing issues.";
      } else if (error.message.includes("Failed to fetch")) {
        displayError = "Backend Error: Could not reach the server. It may be offline or waking up from sleep mode.";
      }
      
      return {
        type: 'TEXT',
        content: `❌ **Service Interruption**\n\n${displayError}`,
        action: null
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
