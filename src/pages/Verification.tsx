import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Institution, Student } from '../types'
import { list, log, mask, maskName } from '../services/data'
import { Badge, Btn, Card } from '../components/ui'

export default function Verification() {
  const [q, setQ] = useState('')
  const [res, setRes] = useState<{ s: Student; inst?: Institution } | null | undefined>()
  async function search() {
    const term = q.trim()
    if (!term) return
    let s: Student | undefined
    if (supabase) {
      const { data } = await supabase.from('students').select('*').or(`apaar_id.eq.${term.replace(/[^\w-]/g, '')},id.eq.${/^[0-9a-f-]{36}$/i.test(term) ? term : '00000000-0000-0000-0000-000000000000'}`).limit(1)
      s = data?.[0]
    }
    if (!s) s = (await list<Student>('students')).find(x => x.apaar_id === term || x.id === term)
    const inst = s ? (await list<Institution>('institutions')).find(i => i.id === s!.institution_id) : undefined
    setRes(s ? { s, inst } : null)
    await log('VERIFY', 'students', `Lookup ${mask(term)}: ${s ? 'found' : 'not found'}`, 'verifier')
  }
  return (
    <Card title="Look up a student">
      <div className="flex max-w-xl gap-2"><input className="inp" placeholder="APAAR ID or student reference" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} /><Btn onClick={search}>Verify</Btn></div>
      {res === null && <p className="mt-4 text-sm text-red-600">No record matches that ID. Check the number and try again.</p>}
      {res && <dl className="mt-4 grid max-w-xl grid-cols-2 gap-2 rounded-lg bg-slate-50 p-4 text-sm">
        <dt className="text-slate-500">Name</dt><dd>{maskName(res.s.name)}</dd>
        <dt className="text-slate-500">APAAR ID</dt><dd className="font-mono">{mask(res.s.apaar_id)}</dd>
        <dt className="text-slate-500">Institution</dt><dd>{res.inst?.name}</dd>
        <dt className="text-slate-500">Programme</dt><dd>{res.s.program}</dd>
        <dt className="text-slate-500">Status</dt><dd><Badge s={res.s.status} /></dd>
      </dl>}
      <p className="mt-4 text-xs text-slate-500">Personal data is masked. Every lookup is written to the audit log.</p>
    </Card>
  )
}
