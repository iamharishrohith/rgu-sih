import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cgfmtthhudtmaswnxpva.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_h4-KaGCdVH0193UY9DtV3g_wLbr8cxp';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Strips unknown/extra fields from registration objects before upserting into Supabase,
 * ensuring PostgreSQL schema compliance and preventing PGRST204 errors.
 */
export function formatRegistrationPayloadForSupabase(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  const rawMembers = Array.isArray(payload.members) ? payload.members : [];

  const cleanMembers = rawMembers.map((m, idx) => ({
    id: m.id || (idx + 2),
    name: (m.name || '').trim(),
    reg_no: (m.reg_no || '').trim(),
    gender: m.gender || 'Male',
    personal_email: (m.personal_email || '').trim(),
    college_email: (m.college_email || '').trim(),
    phone: (m.phone || '').trim(),
    whatsapp: (m.whatsapp || m.phone || '').trim(),
    year: m.year || '3rd Year',
    dept: (m.dept || '').trim(),
    school: m.school || ''
  }));

  // Preserve leader gender in first member's meta if present
  if (payload.leader_gender && cleanMembers.length > 0) {
    cleanMembers[0].leader_gender = payload.leader_gender;
  }

  return {
    temp_team_id: payload.temp_team_id,
    team_name: (payload.team_name || '').trim(),
    sih_ps_id: (payload.sih_ps_id || payload.ps_id || '').trim(),
    ps_title: (payload.ps_title || '').trim(),
    status: payload.status || 'Shortlist',
    leader_name: (payload.leader_name || '').trim(),
    leader_reg_no: (payload.leader_reg_no || '').trim(),
    leader_personal_email: (payload.leader_personal_email || '').trim().toLowerCase(),
    leader_college_email: (payload.leader_college_email || '').trim(),
    leader_phone: (payload.leader_phone || '').trim(),
    leader_whatsapp: (payload.leader_whatsapp || payload.leader_phone || '').trim(),
    leader_year: payload.leader_year || '3rd Year',
    leader_dept: (payload.leader_dept || '').trim(),
    leader_school: (payload.leader_school || '').trim(),
    members: cleanMembers,
    mentor_name: (payload.mentor_name || '').trim(),
    mentor_designation: payload.mentor_designation || 'Assistant Professor',
    mentor_email: (payload.mentor_email || '').trim(),
    mentor_phone: (payload.mentor_phone || '').trim(),
    updated_at: payload.updated_at || new Date().toISOString()
  };
}
