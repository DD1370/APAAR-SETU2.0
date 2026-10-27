import { useMemo, useState } from 'react'
import type { Institution, Page, Role, Student } from '../types'
import { APAAR_RE, insert, log, MY_INST, remove, scope, update, useTable } from '../services/data'
import { Badge, Btn, Card, download, Field, Modal, Tbl } from '../components/ui'

export default function Students({ role }: { role: Role; go: (p: Page) => void }) {
  const { rows, reload } = useTable<Student>('students')
  const { rows: ins } = useTable<Institution>('institutions')
  const [q, setQ] = useState('')
  const [f, setF] = useState('All')
  const [sort, setSort] = useState<{ k: keyof Student; d: 1 | -1 }>({ k: 'name', d: 1 })
  const [sel, setSel] = useState<Student | null>(null)
  const [edit, setEdit] = useState<Partial<Student> | null>(null)
  const [err, setErr] = useState('')
  const instName = (id: string) => ins.find(i => i.id === id)?.code ?? '-'

  const view = useMemo(() => scope(role, rows)
    .filter(s => (f === 'All' || s.status === f) && `${s.name} ${s.apaar_id} ${s.program}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => String(a[sort.k]).localeCompare(String(b[sort.k])) * sort.d), [rows, role, q, f, sort])
  const th = (k: keyof Student, label: string) => <button onClick={() => setSort({ k, d: sort.k === k && sort.d === 1 ? -1 : 1 })}>{label}{sort.k === k ? (sort.d === 1 ? ' ▲' : ' ▼') : ''}</button>

  async function save() {
    const e = edit!
    if (!e.name || !e.program || !e.apaar_id) return setErr('Name, programme and APAAR ID are required.')
    if (!APAAR_RE.test(e.apaar_id)) return setErr('APAAR ID must be exactly 12 digits.')
    const body = { name: e.name, email: e.email ?? '', program: e.program, apaar_id: e.apaar_id, admission_year: Number(e.admission_year) || 2025, status: e.status ?? 'Pending', institution_id: e.institution_id ?? (role === 'institution' ? MY_INST : ins[0]?.id) }
    if (e.id) { await update('students', e.id, body); await log('EDIT', 'students', `Updated ${e.name}`) }
    else { await insert('students', [body]); await log('CREATE', 'students', `Added ${e.name}`) }
    setEdit(null); setErr(''); reload()
  }
  async function del(s: Student) {
    if (!confirm(`Delete ${s.name}?`)) return
    await remove('students', s.id); await log('DELETE', 'students', `Deleted ${s.name}`); setSel(null); reload()
  }
  const set = (k: keyof Student, v: string) => setEdit({ ...edit, [k]: v })

  return (
    <Card right={<div className="flex gap-2"><Btn v="g" onClick={() => download('students.csv', view)}>Export CSV</Btn><Btn onClick={() => { setErr(''); setEdit({ status: 'Pending', admission_year: 2025 }) }}>Add student</Btn></div>}>
      <div className="mb-3 flex flex-wrap gap-2">
        <input className="inp max-w-xs" placeholder="Search name, APAAR ID, programme" value={q} onChange={e => setQ(e.target.value)} />
        <select className="inp max-w-[10rem]" value={f} onChange={e => setF(e.target.value)}>{['All', 'Valid', 'Pending', 'Invalid'].map(x => <option key={x}>{x}</option>)}</select>
      </div>
      <Tbl empty={!view.length} head={[th('name', 'Name'), th('apaar_id', 'APAAR ID'), 'Institution', th('program', 'Programme'), th('status', 'Status'), '']}>
        {view.map(s => (
          <tr key={s.id}><td>{s.name}</td><td className="font-mono">{s.apaar_id}</td><td>{instName(s.institution_id)}</td><td>{s.program}</td><td><Badge s={s.status} /></td>
            <td className="text-right"><Btn v="g" onClick={() => setSel(s)}>Open</Btn></td></tr>
        ))}
      </Tbl>
      <Modal side open={!!sel} onClose={() => setSel(null)} title="Student record">
        {sel && <div className="space-y-2 text-sm">
          {Object.entries({ Name: sel.name, 'APAAR ID': sel.apaar_id, Email: sel.email || 'Missing', Programme: sel.program, 'Admission year': sel.admission_year, Institution: instName(sel.institution_id), Status: sel.status }).map(([k, v]) => <div key={k} className="flex justify-between border-b border-slate-100 py-1"><span className="text-slate-500">{k}</span><span>{String(v)}</span></div>)}
          <div className="flex gap-2 pt-3"><Btn onClick={() => { setErr(''); setEdit(sel); setSel(null) }}>Edit</Btn><Btn v="d" onClick={() => del(sel)}>Delete</Btn></div>
        </div>}
      </Modal>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit student' : 'Add student'}>
        {edit && <div className="space-y-3">
          <Field label="Full name"><input className="inp" value={edit.name ?? ''} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="APAAR ID (12 digits)"><input className="inp font-mono" value={edit.apaar_id ?? ''} onChange={e => set('apaar_id', e.target.value)} /></Field>
          <Field label="Email"><input className="inp" value={edit.email ?? ''} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Programme"><input className="inp" value={edit.program ?? ''} onChange={e => set('program', e.target.value)} /></Field>
          {role === 'aicte' && <Field label="Institution"><select className="inp" value={edit.institution_id ?? ins[0]?.id} onChange={e => set('institution_id', e.target.value)}>{ins.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>}
          <Field label="Status"><select className="inp" value={edit.status} onChange={e => set('status', e.target.value)}>{['Valid', 'Pending', 'Invalid'].map(x => <option key={x}>{x}</option>)}</select></Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2"><Btn v="g" onClick={() => setEdit(null)}>Cancel</Btn><Btn onClick={save}>Save record</Btn></div>
        </div>}
      </Modal>
    </Card>
  )
}
