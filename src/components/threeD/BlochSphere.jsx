import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function BlochSphere({ theta = 0, phi = 0, radius = 1, qubitId = 0 }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const vectorRef = useRef(null);
  
  // Ref for smooth animation
  const animState = useRef({ theta: 0, phi: 0, radius: 1 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.5, 1.5, 3.5);
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

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Bloch Sphere geometry
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.1,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    // Equator and Meridians
    const lineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.2 });
    const circleGeo = new THREE.BufferGeometry().setFromPoints(
      new THREE.Path().absarc(0, 0, 1, 0, Math.PI * 2, false).getPoints(64)
    );
    const equator = new THREE.Line(circleGeo, lineMat);
    equator.rotation.x = Math.PI / 2;
    scene.add(equator);

    // Axes
    const axesGroup = new THREE.Group();
    const createAxis = (color, euler) => {
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
      const pts = [new THREE.Vector3(0, -1.2, 0), new THREE.Vector3(0, 1.2, 0)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, mat);
      if (euler) line.rotation.copy(euler);
      return line;
    };
    axesGroup.add(createAxis(0x3b82f6)); // Y (Z in Quantum: |0> / |1>)
    axesGroup.add(createAxis(0xf43f5e, new THREE.Euler(0, 0, Math.PI/2))); // X
    axesGroup.add(createAxis(0x10b981, new THREE.Euler(Math.PI/2, 0, 0))); // Z (Y in Quantum)
    scene.add(axesGroup);

    // Labels for |0> and |1> using Sprites
    const createLabel = (text, position) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, 64, 48);
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(position);
      sprite.scale.set(0.4, 0.2, 1);
      return sprite;
    };
    scene.add(createLabel('|0⟩', new THREE.Vector3(0, 1.3, 0)));
    scene.add(createLabel('|1⟩', new THREE.Vector3(0, -1.3, 0)));

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
    vectorRef.current = arrowHelper;

    // Mouse Orbit Controls
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let spherical = { radius: 3.8, theta: Math.PI / 4, phi: Math.PI / 3 };

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
    const onWheel = (e) => {
      spherical.radius = Math.max(2, Math.min(8, spherical.radius + e.deltaY * 0.005));
      updateCameraPos();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    domEl.addEventListener('wheel', onWheel);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      
      // Smooth interpolation for vector
      animState.current.theta += (propsRef.current.theta - animState.current.theta) * 0.1;
      
      // Shortest path for phi
      let dPhi = propsRef.current.phi - animState.current.phi;
      if (dPhi > Math.PI) dPhi -= 2 * Math.PI;
      if (dPhi < -Math.PI) dPhi += 2 * Math.PI;
      animState.current.phi += dPhi * 0.1;

      animState.current.radius += (propsRef.current.radius - animState.current.radius) * 0.1;

      if (vectorRef.current) {
        const r = animState.current.radius;
        const x = r * Math.sin(animState.current.theta) * Math.cos(animState.current.phi);
        const z = r * Math.sin(animState.current.theta) * Math.sin(animState.current.phi);
        const y = r * Math.cos(animState.current.theta);

        const targetPos = new THREE.Vector3(x, y, z);
        
        if (targetPos.lengthSq() > 0.0001) {
          vectorRef.current.position.set(0, 0, 0);
          vectorRef.current.setDirection(targetPos.clone().normalize());
          vectorRef.current.setLength(targetPos.length(), 0.2, 0.08);
          vectorRef.current.visible = true;
        } else {
          vectorRef.current.visible = false;
        }
      }

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
      domEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
    };
  }, [qubitId]); // Re-init on qubit id change if needed

  // Sync incoming props to ref so animation loop can read them without stale closures
  const propsRef = useRef({ theta, phi, radius });
  useEffect(() => {
    propsRef.current = { theta, phi, radius };
  }, [theta, phi, radius]);

  return (
    <div className="w-full h-full relative group bg-gradient-to-b from-[#060918] to-[#040612] border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute top-4 left-4 pointer-events-none">
        <span className="px-2 py-1 bg-cyan-900/50 border border-cyan-500/30 rounded text-[10px] text-cyan-300 font-mono tracking-widest">
          BLOCH SPHERE [Q{qubitId}]
        </span>
      </div>
      <div className="absolute bottom-4 left-4 text-[10px] font-mono text-gray-500 opacity-50 group-hover:opacity-100 transition-opacity">
        Drag to orbit • Scroll to zoom
      </div>
    </div>
  );
}
