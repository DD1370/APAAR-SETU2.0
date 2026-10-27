import { useState } from 'react'
import type { Credit, Institution, Student } from '../types'
import { list, log, mask } from '../services/data'
import { Btn, Card, fmt } from '../components/ui'

export default function Certificate() {
  const [ref, setRef] = useState('')
  const [out, setOut] = useState<{ s: Student; inst?: Institution; credits: number; at: string } | null | undefined>()
  async function check() {
    const s = (await list<Student>('students')).find(x => x.apaar_id === ref.trim())
    if (!s) { setOut(null); return }
    const inst = (await list<Institution>('institutions')).find(i => i.id === s.institution_id)
    const credits = (await list<Credit>('abc_credits')).filter(c => c.student_id === s.id).reduce((a, c) => a + Number(c.credits), 0)
    const at = new Date().toISOString()
    setOut({ s, inst, credits, at }); await log('CERT_VERIFY', 'abc_credits', `Certificate check ${mask(s.apaar_id)}`, 'verifier')
  }
  return (
    <Card title="Verify a certificate">
      <div className="flex max-w-xl gap-2"><input className="inp" placeholder="Enter APAAR ID (try 900000000010)" value={ref} onChange={e => setRef(e.target.value)} /><Btn onClick={check}>Check certificate</Btn></div>
      {out === null && <p className="mt-4 text-sm text-red-600">No certificate found for this APAAR ID.</p>}
      {out && <div className="mt-4 max-w-xl rounded-lg border-4 border-double border-navy-800 bg-white p-6 text-center">
        <div className="font-display text-navy-900">Academic Bank of Credits: Credit Statement</div>
        <p className="mt-3 text-sm">This certifies that <b>{out.s.name}</b> ({mask(out.s.apaar_id)}) of {out.inst?.name} is enrolled in {out.s.program} and holds <b>{out.credits}</b> credits.</p>
        <p className="mt-4 text-xs text-teal-700">Verified on {fmt(out.at)}. Sample document for demonstration.</p>
      </div>}
    </Card>
  )
}
