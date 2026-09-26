import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Maximize2,
  Compass,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
  Atom,
  FlaskConical,
  Activity,
  Box
} from 'lucide-react';

export default function Learning3D({ onNavigateBack, onOpenInLab }) {
  const mountRef = useRef(null);

  // Active Educational Module
  const [activeModule, setActiveModule] = useState('bloch'); 
  // 'bloch' | 'qubit' | 'superposition' | 'entanglement' | 'gates'

  // Qubit State (Theta, Phi)
  const [theta, setTheta] = useState(0); // 0 to PI
  const [phi, setPhi] = useState(0); // 0 to 2PI

  // References to Three.js objects
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const stateVectorRef = useRef(null);
  
  // Animation state for superposition transitions
  const isAnimatingRef = useRef(false);

  // Math helper
  const updateVectorFromAngles = (t, p) => {
    if (!stateVectorRef.current) return;
    const r = 1.0;
    // Spherical to Cartesian (Three.js Y is up)
    // Z is forward/back, X is left/right
    // standard physics coords: z is up
    // We map physics Z -> three Y, physics X -> three X, physics Y -> three Z
    const x = r * Math.sin(t) * Math.cos(p);
    const z = r * Math.sin(t) * Math.sin(p);
    const y = r * Math.cos(t);

    const targetPos = new THREE.Vector3(x, y, z);
    
    // Point arrow from origin to targetPos
    stateVectorRef.current.position.set(0, 0, 0);
    stateVectorRef.current.setDirection(targetPos.normalize());
    stateVectorRef.current.setLength(1.0, 0.2, 0.08);
  };

  // Initialize Three.js Scene
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

    // Grid
    const gridHelper = new THREE.GridHelper(4, 20, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -1.1;
    scene.add(gridHelper);

    // BLOCH SPHERE SETUP
    // The transparent sphere shell
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
    
    // Y is up/down (|0> and |1>) - blue
    axesGroup.add(createAxis(0x3b82f6));
    // X is left/right (|+> and |->) - red
    axesGroup.add(createAxis(0xf43f5e, new THREE.Euler(0, 0, Math.PI/2)));
    // Z is front/back (|i> and |-i>) - green
    axesGroup.add(createAxis(0x10b981, new THREE.Euler(Math.PI/2, 0, 0)));
    scene.add(axesGroup);

    // State Vector Arrow (pink/purple)
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

    updateVectorFromAngles(theta, phi);

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

    const onMouseDown = (e) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouse.x;
      const deltaY = e.clientY - previousMouse.y;
      previousMouse = { x: e.clientX, y: e.clientY };

      spherical.theta -= deltaX * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * 0.008));
      updateCameraPos();
    };

    const onMouseUp = () => { isDragging = false; };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
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

  // Update vector when angles change
  useEffect(() => {
    updateVectorFromAngles(theta, phi);
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
    // Exact H gate simulation on angles is complex, simplified for visual:
    // If |0>, goes to |+>
    // If |1>, goes to |->
    if (Math.abs(theta) < 0.1) { setTheta(Math.PI/2); setPhi(0); }
    else if (Math.abs(theta - Math.PI) < 0.1) { setTheta(Math.PI/2); setPhi(Math.PI); }
    else if (Math.abs(theta - Math.PI/2) < 0.1 && Math.abs(phi) < 0.1) { setTheta(0); setPhi(0); }
    else if (Math.abs(theta - Math.PI/2) < 0.1 && Math.abs(phi - Math.PI) < 0.1) { setTheta(Math.PI); setPhi(0); }
    else {
      // General H visual approximation
      const newTheta = Math.PI/2 - theta + Math.PI/4;
      setTheta(Math.max(0, Math.min(Math.PI, newTheta)));
    }
  };
  
  const applyMeasure = () => {
    const prob1 = Math.sin(theta / 2) ** 2;
    if (Math.random() < prob1) {
      setTheta(Math.PI); // collapse to |1>
      setPhi(0);
    } else {
      setTheta(0); // collapse to |0>
      setPhi(0);
    }
  };

  const prob0 = Math.cos(theta/2)**2;
  const prob1 = Math.sin(theta/2)**2;

  const modules = [
    { id: 'bloch', label: 'Bloch Sphere', icon: Compass },
    { id: 'qubit', label: 'Qubit State', icon: Activity },
    { id: 'superposition', label: 'Superposition', icon: Layers },
    { id: 'entanglement', label: 'Entanglement', icon: Sparkles },
    { id: 'gates', label: 'Gate Lab', icon: Box }
  ];

  const renderModuleDescription = () => {
    switch(activeModule) {
      case 'bloch':
        return "The Bloch Sphere is a geometric representation of a single qubit's state space. The poles represent classical states |0⟩ and |1⟩, while the surface represents all possible quantum superpositions.";
      case 'qubit':
        return "A Qubit exists in a linear combination of states. Watch how changing the state vector angle (θ) directly alters the probability distribution of measuring a 0 versus a 1.";
      case 'superposition':
        return "Superposition allows a qubit to be in multiple states simultaneously. Applying a Hadamard (H) gate to |0⟩ creates a perfect 50/50 superposition, placing the state vector on the equator.";
      case 'entanglement':
        return "Entanglement correlates qubits so their states are permanently linked. (Note: The Bloch sphere only models a single qubit; true entanglement requires multiple qubits and is best viewed in Quantum Lab).";
      case 'gates':
        return "Quantum gates act as rotations around the X, Y, and Z axes of the Bloch Sphere. Experiment with Pauli and Hadamard gates to see their geometric effects.";
      default: return "";
    }
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] bg-[#040612] text-gray-100 flex flex-col lg:flex-row overflow-hidden select-none">
      
      {/* 3D Viewport */}
      <div className="flex-1 relative h-[50vh] lg:h-full bg-[#060918] overflow-hidden">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 p-1.5 rounded-xl bg-[#090d24]/90 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-cyan-300">
            <Atom className="w-4 h-4 text-cyan-400" />
            <span>Interactive Quantum Visualization Lab</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10 hidden sm:block text-[10px] font-mono text-gray-500 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
          Left Drag: Rotate Camera
        </div>
      </div>

      {/* Side Panel */}
      <aside className="w-full lg:w-96 h-[50vh] lg:h-full bg-[#070b1f] border-t lg:border-t-0 lg:border-l border-white/10 p-5 flex flex-col overflow-y-auto">
        
        {/* Module Selector */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Module</h3>
          <div className="grid grid-cols-2 gap-2">
            {modules.map(mod => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                    activeModule === mod.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mod.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Description & State */}
        <div className="flex-1 space-y-6">
          
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm leading-relaxed text-gray-300 font-sans">
            <Info className="w-4 h-4 text-cyan-400 inline mb-1 mr-1.5" />
            {renderModuleDescription()}
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
            <h4 className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-2">Qubit State Analysis</h4>
            
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gray-400">Probability |0⟩</span>
              <span className="text-emerald-400 font-bold">{(prob0 * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${prob0 * 100}%` }} />
            </div>

            <div className="flex justify-between items-center text-xs font-mono mt-3">
              <span className="text-gray-400">Probability |1⟩</span>
              <span className="text-rose-400 font-bold">{(prob1 * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-rose-400 transition-all duration-300" style={{ width: `${prob1 * 100}%` }} />
            </div>
          </div>

          {/* Interactive Controls */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Apply Operations</h4>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={applyX} className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold font-mono transition-colors">X Gate</button>
              <button onClick={applyY} className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono transition-colors">Y Gate</button>
              <button onClick={applyZ} className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono transition-colors">Z Gate</button>
              <button onClick={applyH} className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold font-mono transition-colors">H Gate</button>
              <button onClick={applyMeasure} className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono transition-colors">Measure</button>
              <button onClick={applyReset} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 border border-white/20 text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => onOpenInLab?.(activeModule)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold font-['Space_Grotesk'] tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-95"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Open in Quantum Lab</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

      </aside>

    </div>
  );
}
