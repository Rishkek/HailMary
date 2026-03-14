import React, { useState } from 'react';
import { X, Send, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

const BloodLiquidityTable = ({ hospitals, allPredictions, selectedBloodType, onAlert }) => {
  const [activeH, setActiveH] = useState(null);
  const [status, setStatus] = useState("idle");

  const groups = [
    { k: 'O_pos', l: 'O+' }, { k: 'O_neg', l: 'O-' },
    { k: 'A_pos', l: 'A+' }, { k: 'A_neg', l: 'A-' },
    { k: 'B_pos', l: 'B+' }, { k: 'B_neg', l: 'B-' },
    { k: 'AB_pos', l: 'AB+' }, { k: 'AB_neg', l: 'AB-' }
  ];

  const handleSend = () => {
    setStatus("sending");
    setTimeout(() => {
      onAlert(activeH);
      setStatus("success");
      setTimeout(() => { setStatus("idle"); setActiveH(null); }, 1500);
    }, 1200);
  };

  return (
    <div className="h-full relative font-sans">
      <div className="p-2">
        {hospitals.map(h => {
          const p = allPredictions[h.id];
          const isCrit = h[selectedBloodType] < 15;
          return (
            <div key={h.id} onClick={() => { setActiveH(h); setStatus("idle"); }} className="mb-1 p-2 border border-red-900/10 hover:border-red-500/50 hover:bg-red-950/20 cursor-pointer rounded transition-all">
              <div className="flex justify-between text-[10px] uppercase font-black">
                <span className={isCrit ? 'text-red-500 animate-pulse' : 'text-blue-400'}>{h.name}</span>
                <span className="text-white/60">{h[selectedBloodType]}u</span>
              </div>
            </div>
          );
        })}
      </div>

      {activeH && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md rounded">
          <div className="w-full glass-panel p-4 border border-red-900/50 shadow-2xl">
            <div className="flex justify-between mb-4 border-b border-red-900/30 pb-2 text-white">
              <span className="text-[10px] font-black uppercase truncate pr-4">{activeH.name}</span>
              <button onClick={() => setActiveH(null)}><X size={16}/></button>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-6">
              {groups.map(g => (
                <div key={g.k} className="flex flex-col items-center p-1 bg-white/5 rounded">
                  <span className="text-[7px] text-white/40">{g.l}</span>
                  <span className={`text-[10px] font-mono ${activeH[g.k] < 15 ? 'text-red-500 font-bold animate-pulse' : 'text-white'}`}>{activeH[g.k]}</span>
                </div>
              ))}
            </div>

            {selectedBloodType.includes('neg') && (
              <div className="mb-4 p-2 bg-red-950/20 border border-red-900/40 rounded flex items-center gap-2">
                <ShieldAlert size={12} className="text-red-500" />
                <span className="text-[8px] text-red-500 font-bold uppercase italic">O- Universal Bridge Monitoring Enabled</span>
              </div>
            )}

            <button onClick={handleSend} disabled={status !== 'idle'} className={`w-full py-2 rounded text-[9px] font-black uppercase tracking-widest border transition-all ${status === 'idle' ? 'bg-red-600 border-red-400 text-black shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-black text-red-600 border border-red-900'}`}>
              {status === 'idle' ? 'SEND_EMERGENCY_DISPATCH' : status === 'sending' ? 'IDENTIFYING_DONOR...' : 'LOGISTICS_ACKNOWLEDGED'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodLiquidityTable;