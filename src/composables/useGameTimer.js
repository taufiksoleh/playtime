import { ref, computed, onBeforeUnmount } from 'vue'

export function useGameTimer({ onTimeout } = {}) {
  const players = ref([])
  const currentIndex = ref(0)
  const remainingMs = ref(0)
  const running = ref(false)
  const resetOnNext = ref(true)
  const banks = ref([])

  const stats = ref([])
  const turnSuccess = ref(false)
  let timedOut = false
  let turnStartMs = 0

  const finished = ref([])
  let finishCounter = 0

  let endAt = 0
  let rafId = null

  const currentPlayer = computed(() => players.value[currentIndex.value] ?? null)
  const allFinished = computed(() =>
    finished.value.length > 0 && finished.value.every(Boolean)
  )
  const upcoming = computed(() => {
    const n = players.value.length
    if (n === 0) return []
    const result = []
    let step = 1
    while (result.length < 3 && step <= n) {
      const idx = (currentIndex.value + step) % n
      if (!finished.value[idx])
        result.push({ ...players.value[idx], playerIndex: idx })
      step++
    }
    return result
  })

  function msFor(index) {
    const p = players.value[index]
    return p ? Math.max(1, Number(p.seconds) || 0) * 1000 : 0
  }

  function initStats() {
    stats.value = players.value.map(() => ({
      turns: 0,
      totalUsedMs: 0,
      fastestMs: Infinity,
      slowestMs: 0,
      timeouts: 0,
      streak: 0,
      finishRank: 0,
    }))
  }

  function resetStats() {
    initStats()
  }

  function tick() {
    const now = performance.now()
    const left = endAt - now
    if (left <= 0) {
      remainingMs.value = 0
      running.value = false
      rafId = null
      timedOut = true
      if (!resetOnNext.value) banks.value[currentIndex.value] = 0
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

  function loadPlayers(list, { resetOnNext: ron = true } = {}) {
    players.value = list.map((p) => ({ ...p }))
    resetOnNext.value = ron
    banks.value = players.value.map((_, i) => msFor(i))
    currentIndex.value = 0
    remainingMs.value = banks.value[0] ?? 0
    running.value = false
    timedOut = false
    turnStartMs = remainingMs.value
    finished.value = players.value.map(() => false)
    finishCounter = 0
    stopRaf()
    initStats()
  }

  function start() {
    if (!currentPlayer.value || running.value) return
    if (remainingMs.value <= 0) return
    endAt = performance.now() + remainingMs.value
    running.value = true
    rafId = requestAnimationFrame(tick)
  }

  function pause() {
    if (!running.value) return
    stopRaf()
    remainingMs.value = Math.max(0, endAt - performance.now())
    running.value = false
    if (!resetOnNext.value) banks.value[currentIndex.value] = remainingMs.value
  }

  function resume() {
    if (running.value || remainingMs.value <= 0) return
    start()
  }

  function next() {
    stopRaf()
    const n = players.value.length
    if (n === 0) return

    const wasTimeout = timedOut
    timedOut = false
    const s = stats.value[currentIndex.value]
    if (s) {
      const usedMs = Math.max(0, turnStartMs - Math.max(0, remainingMs.value))
      s.turns++
      s.totalUsedMs += usedMs
      if (wasTimeout) {
        s.timeouts++
        s.streak = 0
      } else {
        if (usedMs < s.fastestMs) s.fastestMs = usedMs
        if (usedMs > s.slowestMs) s.slowestMs = usedMs
        s.streak++
      }
    }

    if (!wasTimeout) {
      turnSuccess.value = true
    }

    if (!resetOnNext.value) {
      banks.value[currentIndex.value] = Math.max(0, remainingMs.value)
    }

    let nextIdx = (currentIndex.value + 1) % n
    let steps = 0
    while (finished.value[nextIdx] && steps < n) {
      nextIdx = (nextIdx + 1) % n
      steps++
    }
    if (steps >= n) {
      running.value = false
      return
    }

    currentIndex.value = nextIdx
    remainingMs.value = resetOnNext.value
      ? msFor(currentIndex.value)
      : (banks.value[currentIndex.value] ?? msFor(currentIndex.value))
    turnStartMs = remainingMs.value
    running.value = false
    if (remainingMs.value > 0) start()
  }

  function markFinished() {
    stopRaf()
    const idx = currentIndex.value
    if (finished.value[idx]) return

    const wasTimeout = timedOut
    timedOut = false
    const s = stats.value[idx]
    if (s) {
      const usedMs = Math.max(0, turnStartMs - Math.max(0, remainingMs.value))
      s.turns++
      s.totalUsedMs += usedMs
      if (wasTimeout) {
        s.timeouts++
        s.streak = 0
      } else {
        if (usedMs < s.fastestMs) s.fastestMs = usedMs
        if (usedMs > s.slowestMs) s.slowestMs = usedMs
        s.streak++
      }
    }

    finishCounter++
    finished.value[idx] = true
    if (s) s.finishRank = finishCounter

    if (!resetOnNext.value) {
      banks.value[idx] = 0
    }

    const remaining = finished.value.filter(f => !f).length
    if (remaining === 0) {
      running.value = false
      return
    }

    const n = players.value.length
    let nextIdx = (idx + 1) % n
    let steps = 0
    while (finished.value[nextIdx] && steps < n) {
      nextIdx = (nextIdx + 1) % n
      steps++
    }
    currentIndex.value = nextIdx
    remainingMs.value = resetOnNext.value
      ? msFor(nextIdx)
      : (banks.value[nextIdx] ?? msFor(nextIdx))
    turnStartMs = remainingMs.value
    running.value = false
    if (remainingMs.value > 0) start()
  }

  function resetTurn() {
    stopRaf()
    const full = msFor(currentIndex.value)
    remainingMs.value = full
    turnStartMs = full
    if (!resetOnNext.value) banks.value[currentIndex.value] = full
    running.value = false
  }

  function resetGame() {
    stopRaf()
    banks.value = players.value.map((_, i) => msFor(i))
    currentIndex.value = 0
    remainingMs.value = banks.value[0] ?? 0
    turnStartMs = remainingMs.value
    running.value = false
    timedOut = false
    finished.value = players.value.map(() => false)
    finishCounter = 0
    initStats()
  }

  onBeforeUnmount(stopRaf)

  return {
    players,
    currentIndex,
    remainingMs,
    running,
    resetOnNext,
    banks,
    currentPlayer,
    upcoming,
    stats,
    resetStats,
    turnSuccess,
    finished,
    allFinished,
    loadPlayers,
    start,
    pause,
    resume,
    next,
    markFinished,
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
