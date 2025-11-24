import React from 'react';
import { LookAngle, BlockageZone, SignalStatus } from '../types';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface ShipRadarProps {
  lookAngle: LookAngle;
  blockageZones: BlockageZone[];
  shipHeading: number;
  status: SignalStatus;
  lang: Language;
}

const ShipRadar: React.FC<ShipRadarProps> = ({ lookAngle, blockageZones, shipHeading, status, lang }) => {
  const t = translations[lang];
  const size = 300;
  const center = size / 2;
  const radius = size * 0.4;
  
  // Convert polar to cartesian
  const getXY = (deg: number, r: number) => {
    const rad = (deg - 90) * (Math.PI / 180); // Adjust so 0 is up
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad)
    };
  };

  // Draw Blockage Arcs
  const drawBlockage = (zone: BlockageZone, index: number) => {
    const start = zone.startRelAz;
    const end = zone.endRelAz;
    
    // Draw pie slice for blockage
    const p1 = getXY(start, radius);
    const p2 = getXY(end, radius);
    
    // SVG Arc Path: M center L p1 A radius radius 0 0 1 p2 Z
    // Large arc flag depends on angle size
    const largeArc = (end - start) > 180 ? 1 : 0;
    
    let d = "";
    if (start > end) {
       // Wrap case
       const pStart = getXY(start, radius);
       const pEnd = getXY(end, radius);
       d = `M ${center} ${center} L ${pStart.x} ${pStart.y} A ${radius} ${radius} 0 0 1 ${pEnd.x} ${pEnd.y} Z`; 
    } else {
       const pStart = getXY(start, radius);
       const pEnd = getXY(end, radius);
       const isLarge = (end - start) > 180 ? 1 : 0;
       d = `M ${center} ${center} L ${pStart.x} ${pStart.y} A ${radius} ${radius} 0 ${isLarge} 1 ${pEnd.x} ${pEnd.y} Z`;
    }
    
    return (
      <path 
        key={index}
        d={d}
        fill="#94a3b8" 
        fillOpacity="0.3"
        stroke="#475569"
        strokeDasharray="2,2"
      />
    );
  };

  // Satellite Position on Radar (Relative Azimuth)
  // Distance from center represents Elevation (0 at edge, 90 at center)
  const satR = radius * (1 - (lookAngle.elevation / 90));
  const satPos = getXY(lookAngle.relativeAzimuth, satR);

  // Status Color
  const getStatusColor = () => {
    switch (status) {
      case SignalStatus.OPTIMAL: return '#22c55e'; // Green
      case SignalStatus.MARGINAL: return '#f59e0b'; // Amber
      case SignalStatus.BLOCKED: return '#ef4444'; // Red
      case SignalStatus.NO_LOS: return '#64748b'; // Slate
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg border border-slate-700 shadow-xl">
      <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        {t.radarTitle}
      </h3>
      
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Circle (Horizon) */}
          <circle cx={center} cy={center} r={radius} fill="#1e293b" stroke="#334155" strokeWidth="2" />
          
          {/* Elevation Rings (30, 60 deg) */}
          <circle cx={center} cy={center} r={radius * 0.66} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
          <circle cx={center} cy={center} r={radius * 0.33} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
          
          {/* Axis Lines */}
          <line x1={center} y1={center-radius} x2={center} y2={center+radius} stroke="#334155" />
          <line x1={center-radius} y1={center} x2={center+radius} y2={center} stroke="#334155" />

          {/* Blockage Zones */}
          {blockageZones.map(drawBlockage)}

          {/* Ship Graphic (Triangle pointing Up) */}
          <path 
            d={`M ${center} ${center - 15} L ${center + 10} ${center + 15} L ${center} ${center + 10} L ${center - 10} ${center + 15} Z`} 
            fill="#3b82f6" 
          />
          <text x={center} y={center + 35} textAnchor="middle" fill="#94a3b8" fontSize="10">{t.bow}</text>

          {/* Satellite Marker */}
          {lookAngle.elevation > 0 && (
            <>
              <line x1={center} y1={center} x2={satPos.x} y2={satPos.y} stroke={getStatusColor()} strokeWidth="2" strokeOpacity="0.5" />
              <circle cx={satPos.x} cy={satPos.y} r="8" fill={getStatusColor()} stroke="white" strokeWidth="2" />
              <text x={satPos.x + 10} y={satPos.y} fill="white" fontSize="12" fontWeight="bold">SAT</text>
            </>
          )}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute top-0 right-0 text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
          <div>{t.radiusElev}</div>
          <div>{t.angleRel}</div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`mt-6 px-4 py-2 rounded-full flex items-center gap-3 border ${
        status === SignalStatus.OPTIMAL ? 'bg-green-500/10 border-green-500 text-green-400' :
        status === SignalStatus.BLOCKED ? 'bg-red-500/10 border-red-500 text-red-400' :
        status === SignalStatus.NO_LOS ? 'bg-slate-700 border-slate-600 text-slate-400' :
        'bg-amber-500/10 border-amber-500 text-amber-400'
      }`}>
        {status === SignalStatus.OPTIMAL && <Wifi className="w-5 h-5" />}
        {status === SignalStatus.BLOCKED && <WifiOff className="w-5 h-5" />}
        {status === SignalStatus.MARGINAL && <AlertTriangle className="w-5 h-5" />}
        {status === SignalStatus.NO_LOS && <WifiOff className="w-5 h-5" />}
        
        <span className="font-bold uppercase tracking-wide">
          {t.signal}: {status}
        </span>
      </div>
      
       {status === SignalStatus.BLOCKED && (
          <p className="mt-2 text-red-400 text-sm text-center">
            {t.blockedMsg}
          </p>
        )}
        
        {status === SignalStatus.NO_LOS && lookAngle.elevation < 5 && (
           <p className="mt-2 text-slate-400 text-sm text-center font-medium border-t border-slate-700 pt-2">
             <AlertTriangle size={14} className="inline mr-1 text-amber-500" />
             {t.lowElevationMsg}
           </p>
        )}
    </div>
  );
};

export default ShipRadar;