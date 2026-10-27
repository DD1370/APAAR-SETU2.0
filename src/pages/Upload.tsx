import { useState } from 'react'
import Papa from 'papaparse'
import type { Institution, IssueType, Page, Role, Student } from '../types'
import { APAAR_RE, insert, log, MY_INST, useTable } from '../services/data'
import { Btn, Card, download, Field, Stat, Tbl } from '../components/ui'

type Row = Record<string, string>
const TEMPLATE = 'apaar_id,name,email,program\n900000000101,Asha Verma,asha@college.in,CSE\n900000000102,Ravi Kumar,ravi@college.in,ECE\n'
const STEPS = ['Select', 'Upload', 'Preview', 'Validate', 'Import']

export default function Upload({ role }: { role: Role; go: (p: Page) => void }) {
  const { rows: ins } = useTable<Institution>('institutions')
  const { rows: existing } = useTable<Student>('students')
  const [step, setStep] = useState(1)
  const [inst, setInst] = useState(role === 'institution' ? MY_INST : '')
  const [year, setYear] = useState(2025)
  const [rows, setRows] = useState<Row[]>([])
  const [res, setRes] = useState<{ ok: Row[]; bad: { row: Row; type: IssueType; detail: string }[]; over: number } | null>(null)
  const [done, setDone] = useState('')
  const target = ins.find(i => i.id === (inst || ins[0]?.id))

  function parse(file: File) {
    Papa.parse<Row>(file, { header: true, skipEmptyLines: true, transformHeader: h => h.trim().toLowerCase(), complete: r => { setRows(r.data); setStep(3) } })
  }
  function validate() {
    const seen = new Set(existing.map(s => s.apaar_id))
    const ok: Row[] = []; const bad: { row: Row; type: IssueType; detail: string }[] = []
    rows.forEach(r => {
      const id = (r.apaar_id ?? '').trim()
      if (!APAAR_RE.test(id)) bad.push({ row: r, type: 'invalid_apaar', detail: 'APAAR ID must be 12 digits' })
      else if (!r.name || !r.email || !r.program) bad.push({ row: r, type: 'missing_field', detail: 'Name, email or programme is missing' })
      else if (seen.has(id)) bad.push({ row: r, type: 'duplicate', detail: 'APAAR ID already exists or repeats in this file' })
      else { seen.add(id); ok.push(r) }
    })
    const enrolled = existing.filter(s => s.institution_id === target?.id).length
    setRes({ ok, bad, over: Math.max(0, enrolled + ok.length - (target?.approved_intake ?? Infinity)) })
    setStep(4)
  }
  async function commit() {
    if (!res || !target) return
    await insert('students', res.ok.map(r => ({ institution_id: target.id, apaar_id: r.apaar_id.trim(), name: r.name, email: r.email, program: r.program, admission_year: year, status: 'Valid' })))
    const issues = res.bad.map(b => ({ institution_id: target.id, student_ref: b.row.apaar_id || b.row.name || null, type: b.type, detail: b.detail }))
    if (res.over) issues.push({ institution_id: target.id, student_ref: null, type: 'intake', detail: `Enrolment exceeds approved intake by ${res.over}` })
    if (issues.length) await insert('validation_issues', issues)
    await log('IMPORT', 'students', `${res.ok.length} imported, ${res.bad.length} rejected for ${target.code} (${year})`)
    setDone(`${res.ok.length} records imported. ${issues.length} issues sent to the Validation Centre.`); setStep(5)
  }
  const counts = (t: IssueType) => res?.bad.filter(b => b.type === t).length ?? 0

  return (
    <Card title="Bulk student upload" right={<Btn v="g" onClick={() => download('apaar_template.csv', TEMPLATE)}>Download sample CSV</Btn>}>
      <ol className="mb-5 flex flex-wrap gap-2 text-sm">{STEPS.map((s, i) => <li key={s} className={`rounded-full px-3 py-1 ${step === i + 1 ? 'bg-teal-600 text-white' : step > i + 1 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>{i + 1}. {s}</li>)}</ol>
      {step === 1 && <div className="max-w-sm space-y-3">
        <Field label="Institution"><select className="inp" disabled={role === 'institution'} value={inst || ins[0]?.id} onChange={e => setInst(e.target.value)}>{ins.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>
        <Field label="Admission year"><input type="number" className="inp" value={year} onChange={e => setYear(+e.target.value)} /></Field>
        <Btn onClick={() => setStep(2)}>Continue</Btn></div>}
      {step === 2 && <div className="space-y-3"><p className="text-sm text-slate-600">Columns required: apaar_id, name, email, program.</p><input type="file" accept=".csv" onChange={e => e.target.files?.[0] && parse(e.target.files[0])} /></div>}
      {step === 3 && <div className="space-y-3"><p className="text-sm">{rows.length} rows read. Showing the first 10.</p>
        <Tbl head={['apaar_id', 'name', 'email', 'program']}>{rows.slice(0, 10).map((r, i) => <tr key={i}><td className="font-mono">{r.apaar_id}</td><td>{r.name}</td><td>{r.email}</td><td>{r.program}</td></tr>)}</Tbl>
        <div className="flex gap-2"><Btn v="g" onClick={() => setStep(2)}>Choose another file</Btn><Btn onClick={validate}>Run validation</Btn></div></div>}
      {step === 4 && res && <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Stat label="Valid rows" value={res.ok.length} /><Stat label="Invalid APAAR" value={counts('invalid_apaar')} /><Stat label="Missing fields" value={counts('missing_field')} /><Stat label="Duplicates" value={counts('duplicate')} /><Stat label="Over intake by" value={res.over} /></div>
        <div className="flex gap-2"><Btn v="g" onClick={() => setStep(3)}>Back</Btn><Btn disabled={!res.ok.length} onClick={commit}>Import {res.ok.length} valid records</Btn></div></div>}
      {step === 5 && <div className="space-y-3"><p className="text-sm text-emerald-700">{done}</p><Btn onClick={() => { setStep(1); setRows([]); setRes(null) }}>Start another upload</Btn></div>}
    </Card>
  )
}
