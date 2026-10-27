import { ButtonHTMLAttributes, ReactNode } from 'react'
import Papa from 'papaparse'

export const COLORS = ['#0e7490', '#0b1f3a', '#14b8a6', '#f59e0b', '#ef4444']

export const Card = ({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4">
    {title && <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-display text-sm text-navy-900">{title}</h3>{right}</div>}
    {children}
  </section>
)
export const Btn = ({ v = 'p', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { v?: 'p' | 'g' | 'd' }) => (
  <button {...p} className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40 ${v === 'p' ? 'bg-teal-600 text-white hover:bg-teal-700' : v === 'd' ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-slate-300 bg-white hover:bg-slate-100'} ${className}`} />
)
const tone: Record<string, string> = { Valid: 'bg-emerald-100 text-emerald-800', resolved: 'bg-emerald-100 text-emerald-800', Pending: 'bg-amber-100 text-amber-800', open: 'bg-amber-100 text-amber-800', Invalid: 'bg-red-100 text-red-800' }
export const Badge = ({ s }: { s: string }) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[s] || 'bg-slate-100 text-slate-700'}`}>{s}</span>
export const Stat = ({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">{label}</div><div className="font-display text-2xl text-navy-900">{value}</div>{hint && <div className="text-xs text-slate-500">{hint}</div>}</div>
)
export const Modal = ({ open, onClose, title, children, side }: { open: boolean; onClose: () => void; title: string; children: ReactNode; side?: boolean }) => !open ? null : (
  <div className={`fixed inset-0 z-50 flex bg-navy-950/50 ${side ? 'justify-end' : 'items-center justify-center p-4'}`} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} className={`overflow-auto bg-white p-5 shadow-xl ${side ? 'h-full w-full max-w-md' : 'max-h-full w-full max-w-lg rounded-lg'}`}>
      <div className="mb-4 flex justify-between"><h3 className="font-display text-navy-900">{title}</h3><button onClick={onClose} aria-label="Close" className="text-slate-500">✕</button></div>
      {children}
    </div>
  </div>
)
export const Tbl = ({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) => (
  <div className="overflow-x-auto"><table className="w-full text-left text-sm">
    <thead className="border-b border-slate-200 text-slate-500"><tr>{head.map((h, i) => <th key={i} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
    <tbody className="[&>tr]:border-b [&>tr]:border-slate-100 [&_td]:px-2 [&_td]:py-2">{children}</tbody>
  </table>{empty && <p className="p-4 text-center text-sm text-slate-500">No records match. Adjust the filters or add a record.</p>}</div>
)
export const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="block text-sm"><span className="mb-1 block text-slate-600">{label}</span>{children}</label>

export function download(name: string, rows: object[] | string, mime = 'text/csv') {
  const text = typeof rows === 'string' ? rows : Papa.unparse(rows)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: mime }))
  a.download = name; a.click()
}
export const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
