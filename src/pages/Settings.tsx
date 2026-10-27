import { useState } from 'react'
import { online } from '../services/data'
import { Card } from '../components/ui'

const API = [['GET', '/rest/v1/students?apaar_id=eq.{id}', 'Look up a student by APAAR ID'], ['POST', '/rest/v1/students', 'Insert records (bulk batch supported)'], ['PATCH', '/rest/v1/validation_issues?id=eq.{id}', 'Resolve an issue'], ['POST', '/functions/v1/apaar-verify', 'Conceptual: live APAAR/ABC registry check']]
const CHECKS = ['Replace demo RLS policies with role-based policies', 'Enable Supabase Auth and email verification', 'Keep the service-role key out of the frontend', 'Mask personal data in verifier responses', 'Rotate keys and review audit logs monthly', 'Enforce HTTPS and restrict CORS origins']

export default function Settings() {
  const [done, setDone] = useState<Set<number>>(new Set())
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Supabase connection">
        <p className="mb-2 text-sm">Status: <b className={online ? 'text-emerald-700' : 'text-amber-700'}>{online ? 'Connected' : 'Demo mode'}</b></p>
        <p className="text-sm">URL: <code>{url ?? 'VITE_SUPABASE_URL not set'}</code></p>
        <p className="text-sm">Anon key: <code>{online ? '•••••• (set)' : 'VITE_SUPABASE_ANON_KEY not set'}</code></p>
        <p className="mt-2 text-xs text-slate-500">Credentials are read from .env at build time. Copy .env.example to .env, then restart the dev server.</p>
      </Card>
      <Card title="Security and privacy checklist"><ul className="space-y-2 text-sm">{CHECKS.map((c, i) => <li key={c}><label className="flex gap-2"><input type="checkbox" checked={done.has(i)} onChange={() => setDone(new Set(done.has(i) ? [...done].filter(x => x !== i) : [...done, i]))} />{c}</label></li>)}</ul></Card>
      <div className="lg:col-span-2"><Card title="API endpoints"><div className="space-y-1 text-sm">{API.map(([m, p, d]) => <div key={p}><code className="rounded bg-slate-100 px-1">{m} {p}</code> <span className="text-slate-500">{d}</span></div>)}</div></Card></div>
    </div>
  )
}
