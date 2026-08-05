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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Variables manquantes: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.')
  process.exit(1)
}

const OLD_HOST = 'https://ghwhyuneberhotwzinwq.supabase.co'
const NEW_HOST = 'https://supabase.hamidcargo.com'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function main() {
  console.log(`Mode: ${dryRun ? 'DRY-RUN (aucune écriture)' : 'LIVE'}`)

  const { data: rows, error } = await supabase
    .from('packages')
    .select('id, tracking_number, photo_url, photo_urls')
    .or('photo_url.not.is.null,photo_urls.not.is.null')

  if (error) throw error

  console.log(`${rows.length} colis avec photo(s) récupérés pour analyse.`)

  let toUpdate = 0
  let updated = 0
  let errors = 0

  for (const row of rows) {
    const oldUrl = row.photo_url
    const oldUrls = Array.isArray(row.photo_urls) ? row.photo_urls : []

    const needsUrlFix = oldUrl && oldUrl.includes(OLD_HOST)
    const needsUrlsFix = oldUrls.some(u => typeof u === 'string' && u.includes(OLD_HOST))

    if (!needsUrlFix && !needsUrlsFix) continue

    toUpdate++
    const newUrl = needsUrlFix ? oldUrl.replaceAll(OLD_HOST, NEW_HOST) : oldUrl
    const newUrls = oldUrls.map(u => (typeof u === 'string' ? u.replaceAll(OLD_HOST, NEW_HOST) : u))

    console.log(`${dryRun ? '[dry-run] ' : ''}${row.tracking_number}: ${oldUrls.length || (oldUrl ? 1 : 0)} photo(s) à corriger`)

    if (dryRun) continue

    const { error: upError } = await supabase
      .from('packages')
      .update({ photo_url: newUrl, photo_urls: newUrls })
      .eq('id', row.id)

    if (upError) {
      errors++
      console.error(`Erreur sur ${row.tracking_number}:`, upError.message)
    } else {
      updated++
    }
  }

  console.log('---')
  console.log(`Colis à corriger: ${toUpdate}, mis à jour: ${updated}, erreurs: ${errors}`)
}

main().catch((err) => {
  console.error('Échec du script:', err)
  process.exit(1)
})
