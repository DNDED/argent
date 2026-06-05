import type { ArgentEngine } from "../engine.js"
import { theme } from "../../ui/theme.js"

export type ArgentTheme = "dark" | "light" | "high-contrast"

let currentTheme: ArgentTheme = "dark"

export function getCurrentTheme(): ArgentTheme {
  return currentTheme
}

export function themeCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Theme                              ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const themes: Array<{ name: ArgentTheme; label: string; description: string }> = [
    { name: "dark", label: "Dark", description: "Deep indigo background, soft white text" },
    { name: "light", label: "Light", description: "Clean white background, dark text" },
    { name: "high-contrast", label: "High Contrast", description: "Black background, bright white text" },
  ]

  const arg = args[0]?.toLowerCase()

  if (!arg) {
    lines.push(`  Current theme: ${currentTheme}`)
    lines.push("")
    lines.push("  Available themes:")
    lines.push("")

    for (const t of themes) {
      const marker = t.name === currentTheme ? "●" : "○"
      lines.push(`  ${marker} ${t.label.padEnd(16)} — ${t.description}`)
    }

    lines.push("")
    lines.push("  Use /theme <name> to switch.")
    lines.push("  Names: dark, light, high-contrast")
    return lines.join("\n")
  }

  const match = themes.find(
    (t) => t.name === arg || t.label.toLowerCase() === arg
  )

  if (!match) {
    lines.push(`  Theme "${arg}" not found.`)
    lines.push("  Available: dark, light, high-contrast")
    return lines.join("\n")
  }

  currentTheme = match.name

  lines.push(`  ● Switched to ${match.label} theme.`)
  lines.push(`  ${match.description}`)
  lines.push("")
  lines.push("  Note: Theme changes apply to the TUI.")
  lines.push("  Restart ARGENT if visual changes are not reflected.")

  return lines.join("\n")
}
