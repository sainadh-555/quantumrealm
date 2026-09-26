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
QUMI_MODEL = os.getenv("QUMI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI Client
# Note: In production, the API key is automatically picked up from os.environ["OPENAI_API_KEY"]
client = OpenAI(api_key=OPENAI_API_KEY)

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

@app.post("/api/qumi")
def ask_qumi(req: QumiRequest):
    if not OPENAI_API_KEY:
        return {
            "message": "Qumi service configuration error: OPENAI_API_KEY is not set on the backend.",
            "toolActions": [],
            "metadata": {"provider": "none", "model": "none"}
        }

    try:
        system_instruction = """You are Qumi, the Quantum Tutor inside Quantum Relum.
Your domain is:
- quantum computing, quantum circuits, qubits, superposition, entanglement, measurement, quantum gates, quantum algorithms, quantum simulation, Qiskit, state vectors, probabilities, Bloch sphere, quantum error correction, quantum hardware concepts, and mathematics directly relevant to quantum computing.

For non-quantum questions (like weather, Java, sports, history), politely state that the topic is outside your domain and redirect the user toward quantum computing. Example: "That's outside my domain. I'm Qumi, your Quantum Tutor. Ask me about quantum computing, circuits, gates, algorithms, Qiskit, or your current simulation."

If the user asks to analyze their circuit, you can use the 'analyze_current_circuit' tool or just look at the injected context if available.
If the user asks to build or modify a circuit, call the appropriate tool (e.g. 'create_circuit'). 
Do not invent simulation results. If there are no results, tell the user to run the simulation first.
You are educational, clear, and beginner-friendly."""

        # Inject context into the prompt
        context_prompt = f"CURRENT APPLICATION STATE:\n"
        if req.circuit and req.circuit.get('operations'):
            context_prompt += f"CIRCUIT: {json.dumps(req.circuit)}\n"
        else:
            context_prompt += "CIRCUIT: Empty\n"
            
        if req.results:
            context_prompt += f"SIMULATION RESULTS: {json.dumps(req.results)}\n"
            
        if req.code:
            context_prompt += f"CURRENT CODE: {req.code}\n"
            
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
        raise HTTPException(status_code=500, detail="Qumi is temporarily unavailable. Please try again.")

