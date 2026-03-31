const BATCH_STORAGE_KEY = 'lc_batches'

export function saveBatch(name: string, urls: string[]): void {
  const current = loadBatches()
  current[name] = urls
  localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(current))
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('lc_batches_updated'))
  }
}

export function loadBatches(): Record<string, string[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(BATCH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

export function deleteBatch(name: string): void {
  const current = loadBatches()
  delete current[name]
  localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(current))

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('lc_batches_updated'))
  }
}
