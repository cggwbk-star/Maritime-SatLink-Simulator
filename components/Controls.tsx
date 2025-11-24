import React from 'react';
import { Coordinates } from '../types';
import { Navigation, Satellite, RotateCw, MapPin, List } from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface ControlsProps {
  shipPos: Coordinates;
  setShipPos: (c: Coordinates) => void;
  shipHeading: number;
  setShipHeading: (h: number) => void;
  satLng: number;
  setSatLng: (l: number) => void;
  lang: Language;
}

const COMMON_SATELLITES = [
  { name: "Horizons 4 (127°W)", lng: -127.0 },
  { name: "Intelsat 21 (58°W)", lng: -58.0 },
  { name: "Intelsat 32e (43°W)", lng: -43.0 },
  { name: "Intelsat 35e (34.5°W)", lng: -34.5 },
  { name: "Intelsat 37e (18°W)", lng: -18.0 },
  { name: "Intelsat 33e (60°E)", lng: 60.0 },
  { name: "Intelsat 20 (68.5°E)", lng: 68.5 },
  { name: "Intelsat 22 (72°E)", lng: 72.0 },
  { name: "APSTAR 6D (134°E)", lng: 134.0 },
  { name: "Horizons 3e (169°E)", lng: 169.0 },
  { name: "Intelsat 18 (180°E)", lng: 180.0 },
];

const Controls: React.FC<ControlsProps> = ({
  shipPos, setShipPos,
  shipHeading, setShipHeading,
  satLng, setSatLng,
  lang
}) => {
  const t = translations[lang];

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShipPos({ ...shipPos, lat: parseFloat(e.target.value) });
  };
  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShipPos({ ...shipPos, lng: parseFloat(e.target.value) });
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl space-y-6">
      
      <h2 className="text-xl font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-700">
        <Navigation className="text-blue-500" /> {t.controls}
      </h2>

      {/* Ship Heading Control */}
      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm font-medium text-slate-300">
          <span className="flex items-center gap-2"><RotateCw size={16} /> {t.shipHeading}</span>
          <span className="text-blue-400 font-mono">{shipHeading}°</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="359" 
          value={shipHeading}
          onChange={(e) => setShipHeading(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>N (0°)</span>
          <span>E (90°)</span>
          <span>S (180°)</span>
          <span>W (270°)</span>
        </div>
      </div>

      {/* Satellite Position */}
      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm font-medium text-slate-300">
          <span className="flex items-center gap-2"><Satellite size={16} /> {t.satLon}</span>
          <span className="text-red-400 font-mono">{satLng}°</span>
        </label>

        {/* Quick Select Dropdown */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <List size={14} className="text-slate-500" />
          </div>
          <select 
             className="w-full bg-slate-900 border border-slate-600 rounded pl-8 pr-2 py-1.5 text-xs text-slate-300 focus:border-red-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
             value={COMMON_SATELLITES.find(s => Math.abs(s.lng - satLng) < 0.1)?.lng ?? "custom"}
             onChange={(e) => {
               if (e.target.value !== "custom") {
                 setSatLng(parseFloat(e.target.value));
               }
             }}
           >
             <option value="custom">{t.customSat}</option>
             {COMMON_SATELLITES.map(sat => (
               <option key={sat.name} value={sat.lng}>{sat.name}</option>
             ))}
           </select>
        </div>

        <input 
          type="range" 
          min="-180" 
          max="180" 
          value={satLng}
          onChange={(e) => setSatLng(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
        <div className="text-xs text-slate-500 text-center">
           {t.commonGeo}
        </div>
      </div>

      {/* Manual Coordinates */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <MapPin size={16} /> {t.shipCoords}
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-slate-500 block mb-1">{t.lat}</span>
            <input 
              type="number" 
              value={shipPos.lat.toFixed(2)} 
              onChange={handleLatChange}
              step="0.1"
              min="-90" max="90"
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <span className="text-xs text-slate-500 block mb-1">{t.lng}</span>
            <input 
              type="number" 
              value={shipPos.lng.toFixed(2)} 
              onChange={handleLngChange}
              step="0.1"
              min="-180" max="180"
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 p-3 rounded text-xs text-slate-400 leading-relaxed border border-slate-700">
        <strong>Tip:</strong> {t.dragTip}
      </div>

    </div>
  );
};

export default Controls;