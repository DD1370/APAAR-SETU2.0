import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Role, Student, Issue, AuditLog, Institution, Credit, TableName } from '../types'

export const iid = (n: number) => `00000000-0000-0000-0000-00000000000${n}`
export const MY_INST = iid(1) // institution administrator is scoped to this institution in the demo
export const APAAR_RE = /^\d{12}$/
export const online = !!supabase

const day = (m: number) => new Date(Date.now() - m * 30 * 864e5).toISOString()
const names = ['Aarav Sharma', 'Priya Nair', 'Rohan Iyer', 'Meera Das', 'Kabir Singh', 'Ananya Rao', 'Vikram Patel', 'Sneha Reddy']
const progs = ['CSE', 'ECE', 'MECH', 'CIVIL']

const students: Student[] = Array.from({ length: 24 }, (_, i) => ({
  id: `s${i}`, institution_id: iid(1 + (i % 4)), apaar_id: i === 5 ? 'ABC123' : `9000000000${10 + i}`,
  name: names[i % 8], email: i === 9 ? '' : `student${i}@mail.in`, program: progs[i % 4], admission_year: 2025,
  status: (i === 5 ? 'Invalid' : i % 7 === 0 ? 'Pending' : 'Valid') as Student['status'], created_at: day(i % 6)
}))
const institutions: Institution[] = ([
  ['Anna Institute of Technology', 'AIT', 'Tamil Nadu', 120], ['Deccan College of Engineering', 'DCE', 'Telangana', 60],
  ['Western Polytechnic University', 'WPU', 'Maharashtra', 180], ['Eastern School of Engineering', 'ESE', 'West Bengal', 90]
] as [string, string, string, number][]).map(([name, code, state, approved_intake], i) => ({ id: iid(i + 1), name, code, state, approved_intake, created_at: day(12) }))

const mem: Record<TableName, any[]> = {
  institutions, students,
  abc_credits: students.slice(0, 6).map((s, i): Credit => ({ id: `c${i}`, student_id: s.id, semester: 1, credits: 22, created_at: day(1) })),
  audit_logs: [{ id: 'l1', action: 'IMPORT', entity: 'students', details: 'Seed import of 24 records', actor: 'system', created_at: day(1) }] as AuditLog[],
  validation_issues: [
    { id: 'v1', institution_id: iid(2), student_ref: 'ABC123', type: 'invalid_apaar', detail: 'APAAR ID must be 12 digits', status: 'open', resolution_note: null, created_at: day(0) },
    { id: 'v2', institution_id: iid(2), student_ref: 'student9@mail.in', type: 'missing_field', detail: 'Email is missing', status: 'open', resolution_note: null, created_at: day(0) },
    { id: 'v3', institution_id: iid(3), student_ref: '900000000012', type: 'duplicate', detail: 'APAAR ID appears twice in the same batch', status: 'open', resolution_note: null, created_at: day(0) },
    { id: 'v4', institution_id: iid(1), student_ref: null, type: 'intake', detail: 'Enrolment exceeds approved intake', status: 'open', resolution_note: null, created_at: day(0) }
  ] as Issue[]
}

export async function list<R>(t: TableName): Promise<R[]> {
  if (supabase) {
    const { data, error } = await supabase.from(t).select('*').order('created_at', { ascending: false })
    if (!error && data) return data as R[]
    console.warn(`[supabase] ${t} unavailable, using demo data:`, error?.message)
  }
  return [...mem[t]] as R[]
}
export async function insert(t: TableName, rows: Record<string, unknown>[]) {
  if (supabase) {
    const { error } = await supabase.from(t).insert(rows)
    if (!error) return
    console.warn(`[supabase] insert ${t} failed, using demo data:`, error.message)
  }
  mem[t].unshift(...rows.map(r => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r })))
}
export async function update(t: TableName, id: string, patch: Record<string, unknown>) {
  if (supabase) {
    const { error } = await supabase.from(t).update(patch).eq('id', id)
    if (!error) return
    console.warn(`[supabase] update ${t} failed, using demo data:`, error.message)
  }
  mem[t] = mem[t].map(r => (r.id === id ? { ...r, ...patch } : r))
}
export async function remove(t: TableName, id: string) {
  if (supabase) {
    const { error } = await supabase.from(t).delete().eq('id', id)
    if (!error) return
  }
  mem[t] = mem[t].filter(r => r.id !== id)
}
export const log = (action: string, entity: string, details: string, actor = 'demo_user') =>
  insert('audit_logs', [{ action, entity, details, actor }])

export function useTable<R>(t: TableName) {
  const [rows, setRows] = useState<R[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => { setLoading(true); setRows(await list<R>(t)); setLoading(false) }, [t])
  useEffect(() => { reload() }, [reload])
  return { rows, loading, reload }
}
export const scope = <R extends { institution_id: string }>(role: Role, rows: R[]) =>
  role === 'institution' ? rows.filter(r => r.institution_id === MY_INST) : rows
export const monthly = (rows: { created_at: string }[]) => {
  const m: Record<string, number> = {}
  rows.forEach(r => { const k = r.created_at.slice(0, 7); m[k] = (m[k] || 0) + 1 })
  return Object.entries(m).sort().map(([month, records]) => ({ month, records }))
}
export const mask = (s: string) => (s.length > 4 ? 'X'.repeat(s.length - 4) + s.slice(-4) : s)
export const maskName = (n: string) => n.split(' ').map(p => p[0] + '*'.repeat(Math.max(p.length - 1, 2))).join(' ')
