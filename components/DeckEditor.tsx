import React, { useState } from 'react';
import { BlockageZone } from '../types';
import { Trash2, Plus, Triangle, ShieldAlert } from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface DeckEditorProps {
  zones: BlockageZone[];
  setZones: (zones: BlockageZone[]) => void;
  lang: Language;
}

const DeckEditor: React.FC<DeckEditorProps> = ({ zones, setZones, lang }) => {
  const t = translations[lang];
  // Local state for new zone form
  const [newName, setNewName] = useState(t.addObstacle);
  const [azimuth, setAzimuth] = useState(0); // Center angle
  const [width, setWidth] = useState(10); // Width in degrees
  const [elevation, setElevation] = useState(45); // Max height

  const handleAdd = () => {
    const halfWidth = width / 2;
    let start = (azimuth - halfWidth + 360) % 360;
    let end = (azimuth + halfWidth + 360) % 360;

    const newZone: BlockageZone = {
      id: Date.now().toString(),
      name: newName,
      startRelAz: start,
      endRelAz: end,
      maxElevation: elevation
    };

    setZones([...zones, newZone]);
  };

  const handleDelete = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <ShieldAlert className="text-amber-500" size={20} />
          {t.deckTitle}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {t.deckDesc}
        </p>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        
        {/* Add New Zone Form */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4">
           <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">{t.addObstacle}</h4>
           
           <div className="grid grid-cols-1 gap-3">
             <div>
               <label className="text-xs text-slate-400">{t.objName}</label>
               <input 
                 type="text" 
                 value={newName}
                 onChange={(e) => setNewName(e.target.value)}
                 className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
               />
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-xs text-slate-400">{t.centerAz}</label>
                 <div className="flex items-center gap-2">
                   <input 
                     type="number" 
                     value={azimuth}
                     onChange={(e) => setAzimuth(Number(e.target.value))}
                     className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                   />
                   <span className="text-xs text-slate-500">deg</span>
                 </div>
               </div>
               <div>
                  <label className="text-xs text-slate-400">{t.widthArc}</label>
                  <div className="flex items-center gap-2">
                   <input 
                     type="number" 
                     value={width}
                     onChange={(e) => setWidth(Number(e.target.value))}
                     className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                   />
                   <span className="text-xs text-slate-500">deg</span>
                 </div>
               </div>
             </div>

             <div>
               <label className="text-xs text-slate-400">{t.maxElev}</label>
               <div className="flex items-center gap-2">
                 <input 
                   type="range" 
                   min="0" max="90" 
                   value={elevation}
                   onChange={(e) => setElevation(Number(e.target.value))}
                   className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                 />
                 <span className="text-sm font-mono text-amber-400 w-8">{elevation}°</span>
               </div>
             </div>

             <button 
               onClick={handleAdd}
               className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
             >
               <Plus size={16} /> {t.addToDeck}
             </button>
           </div>
        </div>

        {/* Existing Zones List */}
        <div>
          <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">{t.currentObs}</h4>
          <div className="space-y-2">
            {zones.length === 0 && (
              <div className="text-center py-4 text-sm text-slate-500 italic">
                {t.noObs}
              </div>
            )}
            {zones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between bg-slate-700/30 border border-slate-700 p-2 rounded hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                   <div className="bg-slate-800 p-2 rounded text-amber-500">
                     <Triangle size={14} fill="currentColor" />
                   </div>
                   <div>
                     <div className="text-sm font-medium text-slate-200">{zone.name}</div>
                     <div className="text-xs text-slate-400">
                       Az: {Math.round(zone.startRelAz)}°-{Math.round(zone.endRelAz)}° | El: &lt;{zone.maxElevation}°
                     </div>
                   </div>
                </div>
                <button 
                  onClick={() => handleDelete(zone.id)}
                  className="text-slate-500 hover:text-red-400 p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckEditor;