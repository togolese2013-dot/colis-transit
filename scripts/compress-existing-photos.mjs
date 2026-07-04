import sharp from 'sharp'
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

const BUCKET = 'packages'
const MAX_DIM = 1280
const JPEG_QUALITY = 75
const MIN_SIZE_BYTES = 150 * 1024 // skip files already small (likely already compressed)
const THROTTLE_MS = 200

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function listAllFiles() {
  const files = []
  let offset = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list('', {
      limit: pageSize,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    if (!data || data.length === 0) break
    files.push(...data.filter(f => f.id !== null)) // skip folder placeholders
    if (data.length < pageSize) break
    offset += pageSize
  }
  return files
}

async function main() {
  console.log(`Mode: ${dryRun ? 'DRY-RUN (aucun upload)' : 'LIVE (écrase les fichiers)'}${limit !== Infinity ? ` — limite ${limit} fichiers` : ''}`)

  const files = await listAllFiles()
  console.log(`${files.length} fichiers trouvés dans le bucket "${BUCKET}".`)

  let processed = 0
  let skipped = 0
  let errors = 0
  let totalBefore = 0
  let totalAfter = 0

  for (const file of files) {
    if (processed >= limit) break

    const originalSize = file.metadata?.size ?? 0
    if (originalSize && originalSize < MIN_SIZE_BYTES) {
      skipped++
      continue
    }

    try {
      const { data: blob, error: dlError } = await supabase.storage.from(BUCKET).download(file.name)
      if (dlError || !blob) throw dlError || new Error('download vide')

      const inputBuffer = Buffer.from(await blob.arrayBuffer())
      const outputBuffer = await sharp(inputBuffer)
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer()

      const before = inputBuffer.length
      const after = outputBuffer.length
      totalBefore += before
      totalAfter += after

      const pct = before > 0 ? Math.round((1 - after / before) * 100) : 0
      console.log(`${dryRun ? '[dry-run] ' : ''}${file.name}: ${(before / 1024).toFixed(0)} Ko -> ${(after / 1024).toFixed(0)} Ko (-${pct}%)`)

      if (!dryRun && after < before) {
        const { error: upError } = await supabase.storage
          .from(BUCKET)
          .upload(file.name, outputBuffer, { contentType: 'image/jpeg', upsert: true })
        if (upError) throw upError
      }

      processed++
      await sleep(THROTTLE_MS)
    } catch (err) {
      errors++
      console.error(`Erreur sur ${file.name}:`, err.message || err)
    }
  }

  console.log('---')
  console.log(`Traités: ${processed}, ignorés (déjà petits): ${skipped}, erreurs: ${errors}`)
  console.log(`Taille avant: ${(totalBefore / 1024 / 1024).toFixed(2)} Mo`)
  console.log(`Taille après: ${(totalAfter / 1024 / 1024).toFixed(2)} Mo`)
  console.log(`Économisé: ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(2)} Mo`)
}

main().catch((err) => {
  console.error('Échec du script:', err)
  process.exit(1)
})
