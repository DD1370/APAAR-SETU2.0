import type { AuditLog } from '../types'
import { useTable } from '../services/data'
import { Card, fmt, Tbl } from '../components/ui'

export default function Audit() {
  const { rows } = useTable<AuditLog>('audit_logs')
  return (
    <Card title="Event history, newest first">
      <Tbl empty={!rows.length} head={['Time', 'Action', 'Entity', 'Details', 'Actor']}>
        {rows.map(l => <tr key={l.id}><td className="whitespace-nowrap">{fmt(l.created_at)}</td><td className="font-medium">{l.action}</td><td>{l.entity}</td><td>{l.details}</td><td>{l.actor}</td></tr>)}
      </Tbl>
    </Card>
  )
}
