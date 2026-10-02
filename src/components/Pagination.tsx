import type { Dispatch, SetStateAction } from 'react';

type PaginationProps = {
  page: number;
  totalItems: number;
  onPageChange: Dispatch<SetStateAction<number>> | ((page: number) => void);
  pageSize?: number;
  label?: string;
};

export function paginate<T>(items: T[], page: number, pageSize = 10) {
  const safePage = Math.max(1, page);
  return items.slice((safePage - 1) * pageSize, safePage * pageSize);
}

export default function Pagination({ page, totalItems, onPageChange, pageSize = 10, label = 'registos' }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;
  const current = Math.min(Math.max(1, page), totalPages);
  const first = (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, totalItems);
  return <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-xs text-slate-500">A mostrar <strong>{first}-{last}</strong> de <strong>{totalItems}</strong> {label}</p>
    <div className="flex items-center gap-2">
      <button type="button" disabled={current===1} onClick={()=>onPageChange(current-1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
      <span className="min-w-24 text-center text-xs font-semibold text-slate-500">Página {current} de {totalPages}</span>
      <button type="button" disabled={current===totalPages} onClick={()=>onPageChange(current+1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Seguinte</button>
    </div>
  </div>;
}
