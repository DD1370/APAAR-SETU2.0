import { useState } from 'react'
import type { Page, Role } from './types'
import { online } from './services/data'
import Overview from './pages/Overview'
import Students from './pages/Students'
import Upload from './pages/Upload'
import Validation from './pages/Validation'
import Monitoring from './pages/Monitoring'
import Verification from './pages/Verification'
import Reports from './pages/Reports'
import Certificate from './pages/Certificate'
import Audit from './pages/Audit'
import Settings from './pages/Settings'

const ROLES: Record<Role, string> = { aicte: 'AICTE Administrator', institution: 'Institution Administrator', verifier: 'Authorized Verifier' }
const ALL: Role[] = ['aicte', 'institution', 'verifier']
const NAV: { id: Page; label: string; roles: Role[] }[] = [
  { id: 'overview', label: 'Overview Dashboard', roles: ['aicte', 'institution'] },
  { id: 'students', label: 'Student Records', roles: ['aicte', 'institution'] },
  { id: 'upload', label: 'Bulk Data Upload', roles: ['institution', 'aicte'] },
  { id: 'validation', label: 'Validation Centre', roles: ['aicte', 'institution'] },
  { id: 'monitoring', label: 'Institution Monitoring', roles: ['aicte'] },
  { id: 'verification', label: 'Authorized Verification', roles: ALL },
  { id: 'reports', label: 'Reports & Analytics', roles: ['aicte', 'institution'] },
  { id: 'certificate', label: 'Certificate Verification', roles: ALL },
  { id: 'audit', label: 'Audit Logs', roles: ['aicte', 'institution'] },
  { id: 'settings', label: 'Settings & API', roles: ['aicte'] }
]

export default function App() {
  const [role, setRole] = useState<Role>('aicte')
  const [page, setPage] = useState<Page>('overview')
  const nav = NAV.filter(n => n.roles.includes(role))
  const current = nav.some(n => n.id === page) ? page : nav[0].id
  const go = (p: Page) => setPage(p)
  const P = { role, go }
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-navy-900 p-4 text-slate-200 md:w-64 md:shrink-0">
        <div className="font-display text-lg text-white">APAAR SETU</div>
        <div className="mb-4 text-xs text-teal-300">Student data verification for AICTE institutions</div>
        <label className="mb-1 block text-xs text-slate-400" htmlFor="role">Viewing as</label>
        <select id="role" value={role} onChange={e => setRole(e.target.value as Role)} className="mb-4 w-full rounded-lg border border-navy-700 bg-navy-800 px-2 py-2 text-sm text-white">
          {(Object.keys(ROLES) as Role[]).map(r => <option key={r} value={r}>{ROLES[r]}</option>)}
        </select>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {nav.map(n => (
            <button key={n.id} onClick={() => go(n.id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${current === n.id ? 'bg-teal-600 text-white' : 'hover:bg-navy-800'}`}>{n.label}</button>
          ))}
        </nav>
        <div className="mt-4 text-xs text-slate-400">{online ? 'Connected to Supabase' : 'Demo mode: in-memory data (add .env to connect Supabase)'}</div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <h1 className="mb-4 font-display text-xl text-navy-900">{nav.find(n => n.id === current)?.label}</h1>
        {current === 'overview' && <Overview {...P} />}
        {current === 'students' && <Students {...P} />}
        {current === 'upload' && <Upload {...P} />}
        {current === 'validation' && <Validation {...P} />}
        {current === 'monitoring' && <Monitoring {...P} />}
        {current === 'verification' && <Verification />}
        {current === 'reports' && <Reports {...P} />}
        {current === 'certificate' && <Certificate />}
        {current === 'audit' && <Audit />}
        {current === 'settings' && <Settings />}
      </main>
    </div>
  )
}
