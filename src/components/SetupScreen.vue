<script setup>
import { ref, watch, computed } from 'vue'

const STORAGE_KEY = 'playtime.setup.v1'

const defaultSeconds = ref(60)
const players = ref([
  { name: 'Player 1', seconds: '' },
  { name: 'Player 2', seconds: '' },
])

const saved = loadSaved()
if (saved) {
  defaultSeconds.value = saved.defaultSeconds ?? 60
  players.value = saved.players?.length
    ? saved.players.map((p) => ({ name: p.name ?? '', seconds: p.seconds ?? '' }))
    : players.value
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

watch(
  [defaultSeconds, players],
  () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ defaultSeconds: defaultSeconds.value, players: players.value }),
      )
    } catch {
      // storage may be unavailable (private mode); ignore
    }
  },
  { deep: true },
)

const playerCount = computed({
  get: () => players.value.length,
  set: (n) => {
    const target = Math.max(2, Math.min(12, Number(n) || 2))
    if (target > players.value.length) {
      for (let i = players.value.length; i < target; i++) {
        players.value.push({ name: `Player ${i + 1}`, seconds: '' })
      }
    } else {
      players.value.splice(target)
    }
  },
})

function move(i, dir) {
  const j = i + dir
  if (j < 0 || j >= players.value.length) return
  const arr = players.value
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

function removeAt(i) {
  if (players.value.length <= 2) return
  players.value.splice(i, 1)
}

function addPlayer() {
  if (players.value.length >= 12) return
  players.value.push({ name: `Player ${players.value.length + 1}`, seconds: '' })
}

const emit = defineEmits(['start'])

const canStart = computed(() =>
  players.value.length >= 2 &&
  players.value.every((p) => (p.name ?? '').trim().length > 0) &&
  Number(defaultSeconds.value) > 0,
)

function startGame() {
  if (!canStart.value) return
  const dflt = Math.max(1, Number(defaultSeconds.value) || 0)
  const list = players.value.map((p) => ({
    name: p.name.trim(),
    seconds: p.seconds === '' || p.seconds == null
      ? dflt
      : Math.max(1, Number(p.seconds) || dflt),
  }))
  emit('start', { players: list, defaultSeconds: dflt })
}
</script>

<template>
  <section class="panel setup">
    <h2>Game setup</h2>
    <p class="muted">Configure players, turn order, and time per turn.</p>

    <div class="row two">
      <label>
        <span>Number of players</span>
        <input type="number" min="2" max="12" v-model.number="playerCount" />
      </label>
      <label>
        <span>Default time per turn (seconds)</span>
        <input type="number" min="1" v-model.number="defaultSeconds" />
      </label>
    </div>

    <ol class="players">
      <li v-for="(p, i) in players" :key="i">
        <div class="order">{{ i + 1 }}</div>
        <input type="text" placeholder="Player name" v-model="p.name" />
        <input
          type="number"
          min="1"
          :placeholder="`Custom (default ${defaultSeconds}s)`"
          v-model="p.seconds"
        />
        <div class="row-actions">
          <button class="ghost" :disabled="i === 0" @click="move(i, -1)" title="Move up">↑</button>
          <button class="ghost" :disabled="i === players.length - 1" @click="move(i, 1)" title="Move down">↓</button>
          <button class="ghost" :disabled="players.length <= 2" @click="removeAt(i)" title="Remove">✕</button>
        </div>
      </li>
    </ol>

    <div class="bottom-actions">
      <button class="ghost" :disabled="players.length >= 12" @click="addPlayer">+ Add player</button>
      <button class="primary" :disabled="!canStart" @click="startGame">Start game →</button>
    </div>
  </section>
</template>

<style scoped>
.setup h2 { margin: 0 0 4px; }
.muted { color: var(--muted); margin: 0 0 18px; }

.row.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 18px;
}
label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; color: var(--muted); }

.players { list-style: none; padding: 0; margin: 0 0 16px; display: flex; flex-direction: column; gap: 10px; }
.players li {
  display: grid;
  grid-template-columns: 32px 1.4fr 1fr auto;
  gap: 10px;
  align-items: center;
  background: #0b1220;
  border: 1px solid var(--panel-2);
  border-radius: 10px;
  padding: 10px 12px;
}
.order {
  width: 32px; height: 32px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: var(--panel-2);
  color: var(--text);
  font-weight: 600;
}
.row-actions { display: flex; gap: 6px; }
.row-actions button { padding: 8px 10px; }

.bottom-actions { display: flex; justify-content: space-between; gap: 12px; }

@media (max-width: 640px) {
  .row.two { grid-template-columns: 1fr; }
  .players li { grid-template-columns: 32px 1fr; grid-template-areas:
    "order name"
    "order time"
    "actions actions"; }
  .players li > input[type="text"] { grid-area: name; }
  .players li > input[type="number"] { grid-area: time; }
  .row-actions { grid-area: actions; justify-content: flex-end; }
}
</style>
