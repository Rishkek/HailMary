import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle2, ShieldAlert, TrendingDown } from 'lucide-react';

const HospitalShortagePredictor = ({ hospitals, allPredictions, selectedBloodType }) => {
  const [query, setQuery] = useState("");
  const [selectedHospital, setSelectedHospital] = useState(null);

  const handleSearch = (name) => {
    const found = hospitals.find(h => h.name.toLowerCase() === name.toLowerCase());
    setSelectedHospital(found);
  };

  const prediction = selectedHospital ? allPredictions[selectedHospital.id] : null;
  const currentStock = selectedHospital ? selectedHospital[selectedBloodType] : 0;

  // Verdict Logic based on your ML output
  const hasRisk = prediction?.deficit_48h > 12 || currentStock < 10;

  return (
    <div className="p-8 h-full flex flex-col items-center bg-[#050505]">
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-3">
          <ShieldAlert className="text-red-600" /> ML_Risk_Assessment_Terminal
        </h2>

        {/* Search Bar */}
        <div className="relative mb-12 glass-panel p-2 rounded-lg border border-red-900/30">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-red-900" size={20} />
          <input
            type="text"
            list="hospital-list"
            placeholder="ENTER_HOSPITAL_IDENTIFIER..."
            className="w-full bg-transparent p-4 pl-14 text-lg text-white outline-none font-data placeholder:text-red-950 uppercase"
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
          />
          <datalist id="hospital-list">
            {hospitals.map(h => <option key={h.id} value={h.name} />)}
          </datalist>
        </div>

        {/* Result Reveal */}
        {selectedHospital ? (
          <div className={`glass-panel p-8 rounded-xl border-t-4 transition-all duration-700 ${hasRisk ? 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.2)]' : 'border-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.2)]'}`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-white uppercase italic leading-none">{selectedHospital.name}</h3>
                <p className="font-data text-[10px] text-red-400/60 mt-2 uppercase tracking-widest">Global_Node_ID: {selectedHospital.id} // Zone: {selectedHospital.pincode}</p>
              </div>
              {hasRisk ? <AlertCircle size={40} className="text-red-600 animate-pulse" /> : <CheckCircle2 size={40} className="text-blue-500" />}
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="p-4 bg-white/5 rounded border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Current Stock ({selectedBloodType.replace('_',' ')})</span>
                <span className="text-3xl font-black font-data text-white">{currentStock}u</span>
              </div>
              <div className="p-4 bg-white/5 rounded border border-white/5">
                <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">48h ML Forecasted Deficit</span>
                <span className={`text-3xl font-black font-data ${prediction?.deficit_48h > 12 ? 'text-red-500' : 'text-blue-400'}`}>
                  {prediction ? prediction.deficit_48h : '0.0'}u
                </span>
              </div>
            </div>

            <div className={`p-6 rounded flex items-center gap-4 ${hasRisk ? 'bg-red-950/40 border border-red-800/50' : 'bg-blue-950/20 border border-blue-800/50'}`}>
              <div className="flex-1">
                <h4 className={`text-sm font-black uppercase italic ${hasRisk ? 'text-red-500' : 'text-blue-400'}`}>
                  Verdict: {hasRisk ? 'Shortage Highly Likely' : 'Optimal Stability Maintained'}
                </h4>
                <p className="text-[10px] text-white/50 mt-1 uppercase leading-tight font-data">
                  Analysis based on live traffic congestion ({prediction?.traffic_impact || 'Moderate'}), local rainfall, and population density.
                </p>
              </div>
              {hasRisk && <TrendingDown className="text-red-500 animate-bounce" />}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-red-900/20 rounded-xl">
             <p className="text-red-900 font-data text-xs uppercase tracking-[0.5em] animate-pulse">Awaiting_Input_Sequence...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalShortagePredictor;