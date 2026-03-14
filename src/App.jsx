import React, { useState, useEffect, useMemo } from "react";
import { Activity, LayoutGrid, Database, Terminal, CheckCircle2, XCircle } from "lucide-react";
import EmsDiversionMap from "./components/EmsDiversionMap";

const App = () => {
  const [hospitals, setHospitals] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [selectedType, setSelectedType] = useState('O_neg');
  const [isOnline, setIsOnline] = useState(false);

  // Sync Logic - Guaranteed to never wipe the 'hospitals' state once set
  const sync = async () => {
    try {
      if (hospitals.length === 0) {
        const hRes = await fetch('http://localhost:8000/hospitals');
        const hData = await hRes.json();
        if (hData) setHospitals(hData);
      }

      const pRes = await fetch('http://localhost:8000/predict_all_nodes');
      const pData = await pRes.json();

      if (pData?.nodes) {
        const pMap = {};
        pData.nodes.forEach(n => { pMap[n.id] = n.analysis; });
        setPredictions(pMap);
        setIsOnline(true);
      }
    } catch (e) {
      console.error("SYNC_ERROR");
      setIsOnline(false);
    }
  };

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 10000);
    return () => clearInterval(interval);
  }, [selectedType]);

  const metrics = useMemo(() => {
    if (!hospitals.length) return { val: "0", color: "text-white", crit: 0 };
    const critNodes = hospitals.filter(h => (h[selectedType] || 0) < 15 || predictions?.[h.id]?.[selectedType]?.is_critical);
    const val = (((hospitals.length - critNodes.length) / hospitals.length) * 100).toFixed(1);
    return { val, color: val > 90 ? "text-emerald-500" : "text-rose-500", crit: critNodes.length };
  }, [hospitals, predictions, selectedType]);

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-white overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-[260px] border-r border-white/5 bg-[#0a0a0a] p-8 flex flex-col gap-2 shadow-2xl z-50">
        <div className="flex items-center gap-3 mb-12 text-rose-600 font-black text-2xl uppercase tracking-tighter">
           <Activity size={28} className="animate-pulse" /> BloodLink
        </div>
        <nav className="space-y-1 flex-1">
          <div className="flex items-center gap-3 p-3 bg-rose-600/10 text-rose-500 rounded-xl text-sm font-bold cursor-pointer">
             <LayoutGrid size={18}/> Dashboard
          </div>
          <div className="flex items-center gap-3 p-3 text-neutral-500 hover:text-white rounded-xl text-sm font-bold cursor-pointer">
             <Database size={18}/> Node Grid
          </div>
        </nav>
        <div className="pt-8 border-t border-white/5 flex items-center gap-2 text-[10px] font-bold text-neutral-600 uppercase">
           {isOnline ? <CheckCircle2 size={12} className="text-emerald-500"/> : <XCircle size={12} className="text-rose-500"/>}
           Grid: {isOnline ? 'Online' : 'Syncing'}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 flex flex-col overflow-hidden relative">
        <header className="flex justify-between items-center mb-10">
           <div>
              <h1 className="text-4xl font-black uppercase tracking-tight">Grid Command</h1>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[4px] mt-1 italic">SATELLITE_HUD // SECTOR_04</p>
           </div>

           <select
             className="bg-neutral-900 border border-white/10 text-[10px] font-bold p-3 px-6 rounded-xl outline-none"
             value={selectedType}
             onChange={e => setSelectedType(e.target.value)}
           >
              {['O_neg', 'O_pos', 'A_neg', 'A_pos'].map(t => <option key={t} value={t}>{t.replace('_',' ').toUpperCase()}</option>)}
           </select>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
          <div className="col-span-3 flex flex-col gap-6">
             <div className="p-8 bg-[#0d0d0d] border border-white/5 rounded-3xl shadow-2xl">
                <span className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest">Global Stability</span>
                <div className={`text-5xl font-black mt-2 italic ${metrics.color}`}>{metrics.val}%</div>
             </div>
             <div className="p-8 bg-[#0d0d0d] border border-white/5 rounded-3xl shadow-2xl">
                <span className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest text-rose-500">Critical Alerts</span>
                <div className="text-4xl font-black mt-2 text-white">{metrics.crit}</div>
             </div>
          </div>

          {/* THE PERMANENT MAP AREA */}
          <div className="col-span-9 bg-[#0d0d0d] border border-white/5 rounded-[40px] overflow-hidden relative shadow-2xl">
             <EmsDiversionMap
               hospitals={hospitals}
               predictions={predictions}
               selectedType={selectedType}
             />

             {/* CONDITIONAL LOADER OVERLAY (DOES NOT UNMOUNT MAP) */}
             {hospitals.length === 0 && (
               <div className="absolute inset-0 z-[2000] bg-[#050505] flex items-center justify-center font-mono text-rose-600 animate-pulse uppercase tracking-[5px]">
                  Connecting_To_Grid_Satellite...
               </div>
             )}
          </div>
        </div>

        <footer className="mt-8 flex items-center justify-between px-2 opacity-30">
           <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-600">
              <Terminal size={14}/>
              <span>[{new Date().toLocaleTimeString()}] NODES_IDENTIFIED: {hospitals.length}</span>
           </div>
           <div className="text-[10px] font-bold tracking-[8px] uppercase">HEAL_A_THON_2026</div>
        </footer>
      </main>
    </div>
  );
};

export default App;