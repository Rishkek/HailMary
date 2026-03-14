import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

export default function BedCapacityChart() {
  const hospitals = useDashboardStore((state) => state.hospitals);
  const selectedHospitalId = useDashboardStore((state) => state.selectedHospitalId);
  const setSelectedHospital = useDashboardStore((state) => state.setSelectedHospital);

  const displayHospitals = selectedHospitalId 
    ? hospitals.filter(h => h.id === selectedHospitalId)
    : hospitals;

  return (
    <Card className="flex flex-col h-full w-full bg-[#010805] border-emerald-900/30 text-emerald-50 relative overflow-hidden">
      {selectedHospitalId && (
        <button 
          onClick={() => setSelectedHospital(null)} 
          className="absolute top-4 right-4 text-xs font-bold tracking-widest text-emerald-500 hover:text-emerald-300 transition-colors z-20 bg-emerald-950/40 border border-emerald-900 px-3 py-1 cursor-pointer"
        >
          [X] SHOW ALL
        </button>
      )}
      
      <CardHeader className="border-b border-emerald-900/20 shrink-0 pb-3">
        <CardTitle className="text-xl text-emerald-500 uppercase tracking-[0.15em]">
          {selectedHospitalId ? `Capacity Metrics: ${displayHospitals[0]?.name}` : 'Network Capacity Overview'}
        </CardTitle>
      </CardHeader>

      <CardContent className={`flex-1 p-2 grid gap-2 ${selectedHospitalId ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
        {displayHospitals.map(hosp => {
          const rawData = [
            { name: 'ICU (Occ)', value: hosp.beds.icu.occupied, color: '#ef4444', gradient: 'url(#gradRed)' },
            { name: 'ICU (Avail)', value: hosp.beds.icu.total - hosp.beds.icu.occupied, color: '#10b981', gradient: 'url(#gradEmerald)' },
            { name: 'HDU', value: hosp.beds.hdu.occupied, color: '#f59e0b', gradient: 'url(#gradAmber)' },
            { name: 'General', value: hosp.beds.general.occupied, color: '#3b82f6', gradient: 'url(#gradBlue)' }
          ];

          const totalBeds = rawData.reduce((sum, item) => sum + item.value, 0);

          const data = rawData.map(item => {
            const percentage = totalBeds > 0 ? Math.round((item.value / totalBeds) * 100) : 0;
            return {
              ...item,
              legendName: `${item.name} [${percentage}%]`
            };
          });

          return (
            <div key={hosp.id} className="flex flex-col items-center justify-center w-full h-full min-h-0 relative pb-6">
              {!selectedHospitalId && (
                <h3 className="text-emerald-400 font-mono text-[10px] sm:text-xs tracking-widest mb-2 border-b border-emerald-900/40 pb-1 text-center truncate w-full">
                  {hosp.name.toUpperCase()}
                </h3>
              )}
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="gradRed" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#450a0a" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                      <linearGradient id="gradEmerald" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#022c22" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <linearGradient id="gradAmber" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#451a03" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                      <linearGradient id="gradBlue" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#172554" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>

                    <Pie
                      data={data}
                      cx="50%" cy="50%"
                      innerRadius={selectedHospitalId ? '55%' : '35%'}
                      outerRadius={selectedHospitalId ? '80%' : '60%'}
                      paddingAngle={4}
                      dataKey="value" 
                      nameKey="legendName"
                      stroke="#010805"
                      strokeWidth={3}
                    >
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.gradient} 
                          style={{ filter: `drop-shadow(0 0 3px ${entry.color}60)` }} 
                        />
                      ))}
                    </Pie>
                    
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#010805',
                        border: '1px solid #10b981',
                        color: '#ecfdf5',
                        borderRadius: '0px', 
                        fontFamily: 'monospace', 
                        fontSize: '14px', 
                        boxShadow: '0 0 15px rgba(16,185,129,0.2)'
                      }}
                      itemStyle={{ color: '#ecfdf5', fontWeight: 'bold' }} 
                    />
                    
                    <Legend 
                      verticalAlign="bottom" 
                      height={48}
                      wrapperStyle={{ 
                        fontFamily: 'monospace', 
                        // SIGNIFICANTLY BIGGER TEXT HERE
                        fontSize: selectedHospitalId ? '16px' : '12px',
                        textTransform: 'uppercase',
                        paddingTop: '8px',
                        fontWeight: 'bold'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}