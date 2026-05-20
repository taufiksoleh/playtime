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

  function updatePlayerPoints(entryId, playerIndex, points) {
    const all = load()
    const entry = all.find(e => e.id === entryId)
    if (entry?.players?.[playerIndex] !== undefined) {
      entry.players[playerIndex].points = points
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
      } catch {}
    }
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY)
  }

  return { load, save, updatePlayerPoints, clear }
}
