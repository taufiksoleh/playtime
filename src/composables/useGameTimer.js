import { ref, computed, onBeforeUnmount } from 'vue'

export function useGameTimer({ onTimeout } = {}) {
  const players = ref([])
  const currentIndex = ref(0)
  const remainingMs = ref(0)
  const running = ref(false)

  let endAt = 0
  let rafId = null

  const currentPlayer = computed(() => players.value[currentIndex.value] ?? null)
  const upcoming = computed(() => {
    const n = players.value.length
    if (n === 0) return []
    return Array.from({ length: Math.min(3, n - 1) }, (_, i) =>
      players.value[(currentIndex.value + i + 1) % n],
    )
  })

  function tick() {
    const now = performance.now()
    const left = endAt - now
    if (left <= 0) {
      remainingMs.value = 0
      running.value = false
      rafId = null
      if (typeof onTimeout === 'function') onTimeout()
      return
    }
    remainingMs.value = left
    rafId = requestAnimationFrame(tick)
  }

  function stopRaf() {
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function loadPlayers(list) {
    players.value = list.map((p) => ({ ...p }))
    currentIndex.value = 0
    remainingMs.value = msFor(0)
    running.value = false
    stopRaf()
  }

  function msFor(index) {
    const p = players.value[index]
    return p ? Math.max(1, Number(p.seconds) || 0) * 1000 : 0
  }

  function start() {
    if (!currentPlayer.value || running.value) return
    endAt = performance.now() + remainingMs.value
    running.value = true
    rafId = requestAnimationFrame(tick)
  }

  function pause() {
    if (!running.value) return
    stopRaf()
    remainingMs.value = Math.max(0, endAt - performance.now())
    running.value = false
  }

  function resume() {
    if (running.value || remainingMs.value <= 0) return
    start()
  }

  function next() {
    stopRaf()
    const n = players.value.length
    if (n === 0) return
    currentIndex.value = (currentIndex.value + 1) % n
    remainingMs.value = msFor(currentIndex.value)
    running.value = false
    start()
  }

  function resetTurn() {
    stopRaf()
    remainingMs.value = msFor(currentIndex.value)
    running.value = false
  }

  function resetGame() {
    stopRaf()
    currentIndex.value = 0
    remainingMs.value = msFor(0)
    running.value = false
  }

  onBeforeUnmount(stopRaf)

  return {
    players,
    currentIndex,
    remainingMs,
    running,
    currentPlayer,
    upcoming,
    loadPlayers,
    start,
    pause,
    resume,
    next,
    resetTurn,
    resetGame,
  }
}

export function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function beep(durationMs = 220, frequency = 880) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.05)
    osc.onended = () => ctx.close()
  } catch {
    // best-effort; ignore audio failures
  }
}
