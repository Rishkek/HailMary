import { create } from 'zustand';
import { initialDashboardData } from '../data/mockData';

export const useDashboardStore = create((set) => ({
  hospitals: initialDashboardData.hospitals,
  bloodInventory: initialDashboardData.bloodInventory,
  amcBottlenecks: initialDashboardData.amcBottlenecks,
  ambulances: initialDashboardData.ambulances,

  selectedHospitalId: null,
  setSelectedHospital: (id) => set({ selectedHospitalId: id }),

  admitPatient: (hospitalId) => set((state) => ({
    hospitals: state.hospitals.map((hosp) => {
      if (hosp.id === hospitalId && hosp.beds.icu.occupied < hosp.beds.icu.total) {
        return {
          ...hosp,
          beds: { ...hosp.beds, icu: { ...hosp.beds.icu, occupied: hosp.beds.icu.occupied + 1 } }
        };
      }
      return hosp;
    })
  })),

  transferBlood: (bloodId) => set((state) => ({
    bloodInventory: state.bloodInventory.filter(blood => blood.id !== bloodId)
  })),

  dropOxygen: (hospitalId, amount) => set((state) => ({
    hospitals: state.hospitals.map(hosp => 
      hosp.id === hospitalId 
        ? { ...hosp, oxygenPressure: Math.max(0, hosp.oxygenPressure - amount) }
        : hosp
    )
  })),

  progressSimulation: () => set((state) => {
    const updatedHospitals = state.hospitals.map(hosp => {
      if (hosp.id === "HOSP-BLR-02" && hosp.oxygenPressure > 15) {
        return { ...hosp, oxygenPressure: hosp.oxygenPressure - 1 };
      }
      return hosp;
    });

    const updatedAmbulances = state.ambulances.map(amb => {
      if (amb.etaMins > 0) return { ...amb, etaMins: amb.etaMins - 1 };
      return amb;
    });

    return { hospitals: updatedHospitals, ambulances: updatedAmbulances };
  }),

  moveAmbulances: () => set((state) => {
    // INCREASED SPEED: Makes movement instantly obvious
    const SPEED = 0.00015; 

    const updatedAmbulances = state.ambulances.map(amb => {
      // DEFENSIVE FALLBACK: In case hot-reloading kept the old state without paths
      const path = amb.fullPath || [
        [12.9700, 77.5800], [12.9700, 77.5950], [12.9814, 77.5950], [12.9814, 77.6033]
      ];
      const pIndex = amb.pathIndex !== undefined ? amb.pathIndex : 0;

      const targetNode = path[pIndex];
      if (!targetNode) return amb;

      const dLat = targetNode[0] - amb.coordinates[0];
      const dLng = targetNode[1] - amb.coordinates[1];
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);

      // SMOOTH TURN LOGIC: If we are close enough to reach the corner in this frame, snap to it.
      // (Using a multiplier prevents them from overshooting the target and getting stuck)
      if (distance <= SPEED * 1.5) { 
        const nextIndex = (pIndex + 1) % path.length;
        return { 
          ...amb, 
          coordinates: targetNode, 
          pathIndex: nextIndex,
          fullPath: path 
        };
      }

      // Keep driving smoothly toward current waypoint
      const moveLat = (dLat / distance) * SPEED;
      const moveLng = (dLng / distance) * SPEED;

      return {
        ...amb,
        coordinates: [amb.coordinates[0] + moveLat, amb.coordinates[1] + moveLng],
        pathIndex: pIndex,
        fullPath: path
      };
    });

    return { ambulances: updatedAmbulances };
  })
}));