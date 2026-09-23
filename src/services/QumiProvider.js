import { CreateMLCEngine } from '@mlc-ai/web-llm';

class QumiProvider {
  constructor() {
    this.engine = null;
    this.status = 'OFFLINE'; // OFFLINE, INIT, READY, ERROR
    this.progress = 0;
    this.statusMessage = '';
    this.selectedModel = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
    this.listeners = new Set();
  }

  setProgressListener(callback) {
    this.listeners.add(callback);
    // Send immediate status upon subscribe
    callback({ status: this.status, progress: this.progress, message: this.statusMessage });
    return () => this.listeners.delete(callback);
  }

  _updateStatus(status, progress = 0, msg = '') {
    this.status = status;
    this.progress = progress;
    this.statusMessage = msg;
    this.listeners.forEach(cb => cb({ status, progress, message: msg }));
  }

  async initialize() {
    if (this.status === 'READY') return true;
    if (this.status === 'INIT') return false; // Already initializing

    // Check WebGPU Support
    if (!navigator.gpu) {
      this._updateStatus('OFFLINE', 0, 'WebGPU not supported on this device. Using Deterministic engine.');
      return false;
    }

    this._updateStatus('INIT', 0, 'Initializing Qumi AI Engine...');

    try {
      const initProgressCallback = (report) => {
        // report is an object with text, progress (0-1)
        this._updateStatus('INIT', Math.round(report.progress * 100), report.text);
      };

      this.engine = await CreateMLCEngine(this.selectedModel, {
        initProgressCallback,
      });

      this._updateStatus('READY', 100, 'Qumi is ready!');
      return true;
    } catch (err) {
      console.error('[QUMI] Engine initialization failed:', err);
      this._updateStatus('ERROR', 0, 'Failed to load Qumi AI Engine. Using deterministic fallback.');
      this.engine = null;
      return false;
    }
  }

  async generateResponse(systemPrompt, userMessages, tools = []) {
    if (this.status !== 'READY' || !this.engine) {
      return null;
    }

    try {
      // Build MLCEngine expected chat format
      const messages = [
        { role: 'system', content: systemPrompt },
        ...userMessages
      ];

      // Request completion
      const reply = await this.engine.chat.completions.create({
        messages,
        temperature: 0.5,
        max_tokens: 500
      });

      return reply.choices[0].message.content;
    } catch (err) {
      console.error('[QUMI] Inference failed:', err);
      return null;
    }
  }
}

export const qumiProvider = new QumiProvider();
