import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ejpdgrtfhjlhunzkhsve.supabase.co';
const supabaseKey = 'sb_publishable_YieY0MD5ErjPIgzoNoIj3Q_GUwnGbve';

export const supabase = createClient(supabaseUrl, supabaseKey);