import { useEffect, useMemo, useRef, useState } from 'react';
import type { StatisticsOverview } from '../server/statistics-service';

type Organization = StatisticsOverview['network']['organizations'][number];

export default function InstitutionHeatmap({ organizations }: { organizations: Organization[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const located = useMemo(
    () => organizations.filter((org) => Number.isFinite(Number(org.latitude)) && Number.isFinite(Number(org.longitude))),
    [organizations]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current || located.length === 0) return;
    let cancelled = false;
    let localMap: any = null;

    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      localMap = L.map(containerRef.current, {
        center: [-12.5, 17.5], zoom: 5, minZoom: 4, maxZoom: 14, scrollWheelZoom: true
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(localMap);
      mapRef.current = localMap;
      setMapReady(true);
      window.setTimeout(() => localMap?.invalidateSize(), 0);
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      if (localMap) localMap.remove();
      mapRef.current = null;
    };
  }, [located.length]);

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
          radius: 11, weight: 2, fillOpacity: 0.65
        }).bindPopup(
          `<strong>${org.name}</strong><br/>${org.facility_code || ''}<br/>${location || 'Localização administrativa não disponível'}`
        ).addTo(layer);
      });
      if (located.length === 1) map.setView([Number(located[0].latitude), Number(located[0].longitude)], 8);
      if (located.length > 1) {
        const bounds = L.latLngBounds(located.map((org) => [Number(org.latitude), Number(org.longitude)] as [number, number]));
        map.fitBounds(bounds.pad(0.3));
      }
      window.setTimeout(() => map.invalidateSize(), 0);
    });

    return () => { if (layer) layer.remove(); };
  }, [located, mapReady]);

  return (
    <section className="glass-panel overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">Cobertura OSIE</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Mapa da rede hospitalar</h2>
          <p className="mt-1 text-xs text-slate-500">Posições provenientes exclusivamente do registo institucional do Database Manager.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{located.length} de {organizations.length} georreferenciadas</span>
      </div>
      {located.length ? (
        <div ref={containerRef} className="h-[480px] w-full border-t border-slate-200 bg-slate-100" />
      ) : (
        <div className="m-5 flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
          Nenhuma instituição possui coordenadas válidas no registo OSIE.
        </div>
      )}
    </section>
  );
}
