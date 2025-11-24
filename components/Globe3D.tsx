import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Coordinates } from '../types';
import { 
  MousePointer2, Globe, Move, 
  Maximize, Minimize, Plus, Minus,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface Globe3DProps {
  shipPos: Coordinates;
  setShipPos: (pos: Coordinates) => void;
  satLng: number;
  lang: Language;
}

const Globe3D: React.FC<Globe3DProps> = ({ shipPos, setShipPos, satLng, lang }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];
  
  // State for Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const shipMarkerRef = useRef<THREE.Mesh | null>(null);
  const satMarkerRef = useRef<THREE.Mesh | null>(null);
  const lineRef = useRef<THREE.Line | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Interaction State
  const isDragging = useRef(false);
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Constants
  const EARTH_RADIUS = 5;
  const SAT_DISTANCE = EARTH_RADIUS * 3;

  // Helper: Lat/Lon to Vector3
  const latLonToVector3 = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
  };

  // --- Core 3D Logic ---

  const rotateCamera = (deltaX: number, deltaY: number) => {
    if (!cameraRef.current) return;

    // Spherical orbit
    const offset = new THREE.Vector3().copy(cameraRef.current.position);
    const r = offset.length();
    let theta = Math.atan2(offset.x, offset.z);
    let phi = Math.acos(offset.y / r);

    const rotateSpeed = 0.005;
    theta -= deltaX * rotateSpeed;
    phi -= deltaY * rotateSpeed;

    // Clamp phi to avoid gimbal lock or flipping
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

    cameraRef.current.position.x = r * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = r * Math.cos(phi);
    cameraRef.current.position.z = r * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0,0,0);
  };

  const zoomCamera = (direction: 1 | -1) => {
    if (!cameraRef.current) return;
    const dirVec = new THREE.Vector3();
    cameraRef.current.getWorldDirection(dirVec);
    const dist = cameraRef.current.position.length();
    
    // Limits
    if (direction === 1 && dist > 7) { // Zoom In
        cameraRef.current.position.addScaledVector(dirVec, 2);
    } else if (direction === -1 && dist < 50) { // Zoom Out
        cameraRef.current.position.addScaledVector(dirVec, -2);
    }
  };

  // --- Resize Handler ---
  useEffect(() => {
    if (rendererRef.current && cameraRef.current && mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
    }
  }, [isFullscreen]); // Trigger on fullscreen toggle

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Init Scene ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); 

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Initial Position: East 8th District (120°E), Latitude 0
    // Using a distance of ~20 units to see the globe well
    const initialPos = latLonToVector3(0, 120, 20);
    camera.position.copy(initialPos);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    // --- Earth Mesh ---
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    
    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({ 
      map: earthTexture,
      specular: new THREE.Color(0x333333),
      shininess: 5
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthRef.current = earth;
    scene.add(earth);

    // --- Ship Marker ---
    const shipGeom = new THREE.ConeGeometry(0.15, 0.4, 16);
    shipGeom.rotateX(Math.PI / 2); // Point out
    const shipMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const shipMesh = new THREE.Mesh(shipGeom, shipMat);
    shipMarkerRef.current = shipMesh;
    scene.add(shipMesh);

    // --- Satellite Marker ---
    const satGeom = new THREE.SphereGeometry(0.2, 16, 16);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const satMesh = new THREE.Mesh(satGeom, satMat);
    satMarkerRef.current = satMesh;
    scene.add(satMesh);

    // --- Line of Sight ---
    const lineMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.6 });
    const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)]);
    const line = new THREE.Line(lineGeom, lineMat);
    lineRef.current = line;
    scene.add(line);

    // --- Equator Helper ---
    const equatorPoints = [];
    for (let i = 0; i <= 360; i++) {
        equatorPoints.push(latLonToVector3(0, i - 180, EARTH_RADIUS + 0.05));
    }
    const equatorGeom = new THREE.BufferGeometry().setFromPoints(equatorPoints);
    const equatorLine = new THREE.Line(equatorGeom, new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.3 }));
    scene.add(equatorLine);

    // --- Animation Loop ---
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // --- Interaction Logic ---
    
    const handleGlobeClick = (clientX: number, clientY: number) => {
        if (!earthRef.current || !cameraRef.current || !mountRef.current) return;

        const rect = mountRef.current.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObject(earthRef.current);

        if (intersects.length > 0) {
            const uv = intersects[0].uv;
            if (uv) {
                const lat = (uv.y - 0.5) * 180;
                const lng = (uv.x * 360) - 180;
                setShipPos({ lat, lng });
            }
        }
    };

    // -- Mouse Handlers --
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      mouseDownPos.current = { x: e.clientX, y: e.clientY };
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging.current) {
            const deltaX = e.clientX - previousMousePosition.current.x;
            const deltaY = e.clientY - previousMousePosition.current.y;
            rotateCamera(deltaX, deltaY);
            previousMousePosition.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging.current) {
          const dx = e.clientX - mouseDownPos.current.x;
          const dy = e.clientY - mouseDownPos.current.y;
          if (Math.hypot(dx, dy) < 5) {
              handleGlobeClick(e.clientX, e.clientY);
          }
      }
      isDragging.current = false;
    };
    
    // -- Touch Handlers (for iPhone/Edge Mobile) --
    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
            isDragging.current = true;
            mouseDownPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            // We do NOT prevent default here to allow clicking, but if moving we might
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (isDragging.current && e.touches.length === 1) {
            // Prevent scrolling page when rotating globe
            e.preventDefault(); 
            const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
            const deltaY = e.touches[0].clientY - previousMousePosition.current.y;
            rotateCamera(deltaX, deltaY);
            previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
         if (isDragging.current && e.changedTouches.length > 0) {
            const dx = e.changedTouches[0].clientX - mouseDownPos.current.x;
            const dy = e.changedTouches[0].clientY - mouseDownPos.current.y;
             if (Math.hypot(dx, dy) < 5) {
                handleGlobeClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
             }
         }
         isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
        if (cameraRef.current) {
             e.preventDefault();
             // Determine direction
             const direction = e.deltaY < 0 ? 1 : -1;
             // Wheel delta can be variable, but let's just step
             // Or use the delta scaled
             const dirVec = new THREE.Vector3();
             cameraRef.current.getWorldDirection(dirVec);
             const dist = cameraRef.current.position.length();
             
             if (direction === 1 && dist > 7) {
                 cameraRef.current.position.addScaledVector(dirVec, 1);
             } else if (direction === -1 && dist < 50) {
                 cameraRef.current.position.addScaledVector(dirVec, -1);
             }
        }
    };

    // Attach Listeners
    const domEl = renderer.domElement;
    
    domEl.addEventListener('mousedown', handleMouseDown);
    domEl.addEventListener('wheel', handleWheel);
    domEl.addEventListener('touchstart', handleTouchStart, { passive: false });
    domEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    domEl.addEventListener('touchend', handleTouchEnd);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (mountRef.current && renderer.domElement) {
         mountRef.current.removeChild(renderer.domElement);
      }
      
      domEl.removeEventListener('mousedown', handleMouseDown);
      domEl.removeEventListener('wheel', handleWheel);
      domEl.removeEventListener('touchstart', handleTouchStart);
      domEl.removeEventListener('touchmove', handleTouchMove);
      domEl.removeEventListener('touchend', handleTouchEnd);
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      earthGeometry.dispose();
      earthMaterial.dispose();
      renderer.dispose();
    };
  }, []); // Run once on mount

  // --- Update Markers ---
  useEffect(() => {
    if (shipMarkerRef.current) {
        const pos = latLonToVector3(shipPos.lat, shipPos.lng, EARTH_RADIUS);
        shipMarkerRef.current.position.copy(pos);
        shipMarkerRef.current.lookAt(0,0,0);
    }
    
    if (satMarkerRef.current) {
        const pos = latLonToVector3(0, satLng, SAT_DISTANCE);
        satMarkerRef.current.position.copy(pos);
    }
    
    if (lineRef.current && shipMarkerRef.current && satMarkerRef.current) {
        const positions = new Float32Array([
            shipMarkerRef.current.position.x, shipMarkerRef.current.position.y, shipMarkerRef.current.position.z,
            satMarkerRef.current.position.x, satMarkerRef.current.position.y, satMarkerRef.current.position.z
        ]);
        lineRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        lineRef.current.geometry.computeBoundingSphere();
    }

  }, [shipPos, satLng]);

  return (
    <div 
      className={`bg-slate-800 border border-slate-700 shadow-xl relative transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : 'w-full rounded-lg overflow-hidden h-[400px]'
      }`}
    >
       <div ref={mountRef} className="w-full h-full cursor-move" />
       
       {/* Top Info Overlay (Hidden in fullscreen to declutter, or keep it?) Let's keep minimal info */}
       <div className={`absolute top-2 left-2 pointer-events-none z-10 flex flex-col gap-1 ${isFullscreen ? 'scale-110 origin-top-left' : ''}`}>
         {!isFullscreen && (
           <>
            <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-blue-400 flex items-center gap-2">
                <MousePointer2 size={12} /> {t.clickPlace}
            </div>
            <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-400 flex items-center gap-2">
                <Globe size={12} /> {t.dragRotate}
            </div>
            <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-500 flex items-center gap-2">
                <Move size={12} /> {t.scrollZoom}
            </div>
           </>
         )}
         {isFullscreen && (
            <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-white font-bold flex items-center gap-2 border border-slate-700">
               <Globe size={14} /> {t.orbitView}
            </div>
         )}
       </div>

       {/* Lat/Lng Display */}
       <div className={`absolute pointer-events-none z-10 transition-all ${isFullscreen ? 'top-2 right-14' : 'bottom-2 right-2'}`}>
         <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-300 font-mono border border-slate-700">
            {t.lat}: {shipPos.lat.toFixed(1)}, {t.lng}: {shipPos.lng.toFixed(1)}
         </div>
       </div>

       {/* --- ON-SCREEN CONTROLS --- */}

       {/* 1. Fullscreen Toggle */}
       <button 
         onClick={() => setIsFullscreen(!isFullscreen)}
         className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded shadow-lg border border-slate-600 z-20"
         title={isFullscreen ? t.exitFullscreen : t.fullscreen}
       >
         {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
       </button>

       {/* 2. Zoom Controls */}
       <div className="absolute bottom-6 right-2 flex flex-col gap-2 z-20">
          <button 
             onClick={() => zoomCamera(1)}
             className="p-3 bg-slate-700/90 hover:bg-blue-600 text-white rounded-full shadow-lg border border-slate-600 active:scale-95 transition-transform"
             title={t.zoomIn}
          >
             <Plus size={24} />
          </button>
          <button 
             onClick={() => zoomCamera(-1)}
             className="p-3 bg-slate-700/90 hover:bg-blue-600 text-white rounded-full shadow-lg border border-slate-600 active:scale-95 transition-transform"
             title={t.zoomOut}
          >
             <Minus size={24} />
          </button>
       </div>

       {/* 3. D-Pad Rotation Controls (Bottom Left) */}
       <div className="absolute bottom-6 left-2 z-20">
          <div className="grid grid-cols-3 gap-1">
             <div className="col-start-2">
                <button 
                   onMouseDown={() => rotateCamera(0, -10)}
                   onTouchStart={(e) => { e.preventDefault(); rotateCamera(0, -10); }}
                   className="p-2 bg-slate-700/80 hover:bg-blue-600 text-white rounded shadow border border-slate-600 active:bg-blue-700"
                >
                  <ChevronUp size={20} />
                </button>
             </div>
             <div className="col-start-1 row-start-2">
                <button 
                   onMouseDown={() => rotateCamera(-10, 0)}
                   onTouchStart={(e) => { e.preventDefault(); rotateCamera(-10, 0); }}
                   className="p-2 bg-slate-700/80 hover:bg-blue-600 text-white rounded shadow border border-slate-600 active:bg-blue-700"
                >
                  <ChevronLeft size={20} />
                </button>
             </div>
             <div className="col-start-3 row-start-2">
                <button 
                   onMouseDown={() => rotateCamera(10, 0)}
                   onTouchStart={(e) => { e.preventDefault(); rotateCamera(10, 0); }}
                   className="p-2 bg-slate-700/80 hover:bg-blue-600 text-white rounded shadow border border-slate-600 active:bg-blue-700"
                >
                  <ChevronRight size={20} />
                </button>
             </div>
             <div className="col-start-2 row-start-3">
                <button 
                   onMouseDown={() => rotateCamera(0, 10)}
                   onTouchStart={(e) => { e.preventDefault(); rotateCamera(0, 10); }}
                   className="p-2 bg-slate-700/80 hover:bg-blue-600 text-white rounded shadow border border-slate-600 active:bg-blue-700"
                >
                  <ChevronDown size={20} />
                </button>
             </div>
          </div>
       </div>

    </div>
  );
};

export default Globe3D;