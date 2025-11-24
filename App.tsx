import React, { useState, useMemo, useEffect } from 'react';
import { Coordinates, SignalStatus, DEFAULT_BLOCKAGE_ZONES, LookAngle, BlockageZone } from './types';
import { calculateLookAngle } from './utils/orbital';
import Globe3D from './components/Globe3D';
import DeckEditor from './components/DeckEditor';
import ShipRadar from './components/ShipRadar';
import Controls from './components/Controls';
import { Languages, Bot, Loader2 } from 'lucide-react';
import { translations, Language } from './utils/translations';
import { getGeminiAdvice } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [lang, setLang] = useState<Language>('zh'); // Default to Chinese
  const t = translations[lang];

  // Default: Ship in Pacific, Sat at 180 (Intelsat/Inmarsat region)
  const [shipPos, setShipPos] = useState<Coordinates>({ lat: 20.0, lng: -155.0 }); 
  const [shipHeading, setShipHeading] = useState<number>(0); // North
  const [satLng, setSatLng] = useState<number>(-170.0);
  
  // Lifted state for blockage zones so they can be edited
  const [blockageZones, setBlockageZones] = useState<BlockageZone[]>(DEFAULT_BLOCKAGE_ZONES);

  // AI Advice State
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);
  
  // --- Calculations ---
  const lookAngle: LookAngle = useMemo(() => {
    return calculateLookAngle(shipPos, satLng, shipHeading);
  }, [shipPos, satLng, shipHeading]);

  const signalStatus: SignalStatus = useMemo(() => {
    // Rule: Elevation < 5 degrees is strictly NO_LOS (Forbidden) to prevent interference
    if (lookAngle.elevation < 5) return SignalStatus.NO_LOS;
    
    // Check blockage zones
    const isBlocked = blockageZones.some(zone => {
      // Handle wrap around for zones (e.g. 350 to 10)
      let inAzimuth = false;
      // Normalize zone angles to 0-360 just in case
      let start = zone.startRelAz % 360;
      let end = zone.endRelAz % 360;
      if (start < 0) start += 360;
      if (end < 0) end += 360;
      
      const relAz = lookAngle.relativeAzimuth;

      if (start <= end) {
        inAzimuth = relAz >= start && relAz <= end;
      } else {
        // Crosses 0 (e.g. 350 to 10)
        inAzimuth = relAz >= start || relAz <= end;
      }
      return inAzimuth && lookAngle.elevation < zone.maxElevation;
    });

    if (isBlocked) return SignalStatus.BLOCKED;
    if (lookAngle.elevation < 15) return SignalStatus.MARGINAL;
    return SignalStatus.OPTIMAL;
  }, [lookAngle, blockageZones]);

  // --- Effects ---
  // Debounce AI API calls
  useEffect(() => {
    setLoadingAdvice(true);
    const timer = setTimeout(async () => {
      const advice = await getGeminiAdvice(shipPos, shipHeading, satLng, lookAngle, signalStatus, lang);
      setAiAdvice(advice);
      setLoadingAdvice(false);
    }, 1500); // 1.5s debounce to avoid hammering API while dragging sliders

    return () => clearTimeout(timer);
  }, [shipPos, shipHeading, satLng, lookAngle, signalStatus, lang]);


  const toggleLang = () => {
    setLang(l => l === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-12">
      
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Company Logo Link */}
            <a 
              href="https://www.jt-sealink.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 group transition-opacity hover:opacity-90"
              title="访问杰泰海科主页 / Visit JT Sealink"
            >
               {/* CSS Logo Approximation: JT Circle */}
               <div className="relative w-10 h-10 flex items-center justify-center">
                   {/* Outer Ring */}
                   <div className="absolute inset-0 rounded-full border-[2px] border-blue-600/80 group-hover:border-blue-500 transition-colors shadow-lg shadow-blue-500/20"></div>
                   {/* Decorative Arcs */}
                   <div className="absolute inset-[3px] rounded-full border-t-[2px] border-green-500/90 rotate-[-45deg]"></div>
                   <div className="absolute inset-[3px] rounded-full border-b-[2px] border-blue-400/90 rotate-[-45deg]"></div>
                   {/* Text */}
                   <span className="font-bold text-slate-100 text-sm z-10 tracking-tighter">JT</span>
               </div>
               
               <div className="flex flex-col -space-y-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black tracking-wide text-slate-100">杰泰海科</span>
                    <span className="text-xl font-bold text-blue-500">Sealink</span>
                  </div>
               </div>
            </a>
            
            {/* Divider */}
            <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

            {/* App Title */}
            <div className="hidden md:block">
              <h1 className="text-sm font-bold tracking-tight text-slate-200">SatLink <span className="text-blue-500">{t.appTitle}</span></h1>
              <p className="text-[10px] text-slate-400">{t.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400">
             <button 
               onClick={toggleLang} 
               className="flex items-center gap-2 hover:text-white transition-colors bg-slate-700 px-3 py-1.5 rounded-full"
             >
               <Languages size={14} /> {lang === 'en' ? '中文' : 'English'}
             </button>
             <span className="hidden md:block bg-slate-700 px-2 py-1 rounded text-xs text-slate-300 font-mono">
               LAT: {shipPos.lat.toFixed(1)} | LNG: {shipPos.lng.toFixed(1)}
             </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Section: 3D Visualization & Controls */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          
          {/* Column 1: Controls */}
          <div className="space-y-6">
            <Controls 
              shipPos={shipPos} setShipPos={setShipPos}
              shipHeading={shipHeading} setShipHeading={setShipHeading}
              satLng={satLng} setSatLng={setSatLng}
              lang={lang}
            />
          </div>

          {/* Column 2: 3D Globe (Interactive) */}
          <div className="xl:col-span-1 flex flex-col gap-4">
             <div className="bg-slate-800 rounded-lg border border-slate-700 p-2 shadow-xl">
                <h3 className="text-slate-300 font-semibold mb-2 ml-2 flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  {t.orbitView}
               </h3>
               <Globe3D 
                 shipPos={shipPos} 
                 setShipPos={setShipPos} 
                 satLng={satLng} 
                 lang={lang}
               />
             </div>
             
             {/* Telemetry Panel */}
             <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 shadow-xl grid grid-cols-2 gap-4">
                  <div className="flex flex-col border-r border-slate-700 pr-4">
                    <span className="text-slate-500 text-xs uppercase">{t.azimuth}</span>
                    <span className="text-2xl font-mono text-white">{lookAngle.azimuth.toFixed(1)}°</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs uppercase">{t.elevation}</span>
                    <span className={`text-2xl font-mono ${lookAngle.elevation < 15 ? 'text-amber-500' : 'text-white'}`}>
                      {lookAngle.elevation.toFixed(1)}°
                    </span>
                  </div>
             </div>

             {/* AI Advice Panel */}
             <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 shadow-xl flex flex-col gap-2">
                <h3 className="text-slate-300 font-semibold flex items-center gap-2 text-sm border-b border-slate-700 pb-2">
                   <Bot size={16} className="text-purple-400" />
                   {t.aiOfficer}
                </h3>
                <div className="min-h-[60px] text-sm text-slate-300 leading-relaxed">
                   {loadingAdvice ? (
                     <div className="flex items-center gap-2 text-slate-500 italic">
                        <Loader2 className="animate-spin" size={14} /> {t.initializing}
                     </div>
                   ) : (
                     aiAdvice
                   )}
                </div>
             </div>
          </div>

           {/* Column 3: Radar & Deck Editor */}
           <div className="space-y-6">
              <ShipRadar 
                  lookAngle={lookAngle} 
                  blockageZones={blockageZones}
                  shipHeading={shipHeading}
                  status={signalStatus}
                  lang={lang}
               />
               
               {/* Deck Editor Component */}
               <div className="h-[350px]">
                 <DeckEditor 
                   zones={blockageZones} 
                   setZones={setBlockageZones} 
                   lang={lang}
                  />
               </div>
           </div>

        </div>

        {/* Info Footer */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 text-center text-slate-500 text-sm">
           <p>{t.footer}</p>
        </div>

      </main>
    </div>
  );
};

export default App;