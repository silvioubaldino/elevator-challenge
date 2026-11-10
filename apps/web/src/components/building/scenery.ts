import { t } from "../../i18n/pt-BR"
import { FLOOR_H, SHAFT_W, SHAFT_X, TOP, WALL_L, type Geometry } from "./geometry"

type RoomKind = "lobby" | "garage" | "office" | "cafe" | "library" | "gym" | "lounge"

const UPPER_ROOMS: RoomKind[] = ["office", "cafe", "library", "office", "gym"]
const WALLS = ["var(--wall-a)", "var(--wall-b)", "var(--wall-c)"]
const BOOK_COLORS = ["#e85d75", "#5b8def", "#f2c94c", "#22a99a", "#8e6cd8", "#f2994a"]
const ROOM_W = SHAFT_X - WALL_L

function roomKind(floor: number, max: number): RoomKind {
  if (floor === 0) return "lobby"
  if (floor < 0) return "garage"
  if (floor === max) return "lounge"
  return UPPER_ROOMS[(floor - 1) % UPPER_ROOMS.length]!
}

const windowPane = (x: number, top: number) =>
  `<rect x="${x}" y="${top + 8}" width="38" height="28" rx="6" fill="var(--win)" stroke="#fff" stroke-width="3"/>` +
  `<path d="M${x + 19} ${top + 8} V${top + 36}" stroke="#fff" stroke-width="2"/>`

function furniture(kind: RoomKind, top: number, floorY: number): string {
  const b = floorY
  switch (kind) {
    case "lobby":
      return `<rect x="28" y="${top + 6}" width="44" height="${FLOOR_H - 19}" rx="6" fill="var(--win)" stroke="#fff" stroke-width="3"/>
        <path d="M50 ${top + 6} V${b - 5} M30 ${top + 26} H70" stroke="#fff" stroke-width="2.5"/>
        <rect x="150" y="${b - 26}" width="74" height="21" rx="7" fill="#b7663d"/><rect x="146" y="${b - 29}" width="82" height="6" rx="3" fill="#d98a58"/>
        <text x="187" y="${top + 16}" text-anchor="middle" class="scenery-text" font-size="11" fill="#7a3d22">${t.reception}</text>
        <rect x="98" y="${b - 17}" width="16" height="12" rx="3" fill="#c96f3b"/><circle cx="106" cy="${b - 24}" r="9" fill="#4caf72"/><circle cx="100" cy="${b - 30}" r="6" fill="#5cc483"/>`
    case "garage":
      return `<rect x="120" y="${b - 22}" width="70" height="16" rx="7" fill="#e85d75"/><rect x="134" y="${b - 32}" width="40" height="12" rx="5" fill="#f28b9c"/>
        <circle cx="136" cy="${b - 5}" r="5" fill="#33384d"/><circle cx="174" cy="${b - 5}" r="5" fill="#33384d"/>
        <path d="M230 ${b - 2} H300" stroke="#f2c94c" stroke-width="3" stroke-dasharray="8 6"/>`
    case "office":
      return `<rect x="130" y="${b - 24}" width="70" height="5" rx="2" fill="#8a5a3b"/><rect x="134" y="${b - 19}" width="4" height="14" fill="#8a5a3b"/><rect x="192" y="${b - 19}" width="4" height="14" fill="#8a5a3b"/>
        <rect x="150" y="${b - 42}" width="28" height="18" rx="3" fill="#33384d"/><rect x="153" y="${b - 39}" width="22" height="12" rx="2" fill="#7fd1e8"/>
        <rect x="232" y="${top + 8}" width="30" height="22" rx="3" fill="#fff" opacity=".8"/><path d="M236 ${top + 24} L244 ${top + 16} L250 ${top + 21} L258 ${top + 12}" stroke="#e85d75" stroke-width="2" fill="none"/>`
    case "cafe":
      return `<rect x="120" y="${b - 26}" width="110" height="21" rx="6" fill="#7b4a33"/><rect x="116" y="${b - 29}" width="118" height="6" rx="3" fill="#a96a48"/>
        <rect x="200" y="${b - 46}" width="22" height="17" rx="4" fill="#c0c4cf"/><rect x="206" y="${b - 38}" width="10" height="6" rx="1" fill="#33384d"/>
        <path d="M160 ${top} V${top + 12}" stroke="#555" stroke-width="1.5"/><path d="M150 ${top + 20} Q160 ${top + 8} 170 ${top + 20}Z" fill="#f2c94c"/>
        <rect x="134" y="${b - 36}" width="8" height="7" rx="2" fill="#fff"/><rect x="148" y="${b - 36}" width="8" height="7" rx="2" fill="#e85d75"/>`
    case "library": {
      const books: string[] = []
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 12; i++) {
          const h = 13 + ((i * 7 + row * 3) % 5)
          books.push(`<rect x="${125 + i * 9.4}" y="${top + 8 + row * 21 + (18 - h)}" width="7.5" height="${h}" rx="1" fill="${BOOK_COLORS[(i + row * 2) % 6]}"/>`)
        }
      }
      return `<rect x="120" y="${top + 4}" width="120" height="${FLOOR_H - 17}" rx="4" fill="#8a5a3b"/>${books.join("")}<rect x="122" y="${top + 26}" width="116" height="3" fill="#6b4329"/>`
    }
    case "gym":
      return `<rect x="120" y="${b - 9}" width="80" height="4" rx="2" fill="#22a99a"/>
        <rect x="140" y="${b - 27}" width="40" height="3" rx="1.5" fill="#555"/><rect x="132" y="${b - 33}" width="9" height="15" rx="3" fill="#33384d"/><rect x="179" y="${b - 33}" width="9" height="15" rx="3" fill="#33384d"/>
        <rect x="230" y="${b - 20}" width="40" height="15" rx="4" fill="#5b8def"/><circle cx="240" cy="${b - 5}" r="3" fill="#33384d"/><circle cx="262" cy="${b - 5}" r="3" fill="#33384d"/>`
    case "lounge":
      return `<rect x="130" y="${b - 20}" width="80" height="15" rx="7" fill="#8e6cd8"/><rect x="126" y="${b - 32}" width="88" height="14" rx="7" fill="#a68ae6"/>
        <rect x="232" y="${b - 17}" width="14" height="12" rx="3" fill="#c96f3b"/><circle cx="239" cy="${b - 26}" r="10" fill="#4caf72"/>
        <path d="M180 ${top} V${top + 10}" stroke="#555" stroke-width="1.5"/><circle cx="180" cy="${top + 14}" r="5" fill="#ffd479"/>`
  }
}

function room(floor: number, geometry: Geometry, index: number): string {
  const facadeX = SHAFT_X + geometry.elevators * SHAFT_W
  const b = geometry.floorBase(floor)
  const top = b - FLOOR_H + 8
  const kind = roomKind(floor, geometry.max)
  const wall = kind === "garage" ? "var(--garage)" : WALLS[index % WALLS.length]
  return [
    `<rect x="${WALL_L}" y="${top}" width="${ROOM_W}" height="${FLOOR_H - 8}" fill="${wall}"/>`,
    `<rect x="${WALL_L}" y="${b - 5}" width="${ROOM_W}" height="5" fill="rgba(0,0,0,.08)"/>`,
    kind === "lobby" || kind === "garage" ? "" : windowPane(36, top),
    furniture(kind, top, b),
    `<rect x="${WALL_L}" y="${top}" width="${ROOM_W}" height="${FLOOR_H - 8}" fill="var(--shade)"/>`,
    `<text x="${WALL_L + 8}" y="${b - 9}" class="scenery-text" font-size="13" fill="rgba(0,0,0,.35)">${t.floorLabel(floor)}</text>`,
    `<rect x="${facadeX + 18}" y="${top + 9}" width="46" height="30" rx="8" fill="var(--win)" stroke="var(--facade-dark)" stroke-width="3"/>`,
    `<rect x="${facadeX + 14}" y="${top + 39}" width="54" height="5" rx="2" fill="var(--facade-dark)"/>`,
  ].join("")
}

export function sceneryMarkup(geometry: Geometry): string {
  const { floors, height, width } = geometry
  const dx = width - 560
  const facadeX = SHAFT_X + geometry.elevators * SHAFT_W
  const facadeW = width - WALL_L - facadeX
  const shafts = Array.from({ length: geometry.elevators }, (_, i) => i)
  const bodyH = floors.length * FLOOR_H
  const groundY = geometry.floorBase(Math.max(geometry.min, Math.min(0, geometry.max))) + 8
  const roofY = TOP - 4
  const parts = [
    `<rect width="${width}" height="${height}" fill="url(#sky)"/>`,
    `<circle cx="70" cy="40" r="16" fill="var(--win)" opacity=".7"/>`,
    `<rect x="0" y="${groundY}" width="${width}" height="${height - groundY}" fill="var(--grass)"/><rect x="0" y="${groundY}" width="${width}" height="12" fill="var(--walk)"/>`,
    ...[[440, 28], [480, 40], [300, 22]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="8" fill="#fff" opacity=".55"/>`),
    `<rect x="${WALL_L - 6}" y="${roofY - 10}" width="${width - 2 * WALL_L + 12}" height="14" rx="6" fill="var(--slab)"/>`,
    `<rect x="150" y="${roofY - 44}" width="160" height="30" rx="12" fill="var(--sign)"/><rect x="170" y="${roofY - 14}" width="6" height="6" fill="#555"/><rect x="284" y="${roofY - 14}" width="6" height="6" fill="#555"/>`,
    `<text x="230" y="${roofY - 24}" text-anchor="middle" class="scenery-text" font-size="16" fill="#fff">${t.buildingName}</text>`,
    `<rect x="${460 + dx}" y="${roofY - 40}" width="40" height="30" rx="10" fill="#9aa7b8"/>`,
    `<rect x="${facadeX}" y="${TOP}" width="${facadeW}" height="${bodyH}" fill="var(--facade)"/>`,
    ...floors.map((floor, i) => room(floor, geometry, i)),
    ...shafts.map((i) => {
      const x = geometry.shaftX(i)
      return `<rect x="${x}" y="${TOP}" width="${SHAFT_W}" height="${bodyH}" fill="var(--shaft-art)"/>
        <rect x="${x + 6}" y="${TOP}" width="3" height="${bodyH}" fill="var(--rail)"/><rect x="${x + SHAFT_W - 9}" y="${TOP}" width="3" height="${bodyH}" fill="var(--rail)"/>`
    }),
    ...floors.map((floor) => {
      const b = geometry.floorBase(floor)
      return `<rect x="${WALL_L - 4}" y="${b}" width="${ROOM_W + 4}" height="8" fill="var(--slab)"/><rect x="${WALL_L - 4}" y="${b}" width="${ROOM_W + 4}" height="2.5" fill="var(--slab-top)"/>
        <rect x="${facadeX}" y="${b}" width="${facadeW + 4}" height="8" fill="var(--slab)"/>
        ${shafts.map((i) => `<rect x="${geometry.shaftX(i) - 4}" y="${b - FLOOR_H + 10}" width="6" height="${FLOOR_H - 10}" rx="2" fill="var(--slab-top)"/>`).join("")}`
    }),
    ...[[28, 14], [520 + dx, 18], [545 + dx, 12]].map(([x, r]) => `<circle cx="${x}" cy="${groundY + 4}" r="${r}" fill="#4caf72"/>`),
  ]
  return parts.join("")
}
