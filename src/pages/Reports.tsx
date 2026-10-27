import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Institution, Issue, Page, Role, Student } from '../types'
import { log, scope, useTable } from '../services/data'
import { Btn, Card, COLORS, download } from '../components/ui'

export default function Reports({ role }: { role: Role; go: (p: Page) => void }) {
  const { rows: ins0 } = useTable<Institution>('institutions')
  const { rows: st0 } = useTable<Student>('students')
  const { rows: is0 } = useTable<Issue>('validation_issues')
  const st = scope(role, st0), iss = scope(role, is0)
  const ins = role === 'institution' ? ins0.filter(i => scope(role, [{ institution_id: i.id }]).length) : ins0
  const enrol = ins.map(i => ({ institution: i.code, programmes: new Set(st.filter(s => s.institution_id === i.id).map(s => s.program)).size, intake: i.approved_intake, enrolled: st.filter(s => s.institution_id === i.id).length }))
  const errs = ['missing_field', 'invalid_apaar', 'duplicate', 'intake'].map(t => ({ type: t.replace('_', ' '), Open: iss.filter(i => i.type === t && i.status === 'open').length, Resolved: iss.filter(i => i.type === t && i.status === 'resolved').length }))
  const exp = async (name: string, rows: object[]) => { download(name, rows); await log('EXPORT', 'reports', name) }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Intake vs actual" right={<Btn v="g" onClick={() => exp('enrolment_report.csv', enrol)}>Export CSV</Btn>}>
        <ResponsiveContainer height={260}><BarChart data={enrol}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="institution" /><YAxis /><Tooltip /><Legend /><Bar dataKey="intake" fill={COLORS[1]} /><Bar dataKey="enrolled" fill={COLORS[0]} /></BarChart></ResponsiveContainer>
      </Card>
      <Card title="Error summary" right={<Btn v="g" onClick={() => exp('error_summary.csv', errs)}>Export CSV</Btn>}>
        <ResponsiveContainer height={260}><BarChart data={errs}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="type" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="Open" stackId="a" fill={COLORS[4]} /><Bar dataKey="Resolved" stackId="a" fill={COLORS[2]} /></BarChart></ResponsiveContainer>
      </Card>
    </div>
  )
}
