import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Institution, Page, Role, Student } from '../types'
import { useTable } from '../services/data'
import { Btn, Card, COLORS, Tbl } from '../components/ui'

export default function Monitoring(_: { role: Role; go: (p: Page) => void }) {
  const { rows: ins } = useTable<Institution>('institutions')
  const { rows: st } = useTable<Student>('students')
  const [sel, setSel] = useState<Institution | null>(null)
  const data = ins.map(i => { const n = st.filter(s => s.institution_id === i.id).length; return { ...i, n, pct: Math.round((n / i.approved_intake) * 100) } })
  const progs = sel ? Object.entries(st.filter(s => s.institution_id === sel.id).reduce<Record<string, number>>((a, s) => ({ ...a, [s.program]: (a[s.program] || 0) + 1 }), {})).map(([program, students]) => ({ program, students })) : []
  return (
    <div className="space-y-4">
      <Card title="Approved intake vs actual enrolment">
        <Tbl head={['Institution', 'State', 'Approved intake', 'Enrolled', 'Utilisation', '']}>
          {data.map(d => <tr key={d.id}><td>{d.name}</td><td>{d.state}</td><td>{d.approved_intake}</td><td>{d.n}</td>
            <td><span className={d.pct > 100 ? 'font-medium text-red-600' : ''}>{d.pct}%{d.pct > 100 && ' (over ceiling)'}</span></td><td><Btn v="g" onClick={() => setSel(d)}>Details</Btn></td></tr>)}
        </Tbl>
      </Card>
      {sel && <Card title={`${sel.name}: enrolment by programme`} right={<Btn v="g" onClick={() => setSel(null)}>Close</Btn>}>
        <p className="mb-2 text-sm text-slate-600">{sel.state}. Approved intake {sel.approved_intake}.</p>
        <ResponsiveContainer height={220}><BarChart data={progs}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="program" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="students" fill={COLORS[0]} /></BarChart></ResponsiveContainer>
      </Card>}
    </div>
  )
}
