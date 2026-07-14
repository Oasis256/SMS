export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

export const OAUTH_STATE_COOKIE = "__Host-oauth_state";
export type OAuthState = { redirectUri: string; nonce?: string };

export const encodeOAuthState = (state: OAuthState): string =>
  btoa(JSON.stringify(state));

export const decodeOAuthState = (state: string): OAuthState => {
  let decoded: string;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {}
  return { redirectUri: decoded };
};

// School-specific constants
export const SCHOOL_ROLES = ['admin', 'principal', 'bursar', 'director_of_studies', 'teacher', 'department_head'] as const;
export type SchoolRole = typeof SCHOOL_ROLES[number];

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  principal: 'Head Teacher / Principal',
  bursar: 'Bursar / Finance Officer',
  director_of_studies: 'Director of Studies',
  teacher: 'Teacher',
  department_head: 'Department Head',
  user: 'User',
};

export const ATTENDANCE_STATUS_COLORS = {
  present: '#22c55e',    // Green
  late: '#eab308',       // Yellow
  absent: '#ef4444',     // Red
  on_leave: '#3b82f6',   // Blue
  off_campus: '#6b7280', // Gray
} as const;

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  finance_reviewed: 'Finance Reviewed',
  principal_approved: 'Principal Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_LOGIN_ATTEMPTS = 5;

// ============ MULTI-SCHOOL CONSTANTS ============
export const SCHOOLS = [
  { id: 1, name: 'Child Africa Junior School - Kabale', shortName: 'CA Jnr. Kabale', code: 'CA-KBL', type: 'primary' as const, location: 'Kabale' },
  { id: 2, name: 'Child Africa Junior School - Equator', shortName: 'CA Jnr. Equator', code: 'CA-EQT', type: 'primary' as const, location: 'Equator' },
  { id: 3, name: 'Solberg College - Kabale', shortName: 'Solberg College', code: 'SOL-KBL', type: 'secondary' as const, location: 'Kabale' },
] as const;

export type SchoolId = 1 | 2 | 3;
export const ALL_SCHOOLS_ID = 0; // sentinel for cross-school view

export const SCHOOL_TYPE_LABELS: Record<string, string> = {
  primary: 'Primary School',
  secondary: 'Secondary School',
};
