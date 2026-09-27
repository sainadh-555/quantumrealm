import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Compass,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
  Atom,
  FlaskConical,
  Activity,
  Box,
  BarChart,
  Bot
} from 'lucide-react';

export default function Learning3D({ onNavigateBack, onOpenInLab }) {
  const mountRef = useRef(null);

  const [activeModule, setActiveModule] = useState('bloch'); 

  // Qubit State (Theta, Phi)
  const [theta, setTheta] = useState(0); 
  const [phi, setPhi] = useState(0); 

  // Measurement states
  const [measuredState, setMeasuredState] = useState(null);
  const [shotsResult, setShotsResult] = useState(null); // { '0': count, '1': count } or { '00': count, '11': count }

  // References to Three.js objects
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const stateVectorRef = useRef(null);
  const animStateRef = useRef({ theta: 0, phi: 0 }); // for smooth animation

  // Math helper for Vector
  const updateVector = (t, p) => {
    if (!stateVectorRef.current) return;
    const r = 1.0;
    const x = r * Math.sin(t) * Math.cos(p);
    const z = r * Math.sin(t) * Math.sin(p);
    const y = r * Math.cos(t);

    const targetPos = new THREE.Vector3(x, y, z);
    
    if (targetPos.lengthSq() > 0.001) {
      stateVectorRef.current.position.set(0, 0, 0);
      stateVectorRef.current.setDirection(targetPos.normalize());
      stateVectorRef.current.setLength(1.0, 0.2, 0.08);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060918);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(2.5, 1.5, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const gridHelper = new THREE.GridHelper(4, 20, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -1.1;
    scene.add(gridHelper);

    // BLOCH SPHERE SETUP
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.15,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    // Axes
    const axesGroup = new THREE.Group();
    const createAxis = (color, euler) => {
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 });
      const pts = [new THREE.Vector3(0, -1.2, 0), new THREE.Vector3(0, 1.2, 0)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, mat);
      if (euler) line.rotation.copy(euler);
      return line;
    };
    axesGroup.add(createAxis(0x3b82f6)); // Y
    axesGroup.add(createAxis(0xf43f5e, new THREE.Euler(0, 0, Math.PI/2))); // X
    axesGroup.add(createAxis(0x10b981, new THREE.Euler(Math.PI/2, 0, 0))); // Z
    scene.add(axesGroup);

    // State Vector
    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      1.0,
      0xd946ef,
      0.2,
      0.08
    );
    scene.add(arrowHelper);
    stateVectorRef.current = arrowHelper;

    updateVector(animStateRef.current.theta, animStateRef.current.phi);

    // Mouse Orbit Controls
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let spherical = { radius: 3.5, theta: Math.PI / 4, phi: Math.PI / 3 };

    const updateCameraPos = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    const onMouseDown = (e) => { isDragging = true; previousMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      spherical.theta -= (e.clientX - previousMouse.x) * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - (e.clientY - previousMouse.y) * 0.008));
      previousMouse = { x: e.clientX, y: e.clientY };
      updateCameraPos();
    };
    const onMouseUp = () => { isDragging = false; };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop (Smooth Interpolation)
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      
      // Smoothly interpolate towards target theta/phi
      const targetT = window.currentTargetTheta || 0;
      const targetP = window.currentTargetPhi || 0;
      
      animStateRef.current.theta += (targetT - animStateRef.current.theta) * 0.1;
      
      // Handle Phi wrapping for shortest path animation
      let dPhi = targetP - animStateRef.current.phi;
      if (dPhi > Math.PI) dPhi -= 2 * Math.PI;
      if (dPhi < -Math.PI) dPhi += 2 * Math.PI;
      animStateRef.current.phi += dPhi * 0.1;
      
      updateVector(animStateRef.current.theta, animStateRef.current.phi);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, []);

  // Sync React state to Window globals for animation loop
  useEffect(() => {
    window.currentTargetTheta = theta;
    window.currentTargetPhi = phi;
    setMeasuredState(null); // Reset measurement on state change
    setShotsResult(null);
  }, [theta, phi]);

  // Gate Operations
  const applyReset = () => { setTheta(0); setPhi(0); };
  
  const applyX = () => { 
    setTheta(Math.PI - theta); 
    setPhi((phi + Math.PI) % (2*Math.PI)); 
  };
  
  const applyY = () => {
    setTheta(Math.PI - theta);
    setPhi((Math.PI - phi + 2*Math.PI) % (2*Math.PI));
  };
  
  const applyZ = () => {
    setPhi((phi + Math.PI) % (2*Math.PI));
  };
  
  const applyH = () => {
    if (Math.abs(theta) < 0.1) { setTheta(Math.PI/2); setPhi(0); }
    else if (Math.abs(theta - Math.PI) < 0.1) { setTheta(Math.PI/2); setPhi(Math.PI); }
    else if (Math.abs(theta - Math.PI/2) < 0.1 && Math.abs(phi) < 0.1) { setTheta(0); setPhi(0); }
    else if (Math.abs(theta - Math.PI/2) < 0.1 && Math.abs(phi - Math.PI) < 0.1) { setTheta(Math.PI); setPhi(0); }
    else {
      const newTheta = Math.PI/2 - theta + Math.PI/4;
      setTheta(Math.max(0, Math.min(Math.PI, newTheta)));
    }
  };
  
  const applyMeasure = () => {
    const prob1 = Math.sin(theta / 2) ** 2;
    const outcome = Math.random() < prob1 ? 1 : 0;
    setMeasuredState(outcome);
    setTheta(outcome === 1 ? Math.PI : 0);
    setPhi(0);
  };

  const applyShots = () => {
    if (activeModule === 'entanglement') {
      // Hardcoded Bell state results for entanglement module
      setShotsResult({ '00': 50, '11': 50, '01': 0, '10': 0 });
      return;
    }
    const prob1 = Math.sin(theta / 2) ** 2;
    let count1 = 0;
    for(let i = 0; i < 100; i++) {
      if (Math.random() < prob1) count1++;
    }
    setShotsResult({ '0': 100 - count1, '1': count1 });
  };

  const prob0 = activeModule === 'entanglement' ? 0.5 : Math.cos(theta/2)**2;
  const prob1 = activeModule === 'entanglement' ? 0.5 : Math.sin(theta/2)**2;

  const modules = [
    { id: 'bloch', label: 'Bloch Sphere', icon: Compass },
    { id: 'qubit', label: 'State Vectors', icon: Activity },
    { id: 'superposition', label: 'Superposition', icon: Layers },
    { id: 'entanglement', label: 'Entanglement', icon: Sparkles },
    { id: 'gates', label: 'Gate Lab', icon: Box }
  ];

  const renderModuleDescription = () => {
    switch(activeModule) {
      case 'bloch':
        return "The Bloch Sphere is a geometric representation of a single qubit's state. The poles represent classical states |0⟩ and |1⟩, while the surface represents all possible quantum superpositions.";
      case 'qubit':
        return "Explore the quantum state by adjusting the Theta (probability amplitude) and Phi (relative phase) angles. Notice how Phi rotates the vector around the equator without changing measurement probabilities.";
      case 'superposition':
        return "Superposition allows a qubit to be in multiple states simultaneously. Applying a Hadamard (H) gate to |0⟩ creates a perfect 50/50 superposition, visually placing the state vector on the equator.";
      case 'entanglement':
        return "Entanglement strongly correlates qubits. In a Bell State (|Φ+⟩), measuring one qubit instantly determines the other. Run 100 shots to see that only |00⟩ and |11⟩ are observed, never |01⟩ or |10⟩.";
      case 'gates':
        return "Quantum gates act as smooth rotations in 3D space. Watch the state vector visibly move as you apply X (180° rotation around X), Z (phase rotation), or H gates.";
      default: return "";
    }
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] bg-[#040612] text-gray-100 flex flex-col lg:flex-row overflow-hidden select-none">
      
      {/* 3D Viewport */}
      <div className="flex-1 relative h-[45vh] lg:h-full bg-[#060918] overflow-hidden">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 p-1.5 rounded-xl bg-[#090d24]/90 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-cyan-300">
            <Atom className="w-4 h-4 text-cyan-400" />
            <span>Interactive Quantum Visualization Lab</span>
          </div>
        </div>

        {measuredState !== null && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 border border-amber-500/50 p-4 rounded-2xl flex flex-col items-center animate-bounce">
            <span className="text-[10px] text-amber-400 font-mono uppercase tracking-widest mb-1">Measured Outcome</span>
            <span className="text-4xl font-bold text-white">|{measuredState}⟩</span>
          </div>
        )}
      </div>

      {/* Side Panel */}
      <aside className="w-full lg:w-[420px] h-[55vh] lg:h-full bg-[#070b1f] border-t lg:border-t-0 lg:border-l border-white/10 p-5 flex flex-col overflow-y-auto">
        
        {/* Module Selector */}
        <div className="mb-5">
          <div className="grid grid-cols-2 gap-2">
            {modules.map(mod => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  onClick={() => { setActiveModule(mod.id); applyReset(); }}
                  className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
                    activeModule === mod.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{mod.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 space-y-5">
          
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs leading-relaxed text-gray-300 font-sans">
            <Info className="w-3.5 h-3.5 text-cyan-400 inline mb-0.5 mr-1.5" />
            {renderModuleDescription()}
          </div>

          {/* Qubit State / Interactive Control */}
          {activeModule === 'qubit' && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Parameter Controls</h4>
              
              <div>
                <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-2">
                  <span>Theta (Amplitude): {(theta * 180 / Math.PI).toFixed(0)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.PI}
                  step="0.01"
                  value={theta}
                  onChange={(e) => setTheta(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-white/10 rounded-full appearance-none"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-2">
                  <span>Phi (Phase): {(phi * 180 / Math.PI).toFixed(0)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={2 * Math.PI}
                  step="0.01"
                  value={phi}
                  onChange={(e) => setPhi(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 h-1 bg-white/10 rounded-full appearance-none"
                />
              </div>
            </div>
          )}

          {/* Probabilities & Shots */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Probability Distribution</h4>
              {activeModule === 'entanglement' && (
                <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">Bell State |Φ+⟩</span>
              )}
            </div>
            
            {activeModule !== 'entanglement' ? (
              <>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-400">P(|0⟩)</span>
                  <span className="text-emerald-400 font-bold">{(prob0 * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${prob0 * 100}%` }} />
                </div>

                <div className="flex justify-between items-center text-xs font-mono mt-3">
                  <span className="text-gray-400">P(|1⟩)</span>
                  <span className="text-rose-400 font-bold">{(prob1 * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 transition-all duration-300" style={{ width: `${prob1 * 100}%` }} />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="text-center p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-[10px] font-mono text-gray-400 mb-1">|00⟩</div>
                  <div className="text-emerald-400 font-bold font-mono">50.0%</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-[10px] font-mono text-gray-400 mb-1">|11⟩</div>
                  <div className="text-emerald-400 font-bold font-mono">50.0%</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-lg border border-rose-500/20">
                  <div className="text-[10px] font-mono text-gray-500 mb-1">|01⟩</div>
                  <div className="text-rose-400 font-bold font-mono">0.0%</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-lg border border-rose-500/20">
                  <div className="text-[10px] font-mono text-gray-500 mb-1">|10⟩</div>
                  <div className="text-rose-400 font-bold font-mono">0.0%</div>
                </div>
              </div>
            )}
          </div>

          {/* Gate Controls */}
          {activeModule !== 'entanglement' && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Apply Transformations</h4>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={applyX} className="py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold font-mono transition-colors">X</button>
                <button onClick={applyY} className="py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono transition-colors">Y</button>
                <button onClick={applyZ} className="py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono transition-colors">Z</button>
                <button onClick={applyH} className="py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold font-mono transition-colors">H</button>
              </div>
            </div>
          )}

          {/* Measurements & Shots */}
          <div className="grid grid-cols-2 gap-2 pt-2">
             <button onClick={applyMeasure} className="py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wide transition-colors">
              Single Measure
            </button>
            <button onClick={applyShots} className="py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 border border-white/20 text-[11px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors">
              <BarChart className="w-3.5 h-3.5" /> 100 Shots
            </button>
          </div>

          {/* Histogram Results */}
          {shotsResult && (
            <div className="p-3 bg-black/30 rounded-xl border border-white/10">
               <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2 text-center">Simulation Results (100 Shots)</h4>
               <div className="flex justify-center gap-4">
                 {Object.entries(shotsResult).map(([state, count]) => (
                   <div key={state} className="flex flex-col items-center justify-end h-24 w-12">
                     <span className="text-[10px] font-mono text-gray-400 mb-1">{count}</span>
                     <div className="w-full bg-cyan-400 rounded-t-sm transition-all duration-500" style={{ height: `${count}%` }} />
                     <span className="text-xs font-mono font-bold mt-1 text-white">|{state}⟩</span>
                   </div>
                 ))}
               </div>
            </div>
          )}

        </div>

        {/* Action Bottom */}
        <div className="mt-5 pt-4 border-t border-white/10 space-y-2 flex-shrink-0">
          <button
            onClick={() => onOpenInLab?.(activeModule)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-['Space_Grotesk'] tracking-wider uppercase flex items-center justify-center gap-2 border border-purple-500/50 transition-all"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Open in Quantum Lab</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          
          <button
            onClick={() => alert("Qumi: Based on the current visualization, the quantum state determines the measurement probability. You can see this directly by the projection onto the Z-axis (vertical poles).")}
            className="w-full py-2.5 rounded-xl bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-cyan-500/30 transition-all"
          >
            <Bot className="w-4 h-4" />
            Ask Qumi to explain
          </button>
        </div>

      </aside>

    </div>
  );
}
