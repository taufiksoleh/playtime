<script setup>
import { ref, onMounted } from 'vue'
import PlayerAvatar from './PlayerAvatar.vue'
import { useLeaderboard } from '../composables/useLeaderboard.js'
import { formatTime } from '../composables/useGameTimer.js'

const emit = defineEmits(['back'])

const { load, clear } = useLeaderboard()
const entries = ref([])
const expandedId = ref(null)

onMounted(() => { entries.value = load() })

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function handleClear() {
  if (confirm('Clear all leaderboard data?')) {
    clear()
    entries.value = []
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return new Date(iso).toLocaleString()
  }
}

function fmtAvg(p) {
  return p.turns > 0 ? formatTime(p.totalUsedMs / p.turns) : '—'
}
</script>

<template>
  <section class="panel leaderboard">
    <header class="lb-header">
      <h2>🏆 Leaderboard</h2>
      <button class="ghost" @click="$emit('back')">← Back</button>
    </header>

    <p v-if="!entries.length" class="muted empty">No games saved yet. Play a game and save your results!</p>

    <ul v-else class="session-list">
      <li v-for="e in entries" :key="e.id" class="session-item">
        <button class="session-summary" @click="toggleExpand(e.id)">
          <span class="session-date muted">{{ formatDate(e.date) }}</span>
          <span class="session-winner">
            <PlayerAvatar
              :name="e.players[e.winnerIndex]?.name ?? '?'"
              :index="e.winnerIndex"
              size="22px"
            />
            <span>{{ e.players[e.winnerIndex]?.name ?? '?' }}</span>
            <span class="muted">won</span>
          </span>
          <span class="session-mode muted">{{ e.mode }}</span>
          <span class="chevron">{{ expandedId === e.id ? '▲' : '▼' }}</span>
        </button>

        <Transition name="expand">
          <div v-if="expandedId === e.id" class="session-detail">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Turns</th>
                  <th>Avg</th>
                  <th>Timeouts</th>
                  <th>Streak</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(p, i) in e.players"
                  :key="i"
                  :class="{ winner: i === e.winnerIndex }"
                >
                  <td class="player-cell">
                    <PlayerAvatar :name="p.name" :index="p.colorIndex ?? i" size="24px" />
                    <span>{{ p.name }}</span>
                    <span v-if="i === e.winnerIndex">👑</span>
                  </td>
                  <td>{{ p.turns }}</td>
                  <td>{{ fmtAvg(p) }}</td>
                  <td :class="{ 'text-danger': p.timeouts > 0 }">{{ p.timeouts }}</td>
                  <td>{{ p.streak > 0 ? `🔥 ${p.streak}` : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Transition>
      </li>
    </ul>

    <div v-if="entries.length" class="lb-footer">
      <button class="danger" @click="handleClear">Clear leaderboard</button>
    </div>
  </section>
</template>

<style scoped>
.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: slideUp 0.4s ease both;
}

.lb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lb-header h2 { margin: 0; }

.empty { text-align: center; padding: 20px 0; }

.session-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }

.session-item {
  background: #0b1220;
  border: 1px solid var(--panel-2);
  border-radius: 10px;
  overflow: hidden;
}

.session-summary {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: transparent;
  border: none;
  border-radius: 0;
  text-align: left;
  cursor: pointer;
}
.session-summary:hover { background: rgba(148, 163, 184, 0.06); }

.session-date { font-size: 13px; }
.session-winner { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; }
.session-mode { font-size: 12px; }
.chevron { font-size: 11px; color: var(--muted); }

.session-detail { padding: 0 14px 14px; }

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.detail-table th {
  text-align: left;
  color: var(--muted);
  font-weight: 500;
  padding: 6px 8px;
  border-bottom: 1px solid var(--panel-2);
}
.detail-table td {
  padding: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
  font-variant-numeric: tabular-nums;
}
.detail-table tr:last-child td { border-bottom: none; }
.detail-table tr.winner td { background: rgba(251, 191, 36, 0.05); }
.player-cell { display: flex; align-items: center; gap: 6px; }
.text-danger { color: var(--danger); }

.lb-footer { display: flex; justify-content: flex-end; }

@media (max-width: 520px) {
  .session-summary { grid-template-columns: 1fr auto auto; }
  .session-mode { display: none; }
}
</style>
