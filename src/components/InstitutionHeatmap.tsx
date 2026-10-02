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
  const markerLayerRef = useRef<any>(null);
  const selectedProvinceRef = useRef<string | null>(null);
  const [selected, setSelected] = useState<ProvinceInfo | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mode, setMode] = useState<MapMode>('network');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [presentationMode, setPresentationMode] = useState(false);
  useEffect(() => { selectedProvinceRef.current = selected?.name || null; }, [selected]);
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
  const territorialRecords = useMemo(() => Array.from(provinceMetrics.values()).reduce((sum, value) => sum + value.records, 0), [provinceMetrics]);
  const provincesWithClinicalData = useMemo(() => Array.from(provinceMetrics.values()).filter((value) => value.records > 0).length, [provinceMetrics]);
  const provincesWithInstitutions = useMemo(() => Array.from(provinceMetrics.values()).filter((value) => value.institutions > 0).length, [provinceMetrics]);
  const institutionsMissingCoordinates = Math.max(0, organizations.length - located.length);
  const provinceRanking = useMemo(() => Array.from(provinceMetrics.entries()).map(([key, metric]) => ({ key, name: organizations.find((org) => normalize(org.province) === key)?.province || territorial.find((row) => normalize(row.province) === key)?.province || key, ...metric })).filter((row) => row.records > 0).sort((a, b) => b.records - a.records).slice(0, 5), [provinceMetrics, organizations, territorial]);
  const municipalityRanking = useMemo(() => {
    if (!selected) return [];
    const totals = new Map<string, number>();
    territorial.filter((row) => normalize(row.province) === normalize(selected.name)).forEach((row) => {
      if (!row.municipality || (conditionFilter !== 'all' && normalize(row.condition) !== normalize(conditionFilter))) return;
      totals.set(row.municipality, (totals.get(row.municipality) || 0) + Number(row.count || 0));
    });
    return Array.from(totals.entries()).map(([name, records]) => ({ name, records })).sort((a,b)=>b.records-a.records).slice(0,5);
  }, [selected, territorial, conditionFilter]);
  const searchResults = useMemo(() => {
    const q = normalize(searchQuery);
    if (q.length < 2) return [];
    const rows: { type: 'province'|'municipality'|'institution'; label: string; province: string; municipality?: string | null }[] = [];
    const provinces = new Set<string>();
    organizations.forEach((org) => org.province && provinces.add(org.province));
    territorial.forEach((row) => row.province && provinces.add(row.province));
    provinces.forEach((province) => { if (normalize(province).includes(q)) rows.push({ type:'province', label:province, province }); });
    organizations.forEach((org) => {
      if (org.municipality && normalize(org.municipality).includes(q)) rows.push({ type:'municipality', label:org.municipality, province:org.province || '', municipality:org.municipality });
      if (normalize(org.name).includes(q) || normalize(org.facility_code).includes(q)) rows.push({ type:'institution', label:org.name, province:org.province || '', municipality:org.municipality });
    });
    territorial.forEach((row) => { if (row.municipality && normalize(row.municipality).includes(q)) rows.push({ type:'municipality', label:row.municipality, province:row.province || '', municipality:row.municipality }); });
    return rows.filter((row,index,self)=>self.findIndex((x)=>x.type===row.type&&normalize(x.label)===normalize(row.label)&&normalize(x.province)===normalize(row.province))===index).slice(0,8);
  }, [searchQuery, organizations, territorial]);

  const selectProvinceByName = (provinceName: string, municipality?: string | null) => {
    const layer = provinceLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    let match: any = null;
    layer.eachLayer((item:any) => { if (normalize(item.feature?.properties?.PROVINCIA) === normalize(provinceName)) match = item; });
    if (!match) return;
    const props = match.feature?.properties || {};
    setSelected({ name:String(props.PROVINCIA || provinceName), capital:props.SEDE || undefined, municipalities:Array.isArray(props.MUNICIPIOS)?props.MUNICIPIOS:[], communes:Number(props.N_COMUNAS||0) });
    setSelectedMunicipality(municipality || null);
    map.fitBounds(match.getBounds(), { padding:[20,20], maxZoom:7 });
    setSearchQuery('');
  };

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

  const selectedOrganizations = useMemo(() => selected ? organizations.filter((org) => normalize(org.province) === normalize(selected.name) && (!selectedMunicipality || normalize(org.municipality) === normalize(selectedMunicipality))) : [], [organizations, selected, selectedMunicipality]);
  const selectedTerritorial = useMemo(() => selected ? territorial.filter((row) => normalize(row.province) === normalize(selected.name) && (!selectedMunicipality || normalize(row.municipality) === normalize(selectedMunicipality))) : [], [territorial, selected, selectedMunicipality]);
  const availableMunicipalities = useMemo(() => {
    if (!selected) return [];
    const names = new Set<string>();
    selected.municipalities.forEach((name) => name && names.add(name));
    organizations.filter((org) => normalize(org.province) === normalize(selected.name)).forEach((org) => org.municipality && names.add(org.municipality));
    territorial.filter((row) => normalize(row.province) === normalize(selected.name)).forEach((row) => row.municipality && names.add(row.municipality));
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt'));
  }, [selected, organizations, territorial]);
  const municipalityCount = availableMunicipalities.length;
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
      localMap = L.map(containerRef.current, { center: [-12.5, 17.5], zoom: 5, minZoom: 5, maxZoom: 11, scrollWheelZoom: true, attributionControl: false, zoomControl: true });
      containerRef.current.style.background = 'radial-gradient(circle at 34% 42%, #f8fbff 0%, #e8f3fb 42%, #d7eaf6 72%, #c7e0ee 100%)';
      L.control.scale({ imperial: false, position: 'bottomleft', maxWidth: 120 }).addTo(localMap);
      const north = new L.Control({ position: 'topright' });
      north.onAdd = () => { const el = L.DomUtil.create('div', 'osie-map-north'); el.innerHTML = '<span>▲</span><strong>N</strong>'; el.title = 'Norte'; return el; };
      north.addTo(localMap);
      mapRef.current = localMap;

      try {
        const response = await fetch('/maps/angola-provinces.geojson');
        if (!response.ok) throw new Error('province_geometry_unavailable');
        const geojson = await response.json();
        if (cancelled || !mapRef.current) return;

        const layer = L.geoJSON(geojson, {
          style: (feature: any) => ({ color: '#f8fafc', weight: 1.8, fillColor: fillForProvince(String(feature?.properties?.PROVINCIA || '')), fillOpacity: 0.94, opacity: 1 }),
          onEachFeature: (feature: any, provinceLayer: any) => {
            const props = feature?.properties || {};
            const info: ProvinceInfo = { name: String(props.PROVINCIA || 'Província'), capital: props.SEDE || undefined, municipalities: Array.isArray(props.MUNICIPIOS) ? props.MUNICIPIOS : [], communes: Number(props.N_COMUNAS || 0) };
            const metric = provinceMetrics.get(normalize(info.name)) || { records:0, institutions:0, located:0 };
            const provinceRows = territorial.filter((row) => normalize(row.province) === normalize(info.name));
            const top = new Map<string,number>();
            provinceRows.forEach((row)=>top.set(row.condition,(top.get(row.condition)||0)+Number(row.count||0)));
            const topCondition = Array.from(top.entries()).sort((a,b)=>b[1]-a[1])[0];
            provinceLayer.bindTooltip(`<div class="osie-rich-tooltip"><strong>${text(info.name)}</strong><span>${metric.institutions} instituições OSIE</span><span>${metric.records} registos territorializados</span>${topCondition?`<span>Principal condição: ${text(topCondition[0])} (${topCondition[1]})</span>`:''}</div>`, { permanent: false, sticky: true, direction: 'top', opacity: 0.98, className: 'osie-map-hover-label' });
            provinceLayer.on({
              mouseover: () => { provinceLayer.setStyle({ weight: 3, color: '#0f4c81', fillOpacity: 0.9 }); provinceLayer.bringToFront?.(); },
              mouseout: () => { const isSelected = normalize(selectedProvinceRef.current) === normalize(info.name); provinceLayer.setStyle({ fillColor: isSelected ? '#60a5fa' : fillForProvince(info.name), color: '#f8fafc', weight: isSelected ? 2.5 : 1.8, fillOpacity: 0.94 }); },
              click: () => {
                setSelected(info);
                setSelectedMunicipality(null);
                layer.eachLayer((item: any) => item.setStyle?.({ fillColor: fillForProvince(String(item.feature?.properties?.PROVINCIA || '')), weight: 1.5, fillOpacity: 1 }));
                provinceLayer.setStyle({ fillColor: '#60a5fa', color: '#0f4c81', weight: 2.5, fillOpacity: 0.96 });
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
          const marker = L.circleMarker([Number(org.latitude), Number(org.longitude)], { radius: compact ? 5 : 7, weight: 3, color: '#ffffff', fillColor: '#059669', fillOpacity: 1 })
            .bindPopup(`<strong>${text(org.name)}</strong><br/>${text(org.facility_code)}<br/>${text(location || 'Localização não disponível')}`)
            .addTo(localMap);
          (marker as any).__osieOrg = org;
        });
      } catch {
        setMapError(true);
      }
    });

    return () => { cancelled = true; if (localMap) localMap.remove(); mapRef.current = null; provinceLayerRef.current = null; markerLayerRef.current = null; };
  }, [compact, located]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.eachLayer((item: any) => {
      const org = item.__osieOrg as Organization | undefined;
      if (!org || !item.setStyle) return;
      const provinceSelected = Boolean(selected && normalize(org.province) === normalize(selected.name));
      const municipalitySelected = Boolean(selectedMunicipality && normalize(org.municipality) === normalize(selectedMunicipality));
      const active = municipalitySelected || (provinceSelected && !selectedMunicipality);
      item.setStyle({ radius: active ? (compact ? 7 : 10) : (compact ? 5 : 7), weight: active ? 4 : 3, color: active ? '#7c3aed' : '#ffffff', fillColor: active ? '#f59e0b' : '#059669', fillOpacity: 1 });
      if (active) item.bringToFront?.();
    });
  }, [selected, selectedMunicipality, compact, located]);

  useEffect(() => {
    const layer = provinceLayerRef.current;
    if (!layer) return;
    layer.eachLayer((item: any) => {
      const name = String(item.feature?.properties?.PROVINCIA || '');
      item.setStyle?.({ fillColor: normalize(selected?.name) === normalize(name) ? '#60a5fa' : fillForProvince(name), weight: normalize(selected?.name) === normalize(name) ? 2 : 1.5, fillOpacity: 1 });
    });
  }, [mode, conditionFilter, provinceMetrics, maxRecords, selected]);

  const resetMap = () => {
    const map = mapRef.current;
    const layer = provinceLayerRef.current;
    if (!map || !layer) return;
    setSelected(null);
    setSelectedMunicipality(null);
    layer.eachLayer((item: any) => item.setStyle?.({ fillColor: fillForProvince(String(item.feature?.properties?.PROVINCIA || '')), weight: 1.5, fillOpacity: 1 }));
    map.fitBounds(layer.getBounds(), { padding: [10, 10] });
  };

  if (compact) return <section className="glass-panel overflow-hidden rounded-2xl"><div ref={containerRef} className="h-[280px] w-full bg-[#d7eaf6]" />{mapError ? <p className="p-3 text-xs text-amber-700">Mapa administrativo temporariamente indisponível.</p> : null}</section>;

  return <section className="glass-panel overflow-hidden rounded-2xl">
    <div className={`border-b border-slate-200 p-5 ${presentationMode?'bg-slate-950 text-white':''}`}><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className={`text-xs font-bold uppercase tracking-[0.16em] ${presentationMode?'text-sky-300':'text-[#004a99]'}`}>Centro de situação territorial</p><h2 className={`mt-1 text-lg font-bold ${presentationMode?'text-white':'text-slate-900'}`}>Angola · Rede e indicadores OSIE</h2><p className={`mt-1 text-xs ${presentationMode?'text-slate-300':'text-slate-500'}`}></p></div><div className="flex flex-wrap gap-2"><button onClick={()=>setPresentationMode((value)=>!value)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${presentationMode?'bg-white text-slate-900':'bg-slate-900 text-white'}`}>{presentationMode?'Sair da apresentação':'Modo apresentação'}</button>{([['network','Rede hospitalar'],['epidemiology','Epidemiologia'],['quality','Qualidade dos dados']] as [MapMode,string][]).map(([value,label]) => <button key={value} onClick={()=>setMode(value)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${mode===value?'bg-[#004a99] text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>)}</div></div>{mode==='epidemiology' ? <div className="mt-4 flex flex-wrap items-center gap-3"><label className="text-xs font-semibold text-slate-500">Condição</label><select value={conditionFilter} onChange={(event)=>setConditionFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="all">Todas as condições</option>{conditionOptions.map((condition)=><option key={condition} value={condition}>{condition}</option>)}</select></div> : null}<div className="relative mt-4 max-w-xl"><input value={searchQuery} onChange={(event)=>setSearchQuery(event.target.value)} placeholder="Pesquisar província, município ou instituição..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-[#004a99]" />{searchResults.length ? <div className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">{searchResults.map((row)=><button key={`${row.type}-${row.province}-${row.label}`} onClick={()=>selectProvinceByName(row.province,row.type==='province'?null:row.municipality)} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50"><span className="font-semibold text-slate-700">{row.label}</span><span className="text-[10px] uppercase text-slate-400">{row.type} · {row.province}</span></button>)}</div>:null}</div><div className="mt-4 flex flex-wrap gap-2 text-xs">{mode==='network' ? <><span className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">{organizations.length} instituições registadas</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{provincesWithInstitutions} províncias com cobertura OSIE</span></> : null}{mode==='epidemiology' ? <>{territorialRecords > 0 ? <><span className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">{territorialRecords} registos agregados</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{provincesWithClinicalData} províncias com dados</span></> : <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">Sem registos territorializados para o filtro atual. O mapa não inventa distribuição clínica.</span>}</> : null}{mode==='quality' ? <><span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">{located.length} georreferenciadas</span><span className={`rounded-full px-3 py-1.5 ${institutionsMissingCoordinates ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{institutionsMissingCoordinates} sem coordenadas</span></> : null}</div></div>
    <div className={presentationMode?'grid min-h-[72vh] lg:grid-cols-[minmax(0,2fr)_minmax(320px,.62fr)]':'grid lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,.7fr)]'}>
      <div className="relative min-h-[520px] bg-[#d7eaf6]"><div ref={containerRef} className="absolute inset-0" />{mapError ? <div className="absolute inset-x-4 bottom-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Mapa administrativo temporariamente indisponível.</div> : null}</div>
      <aside className="border-t border-slate-200 bg-white p-5 lg:border-l lg:border-t-0">
        {selected ? <div className="space-y-5">
          <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Território selecionado</p><h3 className="mt-1 text-2xl font-bold text-slate-900">{selected.name}</h3>{selectedMunicipality ? <div className="mt-2 flex items-center gap-2"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">Município: {selectedMunicipality}</span><button onClick={()=>setSelectedMunicipality(null)} className="text-xs font-semibold text-[#004a99] hover:underline">Ver toda a província</button></div> : null}{selected.capital ? <p className="text-sm text-slate-500">Sede: {selected.capital}</p> : null}</div>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Municípios</p><strong className="text-xl">{municipalityCount}</strong></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Instituições OSIE</p><strong className="text-xl">{selectedOrganizations.length}</strong></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Registos clínicos</p><strong className="text-xl">{clinicalRecords || '—'}</strong></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Comunas</p><strong className="text-xl">{selected.communes || '—'}</strong></div></div>
          <div><h4 className="text-sm font-bold text-slate-800">Ranking territorial</h4><div className="mt-2 space-y-1.5">{(selected?municipalityRanking:provinceRanking).length ? (selected?municipalityRanking:provinceRanking).map((row:any,index)=><button key={row.name} onClick={()=>selected?setSelectedMunicipality(row.name):selectProvinceByName(row.name)} className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 text-xs hover:bg-slate-100"><span><strong className="mr-2 text-slate-400">{index+1}.</strong>{row.name}</span><strong>{row.records}</strong></button>) : <p className="text-xs text-slate-500">Sem registos territorializados para ranking.</p>}</div></div><div><h4 className="text-sm font-bold text-slate-800">Condições mais registadas</h4><div className="mt-2 space-y-2">{conditions.length ? conditions.map((row) => <div key={row.label} className="flex justify-between border-b border-slate-100 py-1 text-sm"><span>{row.label}</span><strong>{row.count}</strong></div>) : <p className="text-xs text-slate-500">Sem dados clínicos territorializados para esta província.</p>}</div></div>
          <div><h4 className="text-sm font-bold text-slate-800">Instituições na província</h4><div className="mt-2 space-y-2">{selectedOrganizations.length ? selectedOrganizations.slice(0,6).map((org)=><div key={org.id} className="rounded-xl border border-slate-100 p-2"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-700">{org.name}</span><span className="text-[10px] uppercase text-slate-400">{org.status || '—'}</span></div><p className="mt-1 text-[11px] text-slate-400">{org.facility_code || 'Sem código'} · {org.municipality || 'Município não informado'}</p></div>) : <p className="text-xs text-slate-500">Sem instituições OSIE registadas nesta província.</p>}</div></div><div><h4 className="text-sm font-bold text-slate-800">Municípios</h4><div className="mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-auto">{availableMunicipalities.map((name) => <button key={name} onClick={()=>setSelectedMunicipality(normalize(selectedMunicipality)===normalize(name)?null:name)} className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${normalize(selectedMunicipality)===normalize(name)?'bg-violet-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{name}</button>)}</div></div>
        </div> : <div className="flex h-full min-h-72 items-center justify-center text-center"><p className="text-sm font-semibold text-slate-500">Selecione uma província</p></div>}
      </aside>
    </div><footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-5 py-3 text-[11px] text-slate-500"><span><strong className="text-slate-700">Fonte:</strong> OSIE · {organizations.length} instituições · {territorialRecords} registos territorializados</span></footer>
  </section>;
}
