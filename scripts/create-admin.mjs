import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'

if (existsSync('.env.local')) {
  const env = readFileSync('.env.local', 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const username = process.argv[2]
const password = process.argv[3]

if (!username || !password) {
  console.error('Usage: node scripts/create-admin.mjs <username> <password>')
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Variables manquantes: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const hash = await bcrypt.hash(password, 12)

const { error } = await supabase
  .from('admins')
  .upsert({
    username: username.trim().toLowerCase(),
    password_hash: hash,
    role: 'superadmin',
    permissions: ['chine', 'lome'],
  }, { onConflict: 'username' })

if (error) {
  console.error('Erreur:', error.message)
  process.exit(1)
}

console.log(`✅ Admin "${username}" créé avec succès.`)
