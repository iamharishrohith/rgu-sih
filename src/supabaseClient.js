import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cgfmtthhudtmaswnxpva.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_h4-KaGCdVH0193UY9DtV3g_wLbr8cxp';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
