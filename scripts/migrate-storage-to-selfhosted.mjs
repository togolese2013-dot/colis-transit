import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'

function loadEnvFile(path) {
  const env = {}
  if (!existsSync(path)) return env
  const content = readFileSync(path, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const oldEnv = loadEnvFile('.env.local.backup-old-supabase')
const newEnv = loadEnvFile('.env.local')

const OLD_URL = oldEnv.NEXT_PUBLIC_SUPABASE_URL
const OLD_KEY = oldEnv.SUPABASE_SERVICE_ROLE_KEY
const NEW_URL = newEnv.NEXT_PUBLIC_SUPABASE_URL
const NEW_KEY = newEnv.SUPABASE_SERVICE_ROLE_KEY

if (!OLD_URL || !OLD_KEY || !NEW_URL || !NEW_KEY) {
  console.error('Variables manquantes dans .env.local.backup-old-supabase ou .env.local')
  process.exit(1)
}

const BUCKET = 'packages'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity
const concurrencyArg = args.find(a => a.startsWith('--concurrency='))
const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 8

const oldClient = createClient(OLD_URL, OLD_KEY, { auth: { persistSession: false } })
const newClient = createClient(NEW_URL, NEW_KEY, { auth: { persistSession: false } })

async function listAllFiles(client) {
  const files = []
  let offset = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await client.storage.from(BUCKET).list('', {
      limit: pageSize,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    if (!data || data.length === 0) break
    files.push(...data.filter(f => f.id !== null))
    if (data.length < pageSize) break
    offset += pageSize
  }
  return files
}

async function migrateOne(file) {
  const { data: blob, error: dlError } = await oldClient.storage.from(BUCKET).download(file.name)
  if (dlError || !blob) throw dlError || new Error('download vide')

  const buffer = Buffer.from(await blob.arrayBuffer())

  if (dryRun) return { name: file.name, size: buffer.length }

  const { error: upError } = await newClient.storage
    .from(BUCKET)
    .upload(file.name, buffer, { contentType: blob.type || 'image/jpeg', upsert: true })
  if (upError) throw upError

  return { name: file.name, size: buffer.length }
}

async function runPool(items, worker, poolSize) {
  let index = 0
  let done = 0
  const results = { ok: 0, errors: 0, errorList: [] }

  async function next() {
    while (index < items.length) {
      const i = index++
      const item = items[i]
      try {
        await worker(item)
        results.ok++
      } catch (err) {
        results.errors++
        results.errorList.push({ name: item.name, message: err.message || String(err) })
        console.error(`Erreur sur ${item.name}:`, err.message || err)
      }
      done++
      if (done % 100 === 0 || done === items.length) {
        console.log(`Progression: ${done}/${items.length} (ok: ${results.ok}, erreurs: ${results.errors})`)
      }
    }
  }

  await Promise.all(Array.from({ length: poolSize }, next))
  return results
}

async function main() {
  console.log(`Mode: ${dryRun ? 'DRY-RUN (aucun upload)' : 'LIVE'}${limit !== Infinity ? ` — limite ${limit} fichiers` : ''} — concurrence ${concurrency}`)
  console.log(`Source: ${OLD_URL}`)
  console.log(`Destination: ${NEW_URL}`)

  console.log('Liste des fichiers existants côté destination (pour skip)...')
  const destFiles = await listAllFiles(newClient)
  const destNames = new Set(destFiles.map(f => f.name))
  console.log(`${destNames.size} fichiers déjà présents côté destination.`)

  console.log('Liste des fichiers source...')
  const allFiles = await listAllFiles(oldClient)
  console.log(`${allFiles.length} fichiers trouvés côté source.`)

  const toMigrate = allFiles.filter(f => !destNames.has(f.name)).slice(0, limit)
  console.log(`${toMigrate.length} fichiers à migrer (${allFiles.length - toMigrate.length} déjà migrés, skippés).`)

  if (toMigrate.length === 0) {
    console.log('Rien à faire.')
    return
  }

  const results = await runPool(toMigrate, migrateOne, concurrency)

  console.log('---')
  console.log(`Terminé. ok: ${results.ok}, erreurs: ${results.errors}`)
  if (results.errorList.length > 0) {
    console.log('Fichiers en erreur:')
    for (const e of results.errorList) console.log(`  - ${e.name}: ${e.message}`)
  }
}

main().catch((err) => {
  console.error('Échec du script:', err)
  process.exit(1)
})
