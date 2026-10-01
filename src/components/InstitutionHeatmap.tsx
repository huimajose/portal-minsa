import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import type { StatisticsOverview } from '../server/statistics-service';

type Organization = StatisticsOverview['network']['organizations'][number];

export default function InstitutionHeatmap({ organizations }: { organizations: Organization[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const located = useMemo(
    () => organizations.filter((org) => Number.isFinite(org.latitude) && Number.isFinite(org.longitude)),
    [organizations]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-12.5, 17.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 14,
      scrollWheelZoom: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    for (const org of located) {
      const lat = Number(org.latitude);
      const lng = Number(org.longitude);
      const location = [org.neighborhood, org.municipality, org.province].filter(Boolean).join(', ');
      L.circleMarker([lat, lng], {
        radius: 12,
        weight: 2,
        fillOpacity: 0.55
      }).bindPopup(
        `<strong>${org.name}</strong><br/>${org.facility_code || ''}<br/>${location || 'Localização administrativa não disponível'}`
      ).addTo(layer);
    }
    if (located.length === 1) map.setView([Number(located[0].latitude), Number(located[0].longitude)], 8);
    if (located.length > 1) {
      const bounds = L.latLngBounds(located.map((org) => [Number(org.latitude), Number(org.longitude)] as [number, number]));
      map.fitBounds(bounds.pad(0.35));
    }
    return () => { layer.remove(); };
  }, [located]);

  return (
    <section className="glass-panel rounded-2xl p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-800">Mapa institucional OSIE</h2>
          <p className="mt-1 text-xs text-slate-500">Apenas instituições com coordenadas reais registadas no Database Manager são desenhadas.</p>
        </div>
        <span className="text-xs font-semibold text-slate-500">{located.length} de {organizations.length} instituições georreferenciadas</span>
      </div>
      {located.length ? (
        <div ref={containerRef} className="mt-4 h-[420px] w-full overflow-hidden rounded-xl border border-slate-200" />
      ) : (
        <div className="mt-4 flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
          Ainda não existem coordenadas institucionais no registo OSIE. O mapa será preenchido automaticamente após a migration e o cadastro das localizações.
        </div>
      )}
    </section>
  );
}
