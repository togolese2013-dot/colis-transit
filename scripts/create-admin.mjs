import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ghwhyuneberhotwzinwq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_utNS37JHF9iqRR4zV59L0w_ADIcN1FT'

const username = process.argv[2]
const password = process.argv[3]

if (!username || !password) {
  console.error('Usage: node scripts/create-admin.mjs <username> <password>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const hash = await bcrypt.hash(password, 12)

const { error } = await supabase
  .from('admins')
  .upsert({ username: username.toLowerCase(), password_hash: hash }, { onConflict: 'username' })

if (error) {
  console.error('Erreur:', error.message)
  process.exit(1)
}

console.log(`✅ Admin "${username}" créé avec succès.`)
