-- APAAR SETU schema for Supabase (run in SQL Editor)
create extension if not exists "pgcrypto";

create table if not exists institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  state text not null,
  approved_intake int not null check (approved_intake >= 0),
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  apaar_id text not null,
  name text not null,
  email text,
  program text not null,
  admission_year int not null,
  status text not null default 'Pending' check (status in ('Valid','Pending','Invalid')),
  created_at timestamptz not null default now()
);
create index if not exists idx_students_inst on students(institution_id);
create index if not exists idx_students_apaar on students(apaar_id);

create table if not exists abc_credits (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  semester int not null,
  credits numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_credits_student on abc_credits(student_id);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity text not null,
  details text,
  actor text not null default 'system',
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on audit_logs(created_at desc);

create table if not exists validation_issues (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  student_ref text,
  type text not null check (type in ('missing_field','invalid_apaar','duplicate','intake')),
  detail text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  resolution_note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_issues_inst_status on validation_issues(institution_id, status);

-- Row Level Security. DEMO POLICIES allow the anon key full access.
-- Before production: replace with policies keyed on auth.uid() / a profiles table with roles.
alter table institutions enable row level security;
alter table students enable row level security;
alter table abc_credits enable row level security;
alter table audit_logs enable row level security;
alter table validation_issues enable row level security;
do $$ declare t text; begin
  foreach t in array array['institutions','students','abc_credits','audit_logs','validation_issues'] loop
    execute format('drop policy if exists demo_all on %I', t);
    execute format('create policy demo_all on %I for all using (true) with check (true)', t);
  end loop;
end $$;

-- Seed data
insert into institutions (id, name, code, state, approved_intake) values
 ('00000000-0000-0000-0000-000000000001','Anna Institute of Technology','AIT','Tamil Nadu',120),
 ('00000000-0000-0000-0000-000000000002','Deccan College of Engineering','DCE','Telangana',60),
 ('00000000-0000-0000-0000-000000000003','Western Polytechnic University','WPU','Maharashtra',180),
 ('00000000-0000-0000-0000-000000000004','Eastern School of Engineering','ESE','West Bengal',90)
on conflict do nothing;

insert into students (institution_id, apaar_id, name, email, program, admission_year, status, created_at)
select ('00000000-0000-0000-0000-00000000000' || (1 + i % 4))::uuid,
       case when i = 5 then 'ABC123' else '9000000000' || (10 + i) end,
       (array['Aarav Sharma','Priya Nair','Rohan Iyer','Meera Das','Kabir Singh','Ananya Rao','Vikram Patel','Sneha Reddy'])[1 + i % 8],
       case when i = 9 then '' else 'student' || i || '@mail.in' end,
       (array['CSE','ECE','MECH','CIVIL'])[1 + i % 4], 2025,
       case when i = 5 then 'Invalid' when i % 7 = 0 then 'Pending' else 'Valid' end,
       now() - ((i % 6) * interval '30 days')
from generate_series(0, 23) as i;

insert into abc_credits (student_id, semester, credits)
select id, 1, 22 from students limit 6;

insert into validation_issues (institution_id, student_ref, type, detail) values
 ('00000000-0000-0000-0000-000000000002','ABC123','invalid_apaar','APAAR ID must be 12 digits'),
 ('00000000-0000-0000-0000-000000000002','student9@mail.in','missing_field','Email is missing'),
 ('00000000-0000-0000-0000-000000000003','900000000012','duplicate','APAAR ID appears twice in the same batch'),
 ('00000000-0000-0000-0000-000000000001',null,'intake','Enrolment exceeds approved intake');

insert into audit_logs (action, entity, details, actor) values
 ('IMPORT','students','Seed import of 24 records','system'),
 ('RESOLVE','validation_issues','Seed issue review','aicte_admin');
