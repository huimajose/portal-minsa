import { useEffect, useMemo, useRef, useState } from 'react';
import type { StatisticsOverview } from '../server/statistics-service';

type Organization = StatisticsOverview['network']['organizations'][number];

const ANGOLA_GEOJSON_URL = 'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09592ced973a3448cf66b6100b741b64c0d/releaseData/gbOpen/AGO/ADM0/geoBoundaries-AGO-ADM0_simplified.geojson';
const text = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char] || char));

export default function InstitutionHeatmap({ organizations, compact = false }: { organizations: Organization[]; compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [boundaryError, setBoundaryError] = useState(false);
  const located = useMemo(() => organizations.filter((org) => Number.isFinite(Number(org.latitude)) && Number.isFinite(Number(org.longitude))), [organizations]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let localMap: any = null;

    void import('leaflet').then(async ({ default: L }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      localMap = L.map(containerRef.current, {
        center: [-12.5, 17.5],
        zoom: 5,
        minZoom: 5,
        maxZoom: 12,
        scrollWheelZoom: true,
        attributionControl: false,
        zoomControl: true,
      });
      mapRef.current = localMap;

      try {
        const response = await fetch(ANGOLA_GEOJSON_URL);
        if (!response.ok) throw new Error('boundary_unavailable');
        const geojson = await response.json();
        if (cancelled || !mapRef.current) return;

        const angolaLayer = L.geoJSON(geojson, {
          style: {
            color: '#004a99',
            weight: 2,
            opacity: 0.9,
            fillColor: '#e8f1fb',
            fillOpacity: 1,
          },
        }).addTo(localMap);

        const bounds = angolaLayer.getBounds();
        localMap.fitBounds(bounds, { padding: [14, 14] });
        localMap.setMaxBounds(bounds.pad(0.04));
        localMap.options.maxBoundsViscosity = 1;
        setBoundaryError(false);
      } catch {
        setBoundaryError(true);
        localMap.setView([-12.5, 17.5], 5);
      }

      setMapReady(true);
      window.setTimeout(() => localMap?.invalidateSize(), 0);
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      if (localMap) localMap.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    let layer: any = null;
    const map = mapRef.current;

    void import('leaflet').then(({ default: L }) => {
      if (!mapRef.current) return;
      layer = L.layerGroup().addTo(map);
      located.forEach((org) => {
        const location = [org.neighborhood, org.municipality, org.province].filter(Boolean).join(', ');
        L.circleMarker([Number(org.latitude), Number(org.longitude)], {
          radius: compact ? 7 : 9,
          weight: 2,
          color: '#004a99',
          fillColor: '#ffffff',
          fillOpacity: 1,
        })
          .bindPopup(`<strong>${text(org.name)}</strong><br/>${text(org.facility_code)}<br/>${text(location || 'Localização não disponível')}`)
          .addTo(layer);
      });
    });

    return () => { if (layer) layer.remove(); };
  }, [located, mapReady, compact]);

  return <section className="glass-panel overflow-hidden rounded-2xl">
    {!compact && <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">Cobertura nacional</p><h2 className="mt-1 text-lg font-bold text-slate-900">Mapa da rede hospitalar</h2><p className="mt-1 text-xs text-slate-500">Instituições OSIE georreferenciadas em Angola.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{located.length} de {organizations.length} georreferenciadas</span></div>}
    <div className="relative">
      <div ref={containerRef} className={`${compact ? 'h-[260px]' : 'h-[300px] sm:h-[360px]'} w-full ${compact ? '' : 'border-t border-slate-200'} bg-slate-50`} />
      {boundaryError ? <div className="absolute inset-x-4 bottom-4 rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs text-amber-800">Não foi possível carregar o contorno geográfico de Angola.</div> : null}
    </div>
  </section>;
}
