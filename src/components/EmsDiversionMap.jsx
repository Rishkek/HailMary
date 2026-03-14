import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const EmsDiversionMap = ({ hospitals = [], predictions = {}, selectedType = 'O_neg' }) => {
  const center = [12.9716, 77.5946];

  // Logic: Connect first 40 hospitals for the spider-web mesh
  const gridLines = useMemo(() => {
    const lines = [];
    if (hospitals.length < 5) return lines;

    hospitals.slice(0, 40).forEach((h, i) => {
      if (!h.location) return;
      const hPos = h.location.split(',').map(Number);
      const neighbors = hospitals
        .slice(0, 50)
        .map((target, idx) => {
          if (i === idx || !target.location) return { d: Infinity };
          const tPos = target.location.split(',').map(Number);
          return { d: Math.hypot(hPos[0]-tPos[0], hPos[1]-tPos[1]), pos: tPos };
        })
        .sort((a,b) => a.d - b.d).slice(0, 2);

      neighbors.forEach(n => { if(n.pos) lines.push([hPos, n.pos]); });
    });
    return lines;
  }, [hospitals]);

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png" />

        {/* THE MESH GRID */}
        {gridLines.map((line, idx) => (
          <Polyline
            key={idx}
            positions={line}
            pathOptions={{ color: '#e11d48', weight: 0.5, opacity: 0.15, className: 'mesh-line' }}
          />
        ))}

        {/* THE HOSPITAL NODES */}
        {hospitals.map((h, i) => {
          if (!h.location) return null;
          const pos = h.location.split(',').map(Number);

          const isCrit = (h[selectedType] || 0) < 15 || predictions?.[h.id]?.[selectedType]?.is_critical;

          const icon = L.divIcon({
            className: `blood-node ${isCrit ? 'node-critical' : 'node-stable'}`,
            iconSize: [10, 10],
            html: '<div style="width:100%;height:100%;border-radius:50%;border:1.5px solid white;"></div>'
          });

          return (
            <Marker key={h.id || i} position={pos} icon={icon}>
              <Popup>
                <div className="p-2 bg-black text-white font-mono text-[10px] uppercase">
                  <p className="font-bold border-b border-rose-900 pb-1 mb-1">{h.name}</p>
                  <p className="text-rose-500 font-bold">INVENTORY: {h[selectedType]}U</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default EmsDiversionMap;