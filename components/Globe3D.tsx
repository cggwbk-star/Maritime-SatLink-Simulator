import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Coordinates } from '../types';
import { MousePointer2, Globe, Move } from 'lucide-react';
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

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Init Scene ---
    const width = mountRef.current.clientWidth;
    const height = width; // Square aspect
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); 

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 18;
    camera.position.y = 5;
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
    // Using standard UV mapping of SphereGeometry
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
    
    // 1. Calculate Lat/Lon from Click using UVs (More robust than vector math)
    const handleGlobeClick = (e: MouseEvent) => {
        if (!earthRef.current || !cameraRef.current || !mountRef.current) return;

        const rect = mountRef.current.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        // Ensure we only check the earth and get the closest intersection
        const intersects = raycaster.intersectObject(earthRef.current);

        if (intersects.length > 0) {
            // Use UV coordinates for precise texture mapping
            // This avoids issues with vector math quadrants or back-face calculations
            const uv = intersects[0].uv;
            if (uv) {
                // UV.y goes from 0 (South) to 1 (North)
                const lat = (uv.y - 0.5) * 180;
                // UV.x goes from 0 to 1. Standard map assumes 0 at -180, 0.5 at 0, 1 at 180
                const lng = (uv.x * 360) - 180;
                setShipPos({ lat, lng });
            }
        }
    };

    // 2. Event Handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      mouseDownPos.current = { x: e.clientX, y: e.clientY };
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
        // Orbit Logic
        if (isDragging.current && cameraRef.current) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.current.x,
                y: e.clientY - previousMousePosition.current.y
            };
            
            // Spherical orbit
            const offset = new THREE.Vector3().copy(cameraRef.current.position);
            const r = offset.length();
            let theta = Math.atan2(offset.x, offset.z);
            let phi = Math.acos(offset.y / r);

            const rotateSpeed = 0.005;
            theta -= deltaMove.x * rotateSpeed;
            phi -= deltaMove.y * rotateSpeed;

            // Clamp phi to avoid gimbal lock or flipping
            phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

            cameraRef.current.position.x = r * Math.sin(phi) * Math.sin(theta);
            cameraRef.current.position.y = r * Math.cos(phi);
            cameraRef.current.position.z = r * Math.sin(phi) * Math.cos(theta);
            cameraRef.current.lookAt(0,0,0);

            previousMousePosition.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Check for click (drag distance < 5 pixels)
      if (isDragging.current) {
          const dx = e.clientX - mouseDownPos.current.x;
          const dy = e.clientY - mouseDownPos.current.y;
          // Only trigger click if movement was minimal
          if (Math.hypot(dx, dy) < 5) {
              handleGlobeClick(e);
          }
      }
      isDragging.current = false;
    };
    
    const handleWheel = (e: WheelEvent) => {
        if (cameraRef.current) {
             e.preventDefault();
             const direction = new THREE.Vector3();
             cameraRef.current.getWorldDirection(direction);
             const dist = cameraRef.current.position.length();
             
             if (e.deltaY < 0 && dist > 7) {
                 cameraRef.current.position.addScaledVector(direction, 1);
             } else if (e.deltaY > 0 && dist < 50) {
                 cameraRef.current.position.addScaledVector(direction, -1);
             }
        }
    };

    // Attach Listeners
    const domEl = renderer.domElement;
    
    // Mousedown on canvas to start interaction
    domEl.addEventListener('mousedown', handleMouseDown);
    // Wheel on canvas
    domEl.addEventListener('wheel', handleWheel);
    
    // Mousemove/up on Window to handle dragging outside canvas bounds
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (mountRef.current && renderer.domElement) {
         mountRef.current.removeChild(renderer.domElement);
      }
      
      domEl.removeEventListener('mousedown', handleMouseDown);
      domEl.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      earthGeometry.dispose();
      earthMaterial.dispose();
      renderer.dispose();
    };
  }, []); // Run once on mount

  // --- Update Markers on Props Change ---
  useEffect(() => {
    if (shipMarkerRef.current) {
        const pos = latLonToVector3(shipPos.lat, shipPos.lng, EARTH_RADIUS);
        shipMarkerRef.current.position.copy(pos);
        shipMarkerRef.current.lookAt(0,0,0); // Orient to normal
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
    <div className="w-full bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-xl relative h-[400px]">
       <div ref={mountRef} className="w-full h-full cursor-move" />
       
       <div className="absolute top-2 left-2 pointer-events-none z-10 flex flex-col gap-1">
         <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-blue-400 flex items-center gap-2">
            <MousePointer2 size={12} /> {t.clickPlace}
         </div>
         <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-400 flex items-center gap-2">
            <Globe size={12} /> {t.dragRotate}
         </div>
          <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-500 flex items-center gap-2">
            <Move size={12} /> {t.scrollZoom}
         </div>
       </div>
       
       <div className="absolute bottom-2 right-2 pointer-events-none z-10">
         <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-300 font-mono">
            {t.lat}: {shipPos.lat.toFixed(1)}, {t.lng}: {shipPos.lng.toFixed(1)}
         </div>
       </div>
    </div>
  );
};

export default Globe3D;