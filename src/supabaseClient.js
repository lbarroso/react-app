
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xwlgtflzoyfkfqthowjm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bGd0Zmx6b3lma2ZxdGhvd2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMzI1MDUsImV4cCI6MjA2NDgwODUwNX0.A_giEUciCBveIaUDpSa_jcOw3P1Z5NzlbZHpK48mQaw'

export const supabase = createClient(supabaseUrl, supabaseKey)
