import { supabaseServer } from '@/lib/supabase-server'

export type CleanupOldDeliveredPackagesOptions = {
  days?: number
  dryRun?: boolean
  maxRecords?: number
}

export type CleanupOldDeliveredPackagesResult = {
  cutoff: string
  days: number
  dryRun: boolean
  candidateCount: number
  deletedCount: number
  deletedIds: string[]
  storagePathsRemoved: number
  message: string
}

function getValidDays(days?: number) {
  const value = Number(days ?? 365)
  if (!Number.isFinite(value) || value <= 0) return 365
  return Math.min(value, 3650)
}

function getStoragePathsFromPackage(pkg: { photo_url?: string | null; photo_urls?: string[] | null }) {
  const urls = Array.isArray(pkg.photo_urls) && pkg.photo_urls.length > 0
    ? pkg.photo_urls
    : pkg.photo_url ? [pkg.photo_url] : []

  const seen = new Set<string>()
  const marker = '/object/public/packages/'

  for (const url of urls) {
    if (!url) continue
    const idx = url.indexOf(marker)
    if (idx === -1) continue
    const path = url.slice(idx + marker.length)
    if (path && !seen.has(path)) seen.add(path)
  }

  return [...seen]
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export async function cleanupOldDeliveredPackages({
  days = 365,
  dryRun = false,
  maxRecords = 2000,
}: CleanupOldDeliveredPackagesOptions = {}): Promise<CleanupOldDeliveredPackagesResult> {
  const safeDays = getValidDays(days)
  const cutoffDate = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000)
  const cutoffIso = cutoffDate.toISOString()

  const { data: pkgs, error } = await supabaseServer
    .from('packages')
    .select('id, photo_url, photo_urls')
    .eq('status', 'LIVRE')
    .lt('created_at', cutoffIso)
    .order('created_at', { ascending: true })
    .limit(maxRecords)

  if (error) {
    throw new Error(error.message)
  }

  const packageRows = pkgs ?? []
  const ids = packageRows.map((pkg) => pkg.id)

  if (dryRun || ids.length === 0) {
    return {
      cutoff: cutoffIso,
      days: safeDays,
      dryRun,
      candidateCount: packageRows.length,
      deletedCount: 0,
      deletedIds: [],
      storagePathsRemoved: 0,
      message: packageRows.length > 0
        ? `Nettoyage en mode simulation : ${packageRows.length} colis livrés anciens détectés.`
        : 'Aucun colis livré ancien détecté.',
    }
  }

  const pathsToRemove = [...new Set(packageRows.flatMap((pkg) => getStoragePathsFromPackage(pkg)))]

  for (const chunk of chunkArray(ids, 200)) {
    const { error: deleteError } = await supabaseServer
      .from('packages')
      .delete()
      .in('id', chunk)

    if (deleteError) {
      throw new Error(deleteError.message)
    }
  }

  let storagePathsRemoved = 0
  if (pathsToRemove.length > 0) {
    for (const chunk of chunkArray(pathsToRemove, 100)) {
      const { data: storageResult, error: storageError } = await supabaseServer.storage.from('packages').remove(chunk)
      if (storageError) {
        throw new Error(storageError.message)
      }
      storagePathsRemoved += Array.isArray(storageResult) ? storageResult.length : 0
    }
  }

  return {
    cutoff: cutoffIso,
    days: safeDays,
    dryRun: false,
    candidateCount: packageRows.length,
    deletedCount: packageRows.length,
    deletedIds: ids,
    storagePathsRemoved,
    message: `${packageRows.length} colis livrés anciens supprimés. ${storagePathsRemoved} fichiers photo nettoyés.`,
  }
}
