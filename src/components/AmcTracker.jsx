import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { AlertTriangle, Clock } from 'lucide-react';

export default function AmcTracker() {
  const amcBottlenecks = useDashboardStore((state) => state.amcBottlenecks);

  return (
    <Card className="col-span-12 lg:col-span-6 bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <AlertTriangle className="text-amber-500 h-5 w-5" />
          AMC & Equipment Bottlenecks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {amcBottlenecks.map((item) => (
          <div key={item.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-200">{item.equipment}</h3>
                <p className="text-sm text-slate-400">{item.hospital}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md ${item.status === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                <Clock className="w-4 h-4" />
                {item.daysOffline} Days Offline
              </div>
            </div>
            <div className="mt-2 text-sm bg-slate-900 p-2 rounded text-slate-300 border border-slate-800">
              <span className="text-slate-500">Blocker: </span>
              {item.blocker}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}