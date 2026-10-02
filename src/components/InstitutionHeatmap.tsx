import { useEffect, useMemo, useRef, useState } from 'react';
import type { StatisticsOverview } from '../server/statistics-service';

type Organization = StatisticsOverview['network']['organizations'][number];

const text = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char] || char));

export default function InstitutionHeatmap({ organizations, compact = false }: { organizations: Organization[]; compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const located = useMemo(() => organizations.filter((org) => Number.isFinite(Number(org.latitude)) && Number.isFinite(Number(org.longitude))), [organizations]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || located.length === 0) return;
    let cancelled = false;
    let localMap: any = null;
    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      localMap = L.map(containerRef.current, { center: [-12.5,17.5], zoom: 5, minZoom: 4, maxZoom: 15, scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(localMap);
      mapRef.current = localMap;
      setMapReady(true);
      window.setTimeout(() => localMap?.invalidateSize(), 0);
    });
    return () => { cancelled = true; setMapReady(false); if (localMap) localMap.remove(); mapRef.current = null; };
  }, [located.length]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    let layer: any = null;
    const map = mapRef.current;
    void import('leaflet').then(({ default: L }) => {
      if (!mapRef.current) return;
      layer = L.layerGroup().addTo(map);
      located.forEach((org) => {
        const location = [org.neighborhood,org.municipality,org.province].filter(Boolean).join(', ');
        L.circleMarker([Number(org.latitude),Number(org.longitude)], { radius: compact ? 8 : 11, weight: 2, fillOpacity: .7 })
          .bindPopup(`<strong>${text(org.name)}</strong><br/>${text(org.facility_code)}<br/>${text(location || 'Localização não disponível')}`)
          .addTo(layer);
      });
      if (located.length === 1) map.setView([Number(located[0].latitude),Number(located[0].longitude)], 8);
      if (located.length > 1) map.fitBounds(L.latLngBounds(located.map((org) => [Number(org.latitude),Number(org.longitude)] as [number,number])).pad(.3));
      window.setTimeout(() => map.invalidateSize(), 0);
    });
    return () => { if (layer) layer.remove(); };
  }, [located,mapReady,compact]);

  return <section className="glass-panel overflow-hidden rounded-2xl">
    {!compact && <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">Cobertura nacional</p><h2 className="mt-1 text-lg font-bold text-slate-900">Mapa da rede hospitalar</h2><p className="mt-1 text-xs text-slate-500">Explore as instituições por localização.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{located.length} de {organizations.length} georreferenciadas</span></div>}
    {located.length ? <div ref={containerRef} className={`${compact?'h-[300px]':'h-[560px]'} w-full ${compact?'':'border-t border-slate-200'} bg-slate-100`} /> : <div className="m-5 flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">Ainda não existem instituições georreferenciadas.</div>}
  </section>;
}
