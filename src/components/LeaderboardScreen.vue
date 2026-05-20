<script setup>
import { ref, onMounted } from 'vue'
import PlayerAvatar from './PlayerAvatar.vue'
import { useLeaderboard } from '../composables/useLeaderboard.js'
import { formatTime } from '../composables/useGameTimer.js'

const emit = defineEmits(['back'])

const { load, clear, updatePlayerPoints } = useLeaderboard()
const entries = ref([])
const expandedId = ref(null)

onMounted(() => { entries.value = load() })

function adjustPoints(entryId, playerIndex, delta) {
  const entry = entries.value.find(e => e.id === entryId)
  if (!entry) return
  const player = entry.players[playerIndex]
  player.points = Math.max(0, (player.points ?? 0) + delta)
  updatePlayerPoints(entryId, playerIndex, player.points)
}

function handlePointsInput(entryId, playerIndex, value) {
  const entry = entries.value.find(e => e.id === entryId)
  if (!entry) return
  const player = entry.players[playerIndex]
  player.points = Math.max(0, parseInt(value) || 0)
  updatePlayerPoints(entryId, playerIndex, player.points)
}

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
                  <th>Points</th>
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
                  <td class="points-cell">
                    <button class="pts-btn" @click.stop="adjustPoints(e.id, i, -1)">−</button>
                    <input
                      type="number"
                      class="pts-input"
                      :value="p.points ?? 0"
                      min="0"
                      @change.stop="handlePointsInput(e.id, i, $event.target.value)"
                    />
                    <button class="pts-btn" @click.stop="adjustPoints(e.id, i, 1)">+</button>
                  </td>
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

.points-cell { display: flex; align-items: center; gap: 3px; }
.pts-btn {
  width: 22px; height: 22px;
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 4px;
  color: var(--text);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.pts-btn:hover { background: rgba(148, 163, 184, 0.2); }
.pts-input {
  width: 44px;
  text-align: center;
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 4px;
  color: var(--text);
  font-size: 13px;
  padding: 2px 4px;
  font-variant-numeric: tabular-nums;
}
.pts-input:focus { outline: none; border-color: var(--accent, #6366f1); }
.pts-input::-webkit-inner-spin-button,
.pts-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.pts-input[type=number] { -moz-appearance: textfield; appearance: textfield; }

@media (max-width: 520px) {
  .session-summary { grid-template-columns: 1fr auto auto; }
  .session-mode { display: none; }
}
</style>
