export const theme = {
  colors: {
    bg: "#08080c",
    surface: "#0f0f16",
    surfaceRaised: "#16161f",
    surfaceOverlay: "#1c1c28",
    surfaceElevated: "#22222f",
    border: "#1f1f2e",
    borderSubtle: "#181825",
    borderFocus: "#3d3d5c",
    borderAccent: "rgba(99, 102, 241, 0.3)",
    accent: "#818cf8",
    accentBright: "#a5b4fc",
    accentDim: "#6366f1",
    accentAlt: "#c084fc",
    accentTertiary: "#22d3ee",
    accentGlow: "rgba(129, 140, 248, 0.12)",
    accentGlowStrong: "rgba(129, 140, 248, 0.25)",
    text: "#c8c8d8",
    textDim: "#6b6b82",
    textMuted: "#4a4a5e",
    textBright: "#f0f0f8",
    textWhite: "#ffffff",
    success: "#34d399",
    successDim: "rgba(52, 211, 153, 0.15)",
    warning: "#fbbf24",
    warningDim: "rgba(251, 191, 36, 0.15)",
    error: "#fb7185",
    errorDim: "rgba(251, 113, 133, 0.15)",
    info: "#60a5fa",
    code: "#c4b5fd",
    keyword: "#818cf8",
    string: "#34d399",
    number: "#fbbf24",
    comment: "#4a4a5e",
    tag: "#fb7185",
    attribute: "#22d3ee",
  },
  fonts: {
    ui: "Geist, Inter, system-ui",
    code: "JetBrains Mono, Fira Code, monospace",
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    full: "9999px",
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    xxl: 28,
    xxxl: 36,
  },
  borders: {
    thin: "─",
    light: "╌",
    dotted: "┄",
    double: "═",
    round: "╭╮╰╯",
    heavy: "┏┓┗┛",
    vertical: "│",
    verticalLight: "┊",
    branch: "├",
    branchLast: "└",
    connector: "─",
    dot: "●",
    dotEmpty: "○",
    diamond: "◆",
    diamondEmpty: "◇",
    arrow: "▸",
    arrowLeft: "◂",
    bullet: "•",
    dash: "–",
    block: "█",
    blockLight: "░",
    blockMedium: "▒",
  },
} as const

export function gradient(start: string, end: string, steps: number): string[] {
  const sr = parseInt(start.slice(1, 3), 16)
  const sg = parseInt(start.slice(3, 5), 16)
  const sb = parseInt(start.slice(5, 7), 16)
  const er = parseInt(end.slice(1, 3), 16)
  const eg = parseInt(end.slice(3, 5), 16)
  const eb = parseInt(end.slice(5, 7), 16)

  const colors: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const ease = t * t * (3 - 2 * t)
    const r = Math.round(sr + (er - sr) * ease)
    const g = Math.round(sg + (eg - sg) * ease)
    const b = Math.round(sb + (eb - sb) * ease)
    colors.push(`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`)
  }
  return colors
}

export function multiGradient(stops: string[], steps: number): string[] {
  if (stops.length < 2) return Array(steps).fill(stops[0] || "#ffffff")
  const segmentSize = Math.ceil(steps / (stops.length - 1))
  const colors: string[] = []
  for (let i = 0; i < stops.length - 1; i++) {
    const seg = gradient(stops[i]!, stops[i + 1]!, segmentSize)
    colors.push(...seg)
  }
  return colors.slice(0, steps)
}

export function fadeText(text: string, color: string, steps: number = 8): string[] {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  const colors: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = 1 - (i / (steps - 1)) * 0.7
    const fr = Math.round(r * t)
    const fg = Math.round(g * t)
    const fb = Math.round(b * t)
    colors.push(`#${fr.toString(16).padStart(2, "0")}${fg.toString(16).padStart(2, "0")}${fb.toString(16).padStart(2, "0")}`)
  }
  return colors
}

export function horizontalRule(width: number, char: string = "─"): string {
  return char.repeat(Math.max(0, width))
}
