const STORAGE_KEY = 'playtime.leaderboard.v1'

export function useLeaderboard() {
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    } catch {
      return []
    }
  }

  function save(entry) {
    const entries = load()
    entries.unshift(entry)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)))
    } catch {}
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY)
  }

  return { load, save, clear }
}
