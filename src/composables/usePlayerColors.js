const PALETTE = [210, 340, 142, 38, 270, 180, 22, 300]

export function playerColor(index) {
  const hue = PALETTE[index % PALETTE.length]
  return `hsl(${hue}, 80%, 62%)`
}

export function playerBg(index) {
  const hue = PALETTE[index % PALETTE.length]
  return `hsl(${hue}, 50%, 22%)`
}

export function playerInitial(name) {
  return (name ?? '?').trim()[0]?.toUpperCase() ?? '?'
}
