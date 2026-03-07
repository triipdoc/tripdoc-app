import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://otwygboikourbojqyhfq.supabase.co'
const supabaseKey = 'sb_publishable_clulToq_1kCPKvwHcbgIqA_gFO5ceGu'

export const supabase = createClient(supabaseUrl, supabaseKey)