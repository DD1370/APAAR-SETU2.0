import { useState } from 'react'
import type { Institution, Issue, IssueType, Page, Role } from '../types'
import { log, scope, update, useTable } from '../services/data'
import { Badge, Btn, Card, fmt, Modal, Tbl } from '../components/ui'

const TABS: [IssueType, string][] = [['missing_field', 'Missing fields'], ['invalid_apaar', 'Invalid APAAR format'], ['duplicate', 'Duplicates'], ['intake', 'Intake discrepancies']]

export default function Validation({ role }: { role: Role; go: (p: Page) => void }) {
  const { rows, reload } = useTable<Issue>('validation_issues')
  const { rows: ins } = useTable<Institution>('institutions')
  const [tab, setTab] = useState<IssueType>('missing_field')
  const [sel, setSel] = useState<Issue | null>(null)
  const [note, setNote] = useState('')
  const mine = scope(role, rows)
  const view = mine.filter(i => i.type === tab)

  async function resolve() {
    if (!sel || !note.trim()) return
    await update('validation_issues', sel.id, { status: 'resolved', resolution_note: note.trim() })
    await log('RESOLVE', 'validation_issues', `${sel.type}: ${note.trim()}`)
    setSel(null); setNote(''); reload()
  }
  return (
    <Card>
      <div className="mb-3 flex flex-wrap gap-2">{TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 text-sm ${tab === k ? 'bg-navy-900 text-white' : 'bg-slate-100'}`}>{l} ({mine.filter(i => i.type === k && i.status === 'open').length})</button>)}</div>
      <Tbl empty={!view.length} head={['Institution', 'Reference', 'Issue', 'Status', 'Raised', '']}>
        {view.map(i => <tr key={i.id}><td>{ins.find(x => x.id === i.institution_id)?.code}</td><td className="font-mono">{i.student_ref ?? '-'}</td><td>{i.detail}{i.resolution_note && <div className="text-xs text-slate-500">Note: {i.resolution_note}</div>}</td><td><Badge s={i.status} /></td><td>{fmt(i.created_at)}</td>
          <td>{i.status === 'open' && <Btn v="g" onClick={() => setSel(i)}>Resolve</Btn>}</td></tr>)}
      </Tbl>
      <Modal open={!!sel} onClose={() => setSel(null)} title="Resolve issue">
        <p className="mb-2 text-sm">{sel?.detail}</p>
        <textarea className="inp mb-3" rows={3} placeholder="Describe how this was resolved (required)" value={note} onChange={e => setNote(e.target.value)} />
        <div className="flex justify-end gap-2"><Btn v="g" onClick={() => setSel(null)}>Cancel</Btn><Btn disabled={!note.trim()} onClick={resolve}>Mark resolved</Btn></div>
      </Modal>
    </Card>
  )
}
