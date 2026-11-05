import React, { useEffect, useRef, useState } from 'react';
import { Machine, SensorTelemetry } from '../types';
import * as THREE from 'three';
import { 
  RotateCw, 
  Layers, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react';
import { getStatusTheme } from '../utils/formatters';

interface Machine3DInspectionProps {
  machine: Machine;
  telemetry: SensorTelemetry;
  selectedComponentKey: 'comp1' | 'comp2' | 'comp3' | 'comp4';
  onSelectComponent: (compKey: 'comp1' | 'comp2' | 'comp3' | 'comp4') => void;
  onToggleBlueprint?: () => void;
}

export const Machine3DInspection: React.FC<Machine3DInspectionProps> = ({
  machine,
  telemetry,
  selectedComponentKey,
  onSelectComponent,
  onToggleBlueprint
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [stressOverlay, setStressOverlay] = useState(false);

  const activeComp = machine.components[selectedComponentKey];
  const theme = getStatusTheme(machine.status);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAF9FD); // Near-white matching #FAF9FD
    sceneRef.current = scene;

    // 2. Camera setup - calibrated for compact view
    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2.2, 5.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting setup (Soft Studio Light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(4, 8, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xEDE9FE, 0.5);
    fillLight.position.set(-4, -2, -4);
    scene.add(fillLight);

    // 5. Floor shadow ring
    const floorGeo = new THREE.RingGeometry(0.1, 2.8, 32);
    const floorMat = new THREE.MeshBasicMaterial({ 
      color: 0x7C3AED, 
      transparent: true, 
      opacity: 0.05, 
      side: THREE.DoubleSide 
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.4;
    scene.add(floor);

    // 6. Sub-Assemblies Group
    const machineGroup = new THREE.Group();
    scene.add(machineGroup);

    // Component 1: Drive Bearings & Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.8, 32);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x8B5CF6,
      roughness: 0.25,
      metalness: 0.8
    });
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.castShadow = true;
    shaftMesh.name = 'comp1';
    machineGroup.add(shaftMesh);

    // Bearing Rings
    const bearingGeo = new THREE.TorusGeometry(0.48, 0.12, 16, 32);
    const bearingMat = new THREE.MeshStandardMaterial({
      color: 0x7C3AED,
      roughness: 0.3,
      metalness: 0.85
    });
    const bearingTop = new THREE.Mesh(bearingGeo, bearingMat);
    bearingTop.rotation.x = Math.PI / 2;
    bearingTop.position.y = 0.9;
    bearingTop.name = 'comp1';
    machineGroup.add(bearingTop);

    const bearingBottom = new THREE.Mesh(bearingGeo, bearingMat);
    bearingBottom.rotation.x = Math.PI / 2;
    bearingBottom.position.y = -0.9;
    bearingBottom.name = 'comp1';
    machineGroup.add(bearingBottom);

    // Component 2: Hydraulic Seal & Manifold
    const sealGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.5, 32);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0x3B82F6,
      roughness: 0.35,
      metalness: 0.65
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.y = 0.45;
    sealMesh.name = 'comp2';
    machineGroup.add(sealMesh);

    // Component 3: Motor Rotor & Stator
    const statorGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.9, 32);
    const statorMat = new THREE.MeshStandardMaterial({
      color: 0x6D28D9,
      roughness: 0.3,
      metalness: 0.75
    });
    const statorMesh = new THREE.Mesh(statorGeo, statorMat);
    statorMesh.position.y = -0.25;
    statorMesh.name = 'comp3';
    machineGroup.add(statorMesh);

    // Component 4: Cooling Radiator Assembly
    const radiatorGeo = new THREE.BoxGeometry(2.1, 0.35, 2.1);
    const radiatorMat = new THREE.MeshStandardMaterial({
      color: 0xEDE9FE,
      roughness: 0.45,
      metalness: 0.4
    });
    const radiatorMesh = new THREE.Mesh(radiatorGeo, radiatorMat);
    radiatorMesh.position.y = -1.2;
    radiatorMesh.name = 'comp4';
    machineGroup.add(radiatorMesh);

    meshesRef.current = {
      comp1: shaftMesh,
      comp2: sealMesh,
      comp3: statorMesh,
      comp4: radiatorMesh
    };

    // 7. Mouse Orbit & Raycasting Interaction
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMouseRef.current.x;
      const deltaY = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      machineGroup.rotation.y += deltaX * 0.01;
      machineGroup.rotation.x = Math.max(-0.5, Math.min(0.5, machineGroup.rotation.x + deltaY * 0.005));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(3.8, Math.min(8.5, camera.position.z + e.deltaY * 0.005));
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(machineGroup.children, true);

      if (intersects.length > 0) {
        const hitName = intersects[0].object.name;
        if (hitName && ['comp1', 'comp2', 'comp3', 'comp4'].includes(hitName)) {
          onSelectComponent(hitName as any);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('click', handleClick);

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (autoRotate && !isDraggingRef.current) {
        machineGroup.rotation.y += 0.006;
      }
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('click', handleClick);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update component highlight / thermal stress colors dynamically
  useEffect(() => {
    Object.entries(meshesRef.current).forEach(([key, mesh]) => {
      const comp = machine.components[key as 'comp1' | 'comp2' | 'comp3' | 'comp4'];
      const isSelected = selectedComponentKey === key;
      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (stressOverlay) {
        if (comp.wearPercent > 70) {
          mat.color.setHex(0xDC2626); // Critical red
          mat.emissive.setHex(0x7F1D1D);
          mat.emissiveIntensity = 0.4;
        } else if (comp.wearPercent > 40) {
          mat.color.setHex(0xD97706); // Warning amber
          mat.emissive.setHex(0x78350F);
          mat.emissiveIntensity = 0.3;
        } else {
          mat.color.setHex(0x059669); // Healthy green
          mat.emissive.setHex(0x064E3B);
          mat.emissiveIntensity = 0.2;
        }
      } else {
        if (isSelected) {
          mat.color.setHex(0x7C3AED); // Selected vibrant purple
          mat.emissive.setHex(0x5B21B6);
          mat.emissiveIntensity = 0.35;
        } else {
          if (key === 'comp1') mat.color.setHex(0x8B5CF6);
          if (key === 'comp2') mat.color.setHex(0x3B82F6);
          if (key === 'comp3') mat.color.setHex(0x6D28D9);
          if (key === 'comp4') mat.color.setHex(0xEDE9FE);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [selectedComponentKey, stressOverlay, machine]);

  return (
    <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-card flex flex-col gap-3">
      {/* Compact Top Header Controls */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[#F5F3FF]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-[#1E1B4B]">
            Interactive 3D Assembly
          </span>
          <span className="text-[10px] font-mono text-[#64748B] bg-[#F5F3FF] px-2 py-0.5 rounded-md border border-[#EDE9FE]">
            {machine.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Thermal stress toggle */}
          <button
            onClick={() => setStressOverlay(!stressOverlay)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              stressOverlay
                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                : 'bg-[#FAF9FD] border-[#EDE9FE] text-[#64748B] hover:text-[#1E1B4B]'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>{stressOverlay ? 'Thermal: On' : 'Thermal'}</span>
          </button>

          {/* Auto rotate toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              autoRotate 
                ? 'bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]' 
                : 'bg-[#FAF9FD] border-[#EDE9FE] text-[#64748B]'
            }`}
            title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {onToggleBlueprint && (
            <button
              onClick={onToggleBlueprint}
              className="px-2.5 py-1 rounded-lg bg-[#FAF9FD] hover:bg-[#F5F3FF] border border-[#EDE9FE] text-[#64748B] hover:text-[#7C3AED] text-[11px] font-semibold transition-all flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              <span>Blueprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact 3D Canvas (Height reduced to 210-230px) */}
      <div className="relative w-full h-[210px] sm:h-[225px] bg-[#FAF9FD] rounded-xl border border-[#EDE9FE] overflow-hidden">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Floating Instruction note */}
        <div className="absolute bottom-2 left-2.5 pointer-events-none text-[10px] text-[#94A3B8] font-mono bg-[#FFFFFF]/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#EDE9FE]">
          Drag to rotate · Click component hotspot
        </div>
      </div>

      {/* Clickable Component Hotspot Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['comp1', 'comp2', 'comp3', 'comp4'] as const).map(key => {
          const comp = machine.components[key];
          const isSelected = selectedComponentKey === key;
          const isDegraded = comp.condition === 'degraded';
          const isFair = comp.condition === 'fair';

          const shortNames: Record<string, string> = {
            comp1: 'Drive Shaft & Bearing',
            comp2: 'Hydraulic Seal',
            comp3: 'Motor Stator',
            comp4: 'Cooling Shroud'
          };

          return (
            <button
              key={key}
              onClick={() => onSelectComponent(key)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-[#F5F3FF] border-[#7C3AED] shadow-xs ring-1 ring-[#7C3AED]'
                  : 'bg-[#FFFFFF] border-[#EDE9FE] hover:border-[#BFDBFE] hover:bg-[#FAF9FD]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[#7C3AED]' : 'text-[#64748B]'}`}>
                  {key.toUpperCase()}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  isDegraded ? 'bg-[#DC2626]' : isFair ? 'bg-[#D97706]' : 'bg-[#059669]'
                }`} />
              </div>
              <span className="text-[11px] font-semibold text-[#1E1B4B] block truncate">
                {shortNames[key] || comp.name}
              </span>
              <div className="flex justify-between items-center text-[10px] text-[#64748B] mt-1">
                <span>Wear</span>
                <span className={`font-mono font-bold ${
                  comp.wearPercent > 70 ? 'text-[#DC2626]' : comp.wearPercent > 40 ? 'text-[#D97706]' : 'text-[#059669]'
                }`}>
                  {comp.wearPercent}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Simple Inspection Details Box */}
      <div className="p-3 rounded-xl bg-[#FAF9FD] border border-[#EDE9FE] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Info className="w-4 h-4 text-[#7C3AED] shrink-0" />
          <div className="truncate">
            <span className="font-semibold text-[#1E1B4B] mr-2">
              {activeComp.name}:
            </span>
            <span className="text-[#64748B] text-[11px]">
              {activeComp.condition === 'degraded'
                ? 'High bearing harmonic stress. Priority servicing advised within 48h.'
                : activeComp.condition === 'fair'
                ? 'Moderate seal tolerance wear. Monitor hydraulic pressure levels.'
                : 'Operating nominally within factory mechanical clearance tolerance.'}
            </span>
          </div>
        </div>

        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
          activeComp.condition === 'degraded' ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' :
          activeComp.condition === 'fair' ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' :
          'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
        }`}>
          {activeComp.wearPercent}% Wear · {activeComp.condition.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
