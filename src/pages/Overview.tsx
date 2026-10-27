import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AuditLog, Institution, Issue, Page, Role, Student } from '../types'
import { monthly, scope, useTable } from '../services/data'
import { Btn, Card, COLORS, fmt, Modal, Stat } from '../components/ui'

const TOUR: { page: Page; text: string }[] = [
  { page: 'overview', text: 'Start here: totals, intake vs enrolment and open alerts.' },
  { page: 'upload', text: 'Institutions upload a CSV in five steps: choose, upload, preview, validate, import.' },
  { page: 'validation', text: 'Reviewers resolve flagged rows with a note that is written to the audit log.' },
  { page: 'monitoring', text: 'AICTE compares approved intake with actual enrolment per institution.' },
  { page: 'verification', text: 'Authorized verifiers look up a student and see masked details only.' },
  { page: 'audit', text: 'Every import, edit and resolution is recorded here.' }
]

export default function Overview({ role, go }: { role: Role; go: (p: Page) => void }) {
  const { rows: ins } = useTable<Institution>('institutions')
  const { rows: all } = useTable<Student>('students')
  const { rows: iss0 } = useTable<Issue>('validation_issues')
  const { rows: logs } = useTable<AuditLog>('audit_logs')
  const [step, setStep] = useState<number | null>(null)
  const st = scope(role, all)
  const iss = scope(role, iss0).filter(i => i.status === 'open')
  const insScoped = role === 'institution' ? ins.filter(i => scope(role, [{ institution_id: i.id }]).length) : ins
  const bar = insScoped.map(i => ({ name: i.code, Intake: i.approved_intake, Enrolled: all.filter(s => s.institution_id === i.id).length }))
  const pie = ['Valid', 'Pending', 'Invalid'].map(n => ({ name: n, value: st.filter(s => s.status === n).length }))
  const over = bar.filter(b => b.Enrolled > b.Intake)
  const t = step !== null ? TOUR[step] : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Students" value={st.length} />
        <Stat label="Institutions" value={insScoped.length} />
        <Stat label="Open issues" value={iss.length} />
        <Stat label="Validated" value={`${st.length ? Math.round((pie[0].value / st.length) * 100) : 0}%`} />
      </div>
      <div className="flex justify-end"><Btn onClick={() => { setStep(0); go(TOUR[0].page) }}>Launch interactive workflow</Btn></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Enrolment vs approved intake"><ResponsiveContainer height={240}><BarChart data={bar}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Intake" fill={COLORS[1]} /><Bar dataKey="Enrolled" fill={COLORS[0]} /></BarChart></ResponsiveContainer></Card>
        <Card title="Validation status"><ResponsiveContainer height={240}><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>{pie.map((_, i) => <Cell key={i} fill={['#14b8a6', '#f59e0b', '#ef4444'][i]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></Card>
        <Card title="Monthly record trend"><ResponsiveContainer height={220}><LineChart data={monthly(st)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Line dataKey="records" stroke={COLORS[0]} strokeWidth={2} /></LineChart></ResponsiveContainer></Card>
        <div className="space-y-4">
          <Card title="Alerts">
            <ul className="space-y-1 text-sm">
              {over.map(o => <li key={o.name} className="text-red-700">{o.name}: enrolment {o.Enrolled} exceeds intake {o.Intake}</li>)}
              {iss.slice(0, 3).map(i => <li key={i.id} className="text-amber-700">{i.type.replace('_', ' ')}: {i.detail}</li>)}
              {!over.length && !iss.length && <li className="text-slate-500">No alerts. All records are within limits.</li>}
            </ul>
          </Card>
          <Card title="Recent activity"><ul className="space-y-1 text-sm">{logs.slice(0, 4).map(l => <li key={l.id}><b>{l.action}</b> {l.entity}: {l.details} <span className="text-slate-400">({fmt(l.created_at)})</span></li>)}</ul></Card>
        </div>
      </div>
      <Modal open={!!t} onClose={() => setStep(null)} title={`Workflow tour: step ${(step ?? 0) + 1} of ${TOUR.length}`}>
        <p className="mb-4 text-sm">{t?.text}</p>
        <div className="flex justify-between">
          <Btn v="g" onClick={() => setStep(null)}>End tour</Btn>
          <Btn onClick={() => { const n = (step ?? 0) + 1; if (n >= TOUR.length) setStep(null); else { setStep(n); go(TOUR[n].page) } }}>{(step ?? 0) + 1 >= TOUR.length ? 'Finish' : 'Next step'}</Btn>
        </div>
      </Modal>
    </div>
  )
}
