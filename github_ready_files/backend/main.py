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
# You can set AI_BASE_URL to Groq's base url (https://api.groq.com/openai/v1) and AI_API_KEY to your Groq Key.
# If not set, it defaults to OpenAI's standard API.
client = OpenAI(
    api_key=os.getenv("AI_API_KEY", os.getenv("OPENAI_API_KEY", "your-api-key-here")),
    base_url=os.getenv("AI_BASE_URL", os.getenv("OPENAI_BASE_URL"))
)
# Use llama3-8b-8192 if using Groq, or gpt-4o-mini if using OpenAI.
QUMI_MODEL = os.getenv("QUMI_MODEL", "llama3-8b-8192")


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
    allow_origins=["*"],
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
    try:
        system_instruction = """You are Qumi, the intelligent quantum-computing assistant of Quantum Learn.
        You act as a Quantum Tutor, Circuit Analyst, Debugger, and Code Generator.
        You MUST NEVER act like a generic chatbot. You MUST ground your answers in the provided CURRENT CIRCUIT and SIMULATION RESULTS.
        
        CRITICAL RULES:
        1. Always output EXACTLY valid JSON and nothing else. Do not output markdown blocks around the JSON unless strictly necessary.
        2. The JSON MUST match this exact schema:
           {
             "type": "TEXT" | "ACTION",
             "content": "Your markdown-formatted explanation here",
             "action": {
                 "type": "circuit" | "run_simulation" | "add_qubit" | "measure",
                 "label": "Action button label",
                 "circuitData": { ... } // Only if type is circuit
             } | null
           }
        3. Never hallucinate circuit properties. If the circuit doesn't exist, tell the user to build one.
        4. When generating a circuit, `circuitData` must contain: `{"qubits": int, "classicalBits": int, "columns": int, "operations": [{"id": "op-1", "gate": "H", "qubit": 0, "column": 0}, ...]}`
        """
        
        context_prompt = f"CURRENT APPLICATION STATE:\n"
        if req.circuit and req.circuit.get('operations'):
            context_prompt += f"CIRCUIT: {json.dumps(req.circuit)}\n"
        else:
            context_prompt += "CIRCUIT: Empty\n"
            
        if req.results:
            context_prompt += f"SIMULATION RESULTS: {json.dumps(req.results)}\n"
            
        if req.code:
            context_prompt += f"CURRENT CODE: {req.code}\n"
            
        messages = [{"role": "system", "content": system_instruction}]
        
        for i, msg in enumerate(req.messages):
            role = "assistant" if msg.get("role") == "assistant" else "user"
            content = msg.get("content", "")
            
            if i == len(req.messages) - 1 and role == "user":
                content = context_prompt + "\nUSER MESSAGE:\n" + content
                
            messages.append({"role": role, "content": content})
            
        response = client.chat.completions.create(
            model=QUMI_MODEL,
            messages=messages,
            temperature=0.3,
            response_format={ "type": "json_object" }
        )
        
        text_resp = response.choices[0].message.content
        
        # Robust JSON extraction
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text_resp, re.DOTALL)
        if json_match:
            text_resp = json_match.group(1)
        else:
            text_resp = text_resp.strip()
            # Failsafe if the model forgot markdown blocks but output pure JSON
            if not text_resp.startswith("{"):
                # Try to extract anything looking like JSON
                alt_match = re.search(r'\{.*\}', text_resp, re.DOTALL)
                if alt_match:
                    text_resp = alt_match.group(0)

        structured_response = json.loads(text_resp)
        return structured_response

    except json.JSONDecodeError as e:
        print(f"Qumi JSON Parse Error: {e}")
        return {
            "type": "TEXT",
            "content": f"The AI model returned an invalid JSON structure. Please try asking again.",
            "action": None
        }
    except Exception as e:
        print(f"Qumi AI Error: {e}")
        return {
            "type": "TEXT",
            "content": f"Qumi is offline because the AI API encountered an error. Check your API key. ({str(e)})",
            "action": None
        }

