import { useEffect, useMemo, useRef, useState } from 'react';
import type { StatisticsOverview } from '../server/statistics-service';

type Organization = StatisticsOverview['network']['organizations'][number];
type TerritorialRow = StatisticsOverview['territorial_epidemiology'][number];
type ProvinceInfo = { name: string; capital?: string; municipalities: string[]; communes?: number };
type MapMode = 'network' | 'epidemiology' | 'quality';

const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const text = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char] || char));

export default function InstitutionHeatmap({ organizations, territorial = [], compact = false }: { organizations: Organization[]; territorial?: TerritorialRow[]; compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const provinceLayerRef = useRef<any>(null);
  const [selected, setSelected] = useState<ProvinceInfo | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mode, setMode] = useState<MapMode>('network');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const located = useMemo(() => organizations.filter((org) => Number.isFinite(Number(org.latitude)) && Number.isFinite(Number(org.longitude))), [organizations]);
  const conditionOptions = useMemo(() => Array.from(new Set(territorial.map((row) => row.condition).filter(Boolean))).sort(), [territorial]);
  const provinceMetrics = useMemo(() => {
    const map = new Map<string, { records: number; institutions: number; located: number }>();
    territorial.forEach((row) => {
      if (conditionFilter !== 'all' && normalize(row.condition) !== normalize(conditionFilter)) return;
      const key = normalize(row.province);
      if (!key) return;
      const current = map.get(key) || { records: 0, institutions: 0, located: 0 };
      current.records += Number(row.count || 0);
      map.set(key, current);
    });
    organizations.forEach((org) => {
      const key = normalize(org.province);
      if (!key) return;
      const current = map.get(key) || { records: 0, institutions: 0, located: 0 };
      current.institutions += 1;
      if (Number.isFinite(Number(org.latitude)) && Number.isFinite(Number(org.longitude))) current.located += 1;
      map.set(key, current);
    });
    return map;
  }, [organizations, territorial, conditionFilter]);
  const maxRecords = useMemo(() => Math.max(1, ...Array.from(provinceMetrics.values()).map((value) => value.records)), [provinceMetrics]);
  const fillForProvince = (name: string) => {
    const metric = provinceMetrics.get(normalize(name)) || { records: 0, institutions: 0, located: 0 };
    if (mode === 'quality') {
      if (!metric.institutions) return '#e2e8f0';
      const ratio = metric.located / metric.institutions;
      return ratio >= 1 ? '#86efac' : ratio >= 0.5 ? '#fde68a' : '#fca5a5';
    }
    if (mode === 'epidemiology') {
      const ratio = metric.records / maxRecords;
      if (!metric.records) return '#e2e8f0';
      if (ratio >= 0.75) return '#1d4ed8';
      if (ratio >= 0.5) return '#3b82f6';
      if (ratio >= 0.25) return '#93c5fd';
      return '#dbeafe';
    }
    return metric.institutions ? '#bfdbfe' : '#e2e8f0';
  };

  const selectedOrganizations = useMemo(() => selected ? organizations.filter((org) => normalize(org.province) === normalize(selected.name)) : [], [organizations, selected]);
  const selectedTerritorial = useMemo(() => selected ? territorial.filter((row) => normalize(row.province) === normalize(selected.name)) : [], [territorial, selected]);
  const municipalityCount = selected ? selected.municipalities.length : 0;
  const clinicalRecords = selectedTerritorial.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const conditions = useMemo(() => {
    const totals = new Map<string, number>();
    selectedTerritorial.forEach((row) => totals.set(row.condition, (totals.get(row.condition) || 0) + Number(row.count || 0)));
    return Array.from(totals.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [selectedTerritorial]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let localMap: any = null;

    void import('leaflet').then(async ({ default: L }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      localMap = L.map(containerRef.current, { center: [-12.5, 17.5], zoom: 5, minZoom: 5, maxZoom: 11, scrollWheelZoom: true, attributionControl: false });
      mapRef.current = localMap;

      try {
        const response = await fetch('/maps/angola-provinces.geojson');
        if (!response.ok) throw new Error('province_geometry_unavailable');
        const geojson = await response.json();
        if (cancelled || !mapRef.current) return;

        const layer = L.geoJSON(geojson, {
          style: (feature: any) => ({ color: '#ffffff', weight: 1.5, fillColor: fillForProvince(String(feature?.properties?.PROVINCIA || '')), fillOpacity: 1 }),
          onEachFeature: (feature: any, provinceLayer: any) => {
            const props = feature?.properties || {};
            const info: ProvinceInfo = { name: String(props.PROVINCIA || 'Província'), capital: props.SEDE || undefined, municipalities: Array.isArray(props.MUNICIPIOS) ? props.MUNICIPIOS : [], communes: Number(props.N_COMUNAS || 0) };
            provinceLayer.bindTooltip(text(info.name), { permanent: false, sticky: true, direction: 'top', opacity: 0.96, className: 'osie-map-hover-label' });
            provinceLayer.on({
              mouseover: () => { provinceLayer.setStyle({ weight: 2.5, fillOpacity: 0.86 }); provinceLayer.bringToFront?.(); },
              mouseout: () => { if (normalize(selected?.name) !== normalize(info.name)) provinceLayer.setStyle({ fillColor: fillForProvince(info.name), weight: 1.5, fillOpacity: 1 }); },
              click: () => {
                setSelected(info);
                layer.eachLayer((item: any) => item.setStyle?.({ fillColor: fillForProvince(String(item.feature?.properties?.PROVINCIA || '')), weight: 1.5, fillOpacity: 1 }));
                provinceLayer.setStyle({ fillColor: '#60a5fa' });
                localMap.fitBounds(provinceLayer.getBounds(), { padding: [20, 20], maxZoom: 7 });
              },
            });
          },
        }).addTo(localMap);

        provinceLayerRef.current = layer;
        const bounds = layer.getBounds();
        localMap.fitBounds(bounds, { padding: [10, 10] });
        localMap.setMaxBounds(bounds.pad(0.08));
        localMap.options.maxBoundsViscosity = 1;
        setMapError(false);

        located.forEach((org) => {
          const location = [org.municipality, org.province].filter(Boolean).join(', ');
          L.circleMarker([Number(org.latitude), Number(org.longitude)], { radius: compact ? 5 : 7, weight: 2, color: '#065f46', fillColor: '#10b981', fillOpacity: 1 })
            .bindPopup(`<strong>${text(org.name)}</strong><br/>${text(org.facility_code)}<br/>${text(location || 'Localização não disponível')}`)
            .addTo(localMap);
        });
      } catch {
        setMapError(true);
      }
    });

    return () => { cancelled = true; if (localMap) localMap.remove(); mapRef.current = null; provinceLayerRef.current = null; };
  }, [compact, located, mode, conditionFilter, provinceMetrics, maxRecords]);

  const resetMap = () => {
    const map = mapRef.current;
    const layer = provinceLayerRef.current;
    if (!map || !layer) return;
    setSelected(null);
    layer.eachLayer((item: any) => item.setStyle?.({ fillColor: fillForProvince(String(item.feature?.properties?.PROVINCIA || '')), weight: 1.5, fillOpacity: 1 }));
    map.fitBounds(layer.getBounds(), { padding: [10, 10] });
  };

  if (compact) return <section className="glass-panel overflow-hidden rounded-2xl"><div ref={containerRef} className="h-[280px] w-full bg-slate-50" />{mapError ? <p className="p-3 text-xs text-amber-700">Mapa administrativo temporariamente indisponível.</p> : null}</section>;

  return <section className="glass-panel overflow-hidden rounded-2xl">
    <div className="border-b border-slate-200 p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004a99]">Centro de situação territorial</p><h2 className="mt-1 text-lg font-bold text-slate-900">Angola · Rede e indicadores OSIE</h2><p className="mt-1 text-xs text-slate-500">Explore a rede, a distribuição epidemiológica agregada e a qualidade da georreferenciação.</p></div><div className="flex flex-wrap gap-2">{([['network','Rede hospitalar'],['epidemiology','Epidemiologia'],['quality','Qualidade dos dados']] as [MapMode,string][]).map(([value,label]) => <button key={value} onClick={()=>setMode(value)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${mode===value?'bg-[#004a99] text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>)}</div></div>{mode==='epidemiology' ? <div className="mt-4 flex flex-wrap items-center gap-3"><label className="text-xs font-semibold text-slate-500">Condição</label><select value={conditionFilter} onChange={(event)=>setConditionFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="all">Todas as condições</option>{conditionOptions.map((condition)=><option key={condition} value={condition}>{condition}</option>)}</select><span className="text-xs text-slate-400">Cor mais intensa = maior número de registos agregados.</span></div> : null}{mode==='quality' ? <p className="mt-3 text-xs text-slate-500">Verde: todas as instituições da província georreferenciadas · amarelo: cobertura parcial · vermelho: cobertura baixa · cinzento: sem instituição registada.</p> : null}</div>
    <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,.7fr)]">
      <div className="relative min-h-[460px] bg-slate-50"><div ref={containerRef} className="absolute inset-0" />{mapError ? <div className="absolute inset-x-4 bottom-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Mapa administrativo temporariamente indisponível.</div> : null}</div>
      <aside className="border-t border-slate-200 bg-white p-5 lg:border-l lg:border-t-0">
        {selected ? <div className="space-y-5">
          <div><button onClick={resetMap} className="mb-3 text-xs font-semibold text-[#004a99] hover:underline">← Ver Angola</button><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Província selecionada</p><h3 className="mt-1 text-2xl font-bold text-slate-900">{selected.name}</h3>{selected.capital ? <p className="text-sm text-slate-500">Sede: {selected.capital}</p> : null}</div>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Municípios</p><strong className="text-xl">{municipalityCount}</strong></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Instituições OSIE</p><strong className="text-xl">{selectedOrganizations.length}</strong></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Registos clínicos</p><strong className="text-xl">{clinicalRecords || '—'}</strong></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Comunas</p><strong className="text-xl">{selected.communes || '—'}</strong></div></div>
          <div><h4 className="text-sm font-bold text-slate-800">Condições mais registadas</h4><div className="mt-2 space-y-2">{conditions.length ? conditions.map((row) => <div key={row.label} className="flex justify-between border-b border-slate-100 py-1 text-sm"><span>{row.label}</span><strong>{row.count}</strong></div>) : <p className="text-xs text-slate-500">Sem dados clínicos territorializados para esta província.</p>}</div></div>
          <div><h4 className="text-sm font-bold text-slate-800">Instituições na província</h4><div className="mt-2 space-y-2">{selectedOrganizations.length ? selectedOrganizations.slice(0,6).map((org)=><div key={org.id} className="rounded-xl border border-slate-100 p-2"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-700">{org.name}</span><span className="text-[10px] uppercase text-slate-400">{org.status || '—'}</span></div><p className="mt-1 text-[11px] text-slate-400">{org.facility_code || 'Sem código'} · {org.municipality || 'Município não informado'}</p></div>) : <p className="text-xs text-slate-500">Sem instituições OSIE registadas nesta província.</p>}</div></div><div><h4 className="text-sm font-bold text-slate-800">Municípios</h4><div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-auto">{selected.municipalities.map((name) => <span key={name} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{name}</span>)}</div></div>
        </div> : <div className="flex h-full min-h-72 flex-col items-center justify-center text-center"><p className="text-sm font-semibold text-slate-700">Selecione uma província</p><p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">O painel mostrará instituições OSIE, municípios e dados epidemiológicos reais disponíveis para o território selecionado.</p></div>}
      </aside>
    </div>
  </section>;
}
