"""
FastAPI Qiskit Simulation Backend for Quantum Learn (Team Neural Nomads)

Run locally:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import time
import math
import os
import json
import urllib.request
import urllib.error
import re
from dotenv import load_dotenv

from openai import OpenAI

load_dotenv()
QUMI_MODEL = os.getenv("QUMI_MODEL", "gpt-4o-mini").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROK_API_KEY = os.getenv("GROK_API_KEY")

# Initialize Client (Supports OpenAI, xAI Grok, and Groq)
if GROK_API_KEY and GROK_API_KEY.startswith("gsk_"):
    # The user actually provided a Groq key!
    client = OpenAI(
        api_key=GROK_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )
    if os.getenv("QUMI_MODEL") is None:
        QUMI_MODEL = "llama-3.1-8b-instant"
elif GROK_API_KEY:
    client = OpenAI(
        api_key=GROK_API_KEY,
        base_url="https://api.x.ai/v1"
    )
    if os.getenv("QUMI_MODEL") is None:
        QUMI_MODEL = "grok-beta"
elif OPENAI_API_KEY and OPENAI_API_KEY.startswith("gsk_"):
    client = OpenAI(
        api_key=OPENAI_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )
    if os.getenv("QUMI_MODEL") is None:
        QUMI_MODEL = "llama-3.1-70b-versatile"
elif OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)
else:
    client = None

# Try importing Qiskit
try:
    from qiskit import QuantumCircuit
    from qiskit.quantum_info import Statevector
    try:
        from qiskit_aer import AerSimulator
        AER_AVAILABLE = True
    except ImportError:
        AER_AVAILABLE = False
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False

app = FastAPI(
    title="Quantum Learn API Service",
    description="FastAPI + Qiskit Execution Service for Quantum Simulation Studio",
    version="1.0.0"
)

# Enable CORS for local Vite dev server (http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "https://sainadh-555.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

class CircuitOperation(BaseModel):
    gate: str
    qubit: Optional[int] = None
    control: Optional[int] = None
    target: Optional[int] = None
    column: Optional[int] = None

class CircuitRequest(BaseModel):
    qubits: int
    classicalBits: Optional[int] = None
    operations: List[CircuitOperation]

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Quantum Learn Qiskit Backend",
        "qiskit_installed": QISKIT_AVAILABLE,
        "aer_available": AER_AVAILABLE
    }

@app.post("/api/simulate")
def simulate_circuit(circuit: CircuitRequest):
    start_time = time.time()
    
    if not QISKIT_AVAILABLE:
        raise HTTPException(
            status_code=500,
            detail="Qiskit library is not installed on the server backend. Please run `pip install qiskit qiskit-aer`."
        )

    num_qubits = circuit.qubits
    num_bits = circuit.classicalBits if circuit.classicalBits is not None else num_qubits

    # Create Qiskit QuantumCircuit
    qc = QuantumCircuit(num_qubits, num_bits)

    # Sort operations by column
    sorted_ops = sorted(circuit.operations, key=lambda op: op.column if op.column is not None else 0)

    has_measurements = False

    for op in sorted_ops:
        gate = op.gate.upper()
        if gate == 'H' and op.qubit is not None:
            qc.h(op.qubit)
        elif gate == 'X' and op.qubit is not None:
            qc.x(op.qubit)
        elif gate == 'Y' and op.qubit is not None:
            qc.y(op.qubit)
        elif gate == 'Z' and op.qubit is not None:
            qc.z(op.qubit)
        elif gate == 'S' and op.qubit is not None:
            qc.s(op.qubit)
        elif gate == 'T' and op.qubit is not None:
            qc.t(op.qubit)
        elif gate == 'I' and op.qubit is not None:
            qc.id(op.qubit)
        elif gate == 'CX' and op.control is not None and op.target is not None:
            qc.cx(op.control, op.target)
        elif gate == 'CZ' and op.control is not None and op.target is not None:
            qc.cz(op.control, op.target)
        elif gate == 'RESET' and op.qubit is not None:
            qc.reset(op.qubit)
        elif gate == 'MEASURE' and op.qubit is not None:
            cbit = op.qubit if op.qubit < num_bits else 0
            qc.measure(op.qubit, cbit)
            has_measurements = True

    # Calculate Statevector prior to measurements if needed
    try:
        # Create circuit copy without measurements for statevector calculation
        qc_no_meas = qc.remove_final_measurements(inplace=False)
        sv = Statevector.from_instruction(qc_no_meas)
        sv_data = []
        for amp in sv.data:
            sv_data.append({
                "real": round(float(amp.real), 4),
                "imag": round(float(amp.imag), 4),
                "magnitude": round(float(abs(amp)), 4)
            })
    except Exception as e:
        sv_data = []

    # Calculate Shot Counts using AerSimulator or Statevector sampling
    shots = 1024
    counts = {}
    probabilities = {}

    if AER_AVAILABLE:
        backend = AerSimulator()
        # Add measurements if none present for sampling
        if not has_measurements:
            qc_exec = qc.copy()
            qc_exec.measure_all()
        else:
            qc_exec = qc

        result = backend.run(qc_exec, shots=shots).result()
        raw_counts = result.get_counts(qc_exec)
        backend_name = "Qiskit Aer Simulator"

        for k, v in raw_counts.items():
            # Format binary key
            clean_key = k.replace(" ", "")
            counts[clean_key] = v
            probabilities[clean_key] = round(v / shots, 4)
    else:
        # Fallback to Statevector probabilities if Aer is not installed
        backend_name = "Qiskit Basic Provider (Statevector)"
        probs = sv.probabilities_dict()
        for k, p in probs.items():
            cnt = int(round(p * shots))
            counts[k] = cnt
            probabilities[k] = round(p, 4)

    exec_time = round(time.time() - start_time, 4)

    return {
        "success": True,
        "counts": counts,
        "probabilities": probabilities,
        "statevector": sv_data,
        "execution_time": exec_time,
        "backend": backend_name,
        "shots": shots
    }

class QumiRequest(BaseModel):
    messages: List[Dict[str, Any]]
    circuit: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
    code: Optional[str] = None
    learner_model: Optional[Dict[str, Any]] = None
    learning_context: Optional[str] = None
    three_d_context: Optional[Dict[str, Any]] = None

@app.post("/api/qumi")
def ask_qumi(req: QumiRequest):
    if not client:
        return {
            "message": "Qumi service configuration error: Neither OPENAI_API_KEY nor GROK_API_KEY is set on the backend.",
            "toolActions": [],
            "metadata": {"provider": "none", "model": "none"}
        }

    try:
        system_instruction = """You are Qumi, the Personal Quantum Tutor embedded inside Quantum Relum.
You are NOT a generic chatbot. Your goal is to behave like a genuinely intelligent, context-aware, adaptive human tutor for quantum computing.

CORE TUTORING LOOP:
OBSERVE -> DIAGNOSE -> UNDERSTAND CONTEXT -> CHOOSE STRATEGY -> EXPLAIN/QUESTION/HINT -> CHECK UNDERSTANDING.

TEACHING RULES:
1. Optimize for understanding, not just answering quickly. If the user asks a conceptual question or is stuck on a problem, DO NOT immediately reveal the answer. Use a Socratic hint ladder (subtle nudge -> conceptual clue -> relevant gate -> partial solve -> full solution).
2. Detect common misconceptions (e.g., "measurement reveals a hidden classical value", "entanglement is faster-than-light communication"). Correct them immediately. Explain WHY they are wrong and then explain the correct idea.
3. Be Never-Boring: If a user repeatedly struggles with a concept, change your teaching strategy (analogy -> visual -> circuit -> math).
4. Adapt to the user's level (beginner/intermediate/advanced) based on the provided Learner Model. Use active recall and spaced review when appropriate.
5. Ground your knowledge in the actual Quantum Relum state. Use the circuit, simulation results, or 3D visualizer state provided in the context. Never invent simulation results. If 51% |00> and 49% |11> is provided, explain those exact numbers.
6. Act as a Circuit Coach. If the user's circuit has errors, identify them, explain why, and tell them how to fix it. Suggest optimizations if you see redundancy (like X followed by X).
7. If you lack context, say "I don't know" or ask the user to provide it.
8. Distinguish between teaching modes automatically (Tutor, Socratic, Practice, Circuit Coach, Debugger).
9. Output formatting: Keep your responses concise (2-4 short paragraphs maximum). Avoid generic chatbot filler like "Great question!" or "Sure!". Be calm, curious, and precise.

You have access to the user's live application state. You can also trigger UI actions using tools if necessary."""

        # Inject context into the prompt
        context_prompt = f"CURRENT APPLICATION STATE:\n"
        if req.circuit and req.circuit.get('operations'):
            context_prompt += f"CIRCUIT: {json.dumps(req.circuit)}\n"
        elif req.circuit is not None:
            context_prompt += "CIRCUIT: Empty (0 gates applied in the lab)\n"
        else:
            context_prompt += "CIRCUIT: Not currently in the Simulation Lab. DO NOT mention gates or circuits unless the user asks about them.\n"
            
        if req.results:
            context_prompt += f"SIMULATION RESULTS: {json.dumps(req.results)}\n"
            
        if req.learner_model:
            context_prompt += f"LEARNER MODEL: {json.dumps(req.learner_model)}\n"
            
        if req.learning_context:
            context_prompt += f"ACTIVE LEARNING MODULE: {req.learning_context}\n"
            
        if req.three_d_context:
            context_prompt += f"3D VISUALIZATION CONTEXT: {json.dumps(req.three_d_context)}\n"
            
        openai_messages = [{"role": "system", "content": system_instruction}]
        
        # Add conversation history
        for i, msg in enumerate(req.messages):
            role = "assistant" if msg.get("role") == "assistant" else "user"
            content = msg.get("content", "")
            
            # If it's a tool result from the frontend, format it as a system or user message
            if msg.get("role") == "tool":
                role = "user"
                content = f"[System: Tool execution result] {content}"
                
            if i == len(req.messages) - 1 and role == "user":
                content = context_prompt + "\nUSER MESSAGE:\n" + content
                
            openai_messages.append({"role": role, "content": content})

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "create_circuit",
                    "description": "Create a new quantum circuit, completely replacing the current one.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "qubits": {"type": "integer", "description": "Number of qubits in the circuit"},
                            "gates": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {"type": "string", "description": "Gate type (e.g. H, CX, X, MEASURE)"},
                                        "qubits": {"type": "array", "items": {"type": "integer"}, "description": "Target qubits (e.g. [0] or [0, 1] for CNOT)"},
                                        "column": {"type": "integer", "description": "The time step column for the gate (0-indexed)"}
                                    },
                                    "required": ["type", "qubits", "column"]
                                }
                            }
                        },
                        "required": ["qubits", "gates"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "add_gate",
                    "description": "Add a single quantum gate to the current circuit.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string", "description": "Gate type (e.g. H, CX, X, MEASURE)"},
                            "qubits": {"type": "array", "items": {"type": "integer"}, "description": "Target qubits (e.g. [0] or [0, 1] for CNOT)"},
                            "column": {"type": "integer", "description": "Optional: Specific column to place the gate. If omitted, places at the end."}
                        },
                        "required": ["type", "qubits"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "open_3d_visualization",
                    "description": "Navigate the user to the 3D Quantum Visualization Lab. Use this when you want to show them a visual geometric representation of a state.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "module": {"type": "string", "description": "Which 3D module to open (e.g., 'qubit', 'superposition', 'entanglement', 'gates')"}
                        },
                        "required": ["module"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "start_quiz",
                    "description": "Ask the user a quick quiz question as a micro-challenge to test their understanding.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string", "description": "The quiz question"},
                            "options": {"type": "array", "items": {"type": "string"}, "description": "Array of multiple choice options"},
                            "correctIndex": {"type": "integer", "description": "The 0-based index of the correct option"}
                        },
                        "required": ["question", "options", "correctIndex"]
                    }
                }
            }
        ]

        response = client.chat.completions.create(
            model=QUMI_MODEL,
            messages=openai_messages,
            tools=tools,
            temperature=0.7,
            max_tokens=800
        )
        
        message = response.choices[0].message
        
        tool_actions = []
        if message.tool_calls:
            for tool_call in message.tool_calls:
                tool_actions.append({
                    "name": tool_call.function.name,
                    "arguments": json.loads(tool_call.function.arguments)
                })

        return {
            "message": message.content or "",
            "toolActions": tool_actions,
            "metadata": {
                "provider": "openai",
                "model": QUMI_MODEL,
                "requestId": response.id
            }
        }

    except Exception as e:
        print(f"[QUMI ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Qumi Error: {str(e)}")

