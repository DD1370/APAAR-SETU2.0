export type Role = 'aicte' | 'institution' | 'verifier'
export type Page = 'overview' | 'students' | 'upload' | 'validation' | 'monitoring' | 'verification' | 'reports' | 'certificate' | 'audit' | 'settings'
export type Status = 'Valid' | 'Pending' | 'Invalid'
export type IssueType = 'missing_field' | 'invalid_apaar' | 'duplicate' | 'intake'
export interface Institution { id: string; name: string; code: string; state: string; approved_intake: number; created_at: string }
export interface Student { id: string; institution_id: string; apaar_id: string; name: string; email: string | null; program: string; admission_year: number; status: Status; created_at: string }
export interface Credit { id: string; student_id: string; semester: number; credits: number; created_at: string }
export interface AuditLog { id: string; action: string; entity: string; details: string | null; actor: string; created_at: string }
export interface Issue { id: string; institution_id: string; student_ref: string | null; type: IssueType; detail: string; status: 'open' | 'resolved'; resolution_note: string | null; created_at: string }
export type TableName = 'institutions' | 'students' | 'abc_credits' | 'audit_logs' | 'validation_issues'
