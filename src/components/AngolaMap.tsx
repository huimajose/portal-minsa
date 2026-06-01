/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Info, RefreshCw, ZoomIn, ChevronRight, Lock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ANGOLA_PROVINCES } from '../data/mockData';
import { UserRole, UserSession } from '../types';
import { hasPermission } from './RoleGuard';

interface AngolaMapProps {
  selectedProvince: string;
  onSelectProvince: (province: string) => void;
  selectedMunicipality: string;
  onSelectMunicipality: (municipality: string) => void;
  provinceAlerts: { [key: string]: 'Normal' | 'Atenção' | 'Crítico' };
  provinceStats: { province: string; patients: number; hospitals: number }[];
  userRole: UserRole;
  userProvince?: string;
  userSession?: UserSession | null;
}

// 18 Provinces real centroids coordinates
const PROVINCE_COORDS: { [key: string]: [number, number] } = {
  'Cabinda': [-5.03, 12.35],
  'Zaire': [-6.13, 13.50],
  'Uíge': [-7.61, 15.05],
  'Bengo': [-8.50, 13.90],
  'Luanda': [-8.84, 13.26],
  'Cuanza Norte': [-9.00, 14.85],
  'Malanje': [-9.54, 16.34],
  'Lunda Norte': [-8.50, 19.50],
  'Lunda Sul': [-10.00, 20.30],
  'Cuanza Sul': [-10.50, 14.50],
  'Benguela': [-12.58, 13.40],
  'Huambo': [-12.78, 15.73],
  'Bié': [-12.40, 17.50],
  'Moxico': [-13.00, 20.00],
  'Namibe': [-15.20, 12.50],
  'Huíla': [-15.00, 14.80],
  'Cunene': [-16.50, 16.00],
  'Cuando Cubango': [-16.00, 19.50]
};

// Municipal coordinates mapping for key focus provinces
const MUNICIPALITY_COORDS: { [key: string]: { [key: string]: [number, number] } } = {
  'Luanda': {
    'Ingombota': [-8.81, 13.23],
    'Rangel': [-8.82, 13.26],
    'Maianga': [-8.84, 13.24],
    'Belas': [-8.98, 13.15],
    'Talatona': [-8.92, 13.19],
    'Cacuaco': [-8.78, 13.37],
    'Viana': [-8.90, 13.43]
  },
  'Benguela': {
    'Benguela': [-12.58, 13.40],
    'Lobito': [-12.35, 13.54],
    'Baía Farta': [-12.72, 13.19],
    'Catumbela': [-12.43, 13.53],
    'Ganda': [-13.03, 14.63]
  },
  'Huambo': {
    'Huambo': [-12.78, 15.73],
    'Caála': [-12.85, 15.54],
    'Bailundo': [-12.19, 15.86],
    'Ekunha': [-12.68, 15.51],
    'Londuimbali': [-12.48, 15.28]
  },
  'Cabinda': {
    'Cabinda': [-5.55, 12.20],
    'Cacongo': [-5.27, 12.16],
    'Buco-Zau': [-4.89, 12.56],
    'Belize': [-4.63, 12.74]
  },
  'Huíla': {
    'Lubango': [-15.01, 13.55],
    'Chibia': [-15.19, 13.69],
    'Humpata': [-15.02, 13.36],
    'Caconda': [-13.73, 15.07],
    'Matala': [-14.78, 14.73]
  },
  'Uíge': {
    'Uíge': [-7.61, 15.05],
    'Negage': [-7.75, 15.26],
    'Songo': [-7.42, 15.04],
    'Maquela do Zombo': [-6.04, 15.12]
  },
  'Bengo': {
    'Dande': [-8.51, 13.62],
    'Ambriz': [-7.85, 13.11],
    'Nambuangongo': [-7.99, 14.02]
  }
};

const MUNICIPALITIES_BY_PROVINCE: { [key: string]: { name: string; patientsScale: number }[] } = {
  'Luanda': [
    { name: 'Ingombota', patientsScale: 1.2 },
    { name: 'Rangel', patientsScale: 0.9 },
    { name: 'Maianga', patientsScale: 0.8 },
    { name: 'Belas', patientsScale: 1.4 },
    { name: 'Talatona', patientsScale: 1.3 },
    { name: 'Cacuaco', patientsScale: 0.7 },
    { name: 'Viana', patientsScale: 1.5 }
  ],
  'Benguela': [
    { name: 'Benguela', patientsScale: 1.1 },
    { name: 'Lobito', patientsScale: 1.3 },
    { name: 'Baía Farta', patientsScale: 0.6 },
    { name: 'Catumbela', patientsScale: 0.8 },
    { name: 'Ganda', patientsScale: 0.5 }
  ],
  'Huambo': [
    { name: 'Huambo', patientsScale: 1.2 },
    { name: 'Caála', patientsScale: 0.9 },
    { name: 'Bailundo', patientsScale: 1.0 },
    { name: 'Ekunha', patientsScale: 0.6 },
    { name: 'Londuimbali', patientsScale: 0.5 }
  ],
  'Cabinda': [
    { name: 'Cabinda', patientsScale: 1.4 },
    { name: 'Cacongo', patientsScale: 0.7 },
    { name: 'Buco-Zau', patientsScale: 0.6 },
    { name: 'Belize', patientsScale: 0.5 }
  ],
  'Huíla': [
    { name: 'Lubango', patientsScale: 1.3 },
    { name: 'Chibia', patientsScale: 0.7 },
    { name: 'Humpata', patientsScale: 0.8 },
    { name: 'Caconda', patientsScale: 0.5 },
    { name: 'Matala', patientsScale: 0.9 }
  ],
  'Uíge': [
    { name: 'Uíge', patientsScale: 1.1 },
    { name: 'Negage', patientsScale: 0.9 },
    { name: 'Songo', patientsScale: 0.6 },
    { name: 'Maquela do Zombo', patientsScale: 0.7 }
  ],
  'Bengo': [
    { name: 'Dande', patientsScale: 1.2 },
    { name: 'Ambriz', patientsScale: 0.7 },
    { name: 'Nambuangongo', patientsScale: 0.8 }
  ]
};

export default function AngolaMap({
  selectedProvince,
  onSelectProvince,
  selectedMunicipality,
  onSelectMunicipality,
  provinceAlerts,
  provinceStats,
  userRole,
  userProvince,
  userSession
}: AngolaMapProps) {
  const [authWarning, setAuthWarning] = useState<string | null>(null);
  const [mapStyleMode, setMapStyleMode] = useState<'vector' | 'heatmap' | 'bubbles' | 'capacity'>('heatmap');

  const canViewAll = userSession 
    ? hasPermission(userSession, 'VIEW_ALL_PROVINCES') 
    : userRole !== 'GESTOR_PROVINCIAL';

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const makersLayerRef = useRef<L.LayerGroup | null>(null);

  // Safe fallback to find metric counts
  const getProvinceMetricData = (pName: string) => {
    const stats = provinceStats.find(s => s.province === pName);
    return {
      patients: stats?.patients || 0,
      hospitals: stats?.hospitals || 0
    };
  };

  const getAlertTagClass = (level: 'Normal' | 'Atenção' | 'Crítico' | undefined) => {
    if (level === 'Crítico') return 'bg-red-500 border-red-600 text-white';
    if (level === 'Atenção') return 'bg-amber-500 border-amber-600 text-white';
    return 'bg-emerald-500 border-emerald-600 text-white';
  };

  // Handle Province Clicks with strict Role constraints
  const handleProvinceClick = (provinceName: string) => {
    const isRestricted = userSession 
      ? (!hasPermission(userSession, 'VIEW_ALL_PROVINCES') && userSession.province && userSession.province !== provinceName)
      : (userRole === 'GESTOR_PROVINCIAL' && userProvince && userProvince !== provinceName);

    if (isRestricted) {
      setAuthWarning(`Acesso Recusado: O seu perfil de Gestor Provincial está restrito a dados da Província do ${userSession?.province || userProvince}.`);
      setTimeout(() => setAuthWarning(null), 3500);
      return;
    }
    setAuthWarning(null);
    onSelectProvince(provinceName);
    onSelectMunicipality('All');
  };

  // Resolve municipalities list for selected view
  const currentProvinceMunicipalities = useMemo(() => {
    if (selectedProvince === 'All') return [];
    return MUNICIPALITIES_BY_PROVINCE[selectedProvince] || [
      { name: `${selectedProvince} Central`, patientsScale: 1.2 },
      { name: 'Sede Regional', patientsScale: 0.8 },
      { name: 'Distrito Periférico', patientsScale: 0.5 }
    ];
  }, [selectedProvince]);

  // Handle Leaflet Map Initialization and updates
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      // Bound the map coordinates exactly around Angola to keep focus purely on Angola (not full Africa)
      const angolaBounds = L.latLngBounds([-18.5, 11.0], [-4.0, 24.5]);
      
      const map = L.map(mapContainerRef.current, {
        center: [-12.20, 18.20],
        zoom: 5.3,
        minZoom: 5.2,
        maxZoom: 9.5,
        maxBounds: angolaBounds,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);
      mapInstanceRef.current = map;
      makersLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersLayer = makersLayerRef.current;

    // Update Tiles style based on mapStyleMode
    // Remove old tile layers first
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Dark base for hotspots heatmap and bubbles, clear light base for clinical/capacity vectors
    const tileUrl = (mapStyleMode === 'heatmap' || mapStyleMode === 'bubbles')
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 10,
    }).addTo(map);

    // Pan & Zoom map smoothly, keeping within state bounds
    if (selectedProvince === 'All') {
      map.setView([-12.2, 18.2], 5.3, { animate: true, duration: 1.2 });
    } else {
      const coords = PROVINCE_COORDS[selectedProvince] || [-12.2, 18.2];
      map.setView(coords, 7.5, { animate: true, duration: 1 });
    }

    // Refresh Markers
    if (markersLayer) {
      markersLayer.clearLayers();

      if (selectedProvince === 'All') {
        // Redraw National Province Heatspots / Markers
        Object.keys(PROVINCE_COORDS).forEach((provinceName) => {
          const coords = PROVINCE_COORDS[provinceName];
          const stats = getProvinceMetricData(provinceName);
          const alertLvl = provinceAlerts[provinceName] || 'Normal';
          const patientsCount = stats.patients;

          // Compute size indicator
          const pulseSize = Math.max(20, Math.min(75, 12 + Math.sqrt(patientsCount) * 2));

          let markerHtml = '';

          if (mapStyleMode === 'vector') {
            let markerBg = 'bg-[#004a99]';
            if (alertLvl === 'Crítico') markerBg = 'bg-red-500 animate-pulse';
            else if (alertLvl === 'Atenção') markerBg = 'bg-amber-500 animate-pulse-subtle';

            markerHtml = `
              <div class="relative flex items-center justify-center">
                <div class="w-4 h-4 rounded-full ${markerBg} border border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-10">
                  <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                </div>
                <div class="absolute top-5 bg-slate-900/95 border border-slate-700/80 text-white font-sans text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none select-none z-20">
                  ${provinceName} <span class="font-mono font-medium text-sky-300">(${patientsCount})</span>
                </div>
              </div>
            `;
          } else if (mapStyleMode === 'heatmap') {
            let markerBg = 'bg-rose-500';
            if (alertLvl === 'Normal') markerBg = 'bg-[#004a99]';
            else if (alertLvl === 'Atenção') markerBg = 'bg-amber-500';

            markerHtml = `
              <div class="relative flex items-center justify-center">
                ${patientsCount > 0 ? `
                  <div class="absolute rounded-full bg-rose-500 opacity-25 animate-ping-subtle" 
                       style="width: ${pulseSize}px; height: ${pulseSize}px;"></div>
                  <div class="absolute rounded-full bg-gradient-to-r from-orange-400 to-rose-500 opacity-30" 
                       style="width: ${pulseSize * 1.5}px; height: ${pulseSize * 1.5}px;"></div>
                ` : ''}
                <div class="w-4 h-4 rounded-full ${markerBg} border border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-10">
                  <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                </div>
                <div class="absolute top-5 bg-slate-900/90 border border-slate-750/70 text-white font-sans text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none select-none">
                  ${provinceName} <span class="font-mono font-medium text-sky-300">(${patientsCount})</span>
                </div>
              </div>
            `;
          } else if (mapStyleMode === 'bubbles') {
            // Bubble scale sizes based on cases/patients count
            const bubbleSize = Math.max(22, Math.min(80, 15 + Math.sqrt(patientsCount) * 2.8));
            let bubbleColor = 'bg-sky-500/35 border-sky-400 text-sky-100';
            if (alertLvl === 'Crítico') bubbleColor = 'bg-rose-500/45 border-rose-500 text-rose-100';
            else if (alertLvl === 'Atenção') bubbleColor = 'bg-amber-500/40 border-amber-500 text-amber-100';

            markerHtml = `
              <div class="relative flex items-center justify-center">
                <div class="rounded-full ${bubbleColor} border-2 flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110" 
                     style="width: ${bubbleSize}px; height: ${bubbleSize}px;">
                  <span class="font-mono text-[9px] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                    ${patientsCount}
                  </span>
                </div>
                <div class="absolute top-[100%] mt-1 bg-slate-900/95 border border-slate-700/80 text-white font-sans text-[8.5px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none select-none z-20">
                  ${provinceName}
                </div>
              </div>
            `;
          } else if (mapStyleMode === 'capacity') {
            const hospitalCount = stats.hospitals;
            const capacityBg = hospitalCount > 10 ? 'bg-indigo-650 border-indigo-400' : 'bg-teal-650 border-teal-400';
            
            markerHtml = `
              <div class="relative flex items-center justify-center">
                <div class="px-2.5 py-1 rounded-xl ${capacityBg} border text-white font-mono text-[9px] font-black flex items-center gap-1 shadow-md cursor-pointer transition-transform hover:scale-110 z-10">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  🏥 ${hospitalCount} Hosp.
                </div>
                <div class="absolute top-[100%] mt-1 bg-slate-900 border border-slate-700 text-white font-sans text-[8.5px] font-semibold px-1 rounded shadow whitespace-nowrap pointer-events-none select-none z-20">
                  ${provinceName}
                </div>
              </div>
            `;
          }

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-leaflet-pin',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          const isRestricted = userSession 
            ? (!hasPermission(userSession, 'VIEW_ALL_PROVINCES') && userSession.province && userSession.province !== provinceName)
            : (userRole === 'GESTOR_PROVINCIAL' && userProvince !== provinceName);

          const marker = L.marker(coords, { icon: customIcon });
          marker.on('click', () => {
            if (!isRestricted) {
              handleProvinceClick(provinceName);
            } else {
              setAuthWarning(`Acesso Recusado: O seu perfil de Gestor Provincial está estritamente restrito a dados da Província do ${userSession?.province || userProvince}.`);
              setTimeout(() => setAuthWarning(null), 3500);
            }
          });
          
          marker.addTo(markersLayer);
        });
      } else {
        // Redraw granular municipalities of selected province
        const parentCoords = PROVINCE_COORDS[selectedProvince] || [-12.2, 18.2];
        
        currentProvinceMunicipalities.forEach((mun, idx) => {
          // Attempt to fetch municipal Lat/Long
          let coords = parentCoords;
          if (MUNICIPALITY_COORDS[selectedProvince] && MUNICIPALITY_COORDS[selectedProvince][mun.name]) {
            coords = MUNICIPALITY_COORDS[selectedProvince][mun.name];
          } else {
            // Safe fallback offset coordinates around center if real GPS points are missing
            const latOffset = 0.18 * Math.sin(idx * 1.2);
            const lngOffset = 0.18 * Math.cos(idx * 1.2);
            coords = [parentCoords[0] + latOffset, parentCoords[1] + lngOffset];
          }

          const isMunSelected = selectedMunicipality === mun.name;
          const stats = getProvinceMetricData(selectedProvince);
          const patientsCount = Math.round(stats.patients * (mun.patientsScale / 4.5));

          const pulseWidth = isMunSelected ? 32 : 20;

          let markerHtml = '';

          if (mapStyleMode === 'vector') {
            markerHtml = `
              <div class="relative flex items-center justify-center">
                ${isMunSelected ? `
                  <div class="absolute rounded-full bg-teal-500/25 animate-ping-subtle" 
                       style="width: ${pulseWidth * 1.8}px; height: ${pulseWidth * 1.8}px;"></div>
                ` : ''}
                <div class="w-3.5 h-3.5 rounded-full ${isMunSelected ? 'bg-teal-500' : 'bg-slate-100 hover:bg-slate-200'} border-2 border-[#004a99] shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-135">
                  <span class="w-1.5 h-1.5 rounded-full ${isMunSelected ? 'bg-white' : 'bg-[#004a99]'}"></span>
                </div>
                <div class="absolute top-4.5 bg-slate-900 text-white font-sans text-[8.5px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none select-none border border-slate-700/50">
                  ${mun.name} <span class="font-mono text-emerald-300 font-extrabold">(${patientsCount})</span>
                </div>
              </div>
            `;
          } else if (mapStyleMode === 'heatmap') {
            const tempVal = Math.max(12, Math.min(45, 8 + Math.sqrt(patientsCount) * 2.2));
            markerHtml = `
              <div class="relative flex items-center justify-center font-sans">
                <div class="absolute rounded-full bg-rose-500 opacity-30 animate-pulse-subtle" 
                     style="width: ${tempVal}px; height: ${tempVal}px;"></div>
                <div class="absolute rounded-full bg-orange-400/20 animate-ping-subtle" 
                     style="width: ${tempVal * 1.6}px; height: ${tempVal * 1.6}px;"></div>
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white cursor-pointer hover:scale-125 z-10"></span>
                <div class="absolute top-4 bg-slate-900 text-white font-sans text-[8px] px-1 py-0.5 rounded whitespace-nowrap pointer-events-none select-none z-20 font-bold">
                  ${mun.name}
                </div>
              </div>
            `;
          } else if (mapStyleMode === 'bubbles') {
            const bubbleSize = Math.max(16, Math.min(48, 6 + Math.sqrt(patientsCount) * 2.6));
            markerHtml = `
              <div class="relative flex items-center justify-center font-mono">
                <div class="rounded-full bg-teal-500/35 border border-teal-500 flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-115 z-10" 
                     style="width: ${bubbleSize}px; height: ${bubbleSize}px;">
                  <span class="text-[7.5px] font-black text-slate-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]">${patientsCount}</span>
                </div>
                <div class="absolute top-[100%] mt-1 bg-slate-900 border border-slate-700 text-white font-sans text-[8px] font-bold px-1.5 rounded whitespace-nowrap pointer-events-none select-none z-20">
                  ${mun.name}
                </div>
              </div>
            `;
          } else if (mapStyleMode === 'capacity') {
            const localClinicsCount = Math.max(1, Math.round(mun.patientsScale * 1.5));
            markerHtml = `
              <div class="relative flex items-center justify-center font-mono">
                <div class="px-1.5 py-0.5 rounded bg-emerald-500 border border-emerald-355 text-white text-[8px] font-black shadow-md cursor-pointer transition-transform hover:scale-115 z-10">
                  🏥 ${localClinicsCount}
                </div>
                <div class="absolute top-[100%] mt-1 bg-slate-900 border border-slate-700 text-white font-sans text-[8px] px-1 rounded whitespace-nowrap pointer-events-none select-none z-20">
                  ${mun.name}
                </div>
              </div>
            `;
          }

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-leaflet-pin',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });

          const marker = L.marker(coords, { icon: customIcon });
          marker.on('click', () => {
            onSelectMunicipality(isMunSelected ? 'All' : mun.name);
          });
          marker.addTo(markersLayer);
        });
      }
    }

  }, [selectedProvince, mapStyleMode, provinceAlerts, provinceStats, selectedMunicipality, currentProvinceMunicipalities]);

  const activeProvinceLabel = selectedProvince === 'All' ? 'Angola (Nacional)' : selectedProvince;


  return (
    <div className="glass-panel-heavy rounded-2xl p-6 flex flex-col justify-between h-full min-h-[600px] border border-white/20 bg-white/20 relative">
      
      {/* Warning Toast Overlaid if unauthorized click occurs */}
      <AnimatePresence>
        {authWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 z-[999] bg-red-600/95 backdrop-blur-md text-white border border-red-500 rounded-xl p-3 shadow-2xl flex items-start gap-2 text-xs"
          >
            <ShieldAlert className="w-4 h-4 text-white shrink-0 mt-0.5 animate-bounce-subtle" />
            <div>
              <span className="font-extrabold uppercase tracking-wider block text-[10px]">Restrição de Acesso de Segurança</span>
              <p className="font-medium text-slate-100 mt-0.5">{authWarning}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#004a99]/10 text-[#004a99] rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Painel Interativo de Saúde de Angola</h3>
              <p className="text-[11px] text-slate-500 font-medium">Visualização geo-espacial e monitoramento epidemiológico oficial (MINSA)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Pill selector for Style Mode */}
            <div className="bg-slate-100/80 p-0.5 rounded-xl flex flex-wrap sm:flex-nowrap items-center gap-0.5 border border-slate-300/40 text-[10px] sm:text-[10.5px] font-bold shadow-3xs">
              <button
                onClick={() => setMapStyleMode('vector')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  mapStyleMode === 'vector'
                    ? 'bg-slate-900 text-white shadow-3xs font-extrabold'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-200/40'
                }`}
              >
                📍 Clínico
              </button>
              <button
                onClick={() => setMapStyleMode('heatmap')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  mapStyleMode === 'heatmap'
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white font-extrabold shadow-3xs'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-200/40'
                }`}
              >
                🔥 Calor
              </button>
              <button
                onClick={() => setMapStyleMode('bubbles')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  mapStyleMode === 'bubbles'
                    ? 'bg-sky-600 text-white font-extrabold shadow-3xs'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-200/40'
                }`}
              >
                🔵 Bolas
              </button>
              <button
                onClick={() => setMapStyleMode('capacity')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  mapStyleMode === 'capacity'
                    ? 'bg-teal-650 text-white font-extrabold shadow-3xs'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-200/40'
                }`}
              >
                🏥 Serviços
              </button>
            </div>

            {selectedProvince !== 'All' && canViewAll && (
              <button
                onClick={() => {
                  onSelectProvince('All');
                  onSelectMunicipality('All');
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#004a99] border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer h-[23px]"
              >
                <RefreshCw className="w-3 h-3 text-[#004a99]" />
                Nacional
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 mb-4 text-xs font-bold text-slate-600 bg-white/30 px-3 py-1.5 rounded-xl border border-white/20">
          <span 
            className="hover:text-[#004a99] cursor-pointer"
            onClick={() => {
              if (canViewAll) {
                onSelectProvince('All');
                onSelectMunicipality('All');
              }
            }}
          >
            Angola
          </span>
          {selectedProvince !== 'All' && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span 
                className="hover:text-[#004a99] cursor-pointer"
                onClick={() => onSelectMunicipality('All')}
              >
                {selectedProvince}
              </span>
            </>
          )}
          {selectedMunicipality !== 'All' && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-[#004a99] font-extrabold">{selectedMunicipality}</span>
            </>
          )}
        </div>

        {/* Threshold Legends */}
        <div className="flex flex-wrap gap-2 mb-4 text-[10px] font-mono font-bold">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/40 border border-white/30 rounded-md">
            <span className="w-2 h-2 rounded-full bg-[#004a99] border border-white block"></span>
            <span className="text-slate-600">Alinhamento Normal</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <span className="w-2 h-2 rounded-full bg-amber-500 block"></span>
            <span className="text-amber-700">Atenção Crítica</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md">
            <span className="w-2 h-2 rounded-full bg-red-500 block"></span>
            <span className="text-red-700">Foco Epidemiológico</span>
          </div>
          {selectedMunicipality !== 'All' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded-md">
              <span className="w-2 h-2 rounded-full bg-teal-500 block"></span>
              <span className="text-teal-700">Município Ativo</span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Leaflet Map Canvas */}
      <div className="grow min-h-[380px] w-full rounded-2xl overflow-hidden border border-white/30 shadow-inner relative my-2 z-10">
        <div 
          ref={mapContainerRef} 
          className="absolute inset-0 w-full h-full bg-slate-950" 
          id="map_container"
        />
      </div>

      <div className="bg-white/30 rounded-xl p-3 text-xs text-slate-600 border border-white/20 flex items-start gap-2 leading-relaxed shadow-xs mt-3">
        <Info className="w-4 h-4 text-[#004a99] shrink-0 mt-0.5" />
        <div>
          {selectedProvince === 'All' ? (
            <span>Arraste e aproxime o <strong className="text-slate-800 font-bold">mapa de Angola</strong>. Clique em qualquer marcador provincial para explorar a fundo a sua rede de distritos de saúde e áreas de cobertura.</span>
          ) : (
            <span>Visualização detalhada da província do <strong className="text-slate-800 font-bold">{selectedProvince}</strong>. Clique em qualquer ponto de saúde municipal para filtrar os gráficos e quadros analíticos.</span>
          )}
        </div>
      </div>
    </div>
  );
}
