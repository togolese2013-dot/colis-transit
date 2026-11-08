import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const idx = line.indexOf('=')
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

const rawArgs = process.argv.slice(2)
const args = {}

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i]
  if (!arg.startsWith('--')) continue
  const [key, inlineValue] = arg.slice(2).split('=')
  if (inlineValue !== undefined) {
    args[key] = inlineValue
    continue
  }

  const nextValue = rawArgs[i + 1]
  if (nextValue && !nextValue.startsWith('--')) {
    args[key] = nextValue
    i += 1
  } else {
    args[key] = 'true'
  }
}

const days = Number(args.days ?? process.env.AUTO_DELETE_DELIVERED_DAYS ?? 60)
const dryRun = args['dry-run'] === 'true' || args.dryRun === 'true' || args['dry-run'] === '1'
const maxRecords = Number(args.maxRecords ?? process.env.CLEANUP_MAX_RECORDS ?? 2000)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

function chunkArray(items, size) {
  const chunks = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const cutoffIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

const { data: packages, error } = await supabase
  .from('packages')
  .select('id, photo_url, photo_urls')
  .eq('status', 'LIVRE')
  .lt('created_at', cutoffIso)
  .order('created_at', { ascending: true })
  .limit(maxRecords)

if (error) {
  throw new Error(error.message)
}

const ids = (packages ?? []).map((pkg) => pkg.id)

if (!ids.length) {
  console.log(JSON.stringify({ cutoff: cutoffIso, days, dryRun, candidateCount: 0, deletedCount: 0 }, null, 2))
  process.exit(0)
}

const marker = '/object/public/packages/'
const storagePaths = [...new Set((packages ?? []).flatMap((pkg) => {
  const urls = Array.isArray(pkg.photo_urls) && pkg.photo_urls.length > 0 ? pkg.photo_urls : pkg.photo_url ? [pkg.photo_url] : []
  return urls
    .map((url) => (typeof url === 'string' ? url : ''))
    .filter((url) => url.includes(marker))
    .map((url) => url.slice(url.indexOf(marker) + marker.length))
}))]

if (dryRun) {
  console.log(JSON.stringify({ cutoff: cutoffIso, days, dryRun, candidateCount: ids.length, deletedCount: 0, storagePathsToRemove: storagePaths.length }, null, 2))
  process.exit(0)
}

for (const chunk of chunkArray(ids, 200)) {
  const { error: deleteError } = await supabase.from('packages').delete().in('id', chunk)
  if (deleteError) throw new Error(deleteError.message)
}

if (storagePaths.length > 0) {
  for (const chunk of chunkArray(storagePaths, 100)) {
    const { error: storageError } = await supabase.storage.from('packages').remove(chunk)
    if (storageError) throw new Error(storageError.message)
  }
}

console.log(JSON.stringify({ cutoff: cutoffIso, days, dryRun, candidateCount: ids.length, deletedCount: ids.length, storagePathsRemoved: storagePaths.length }, null, 2))
