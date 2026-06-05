import type { ArgentEngine } from "../engine.js"
import { theme } from "../../ui/theme.js"
import { execSync } from "child_process"

export function installCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Install / Upgrade ARGENT            ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const method = args[0]?.toLowerCase()

  if (method === "npm" || !method) {
    lines.push("  Installing via npm...")
    try {
      const result = execSync("npm install -g argent@latest 2>&1", {
        encoding: "utf-8",
        timeout: 60000,
      })
      const trimmed = result.trim()
      if (trimmed) {
        for (const l of trimmed.split("\n").slice(0, 10)) {
          lines.push(`  ${l.trim()}`)
        }
      }
      lines.push("")
      lines.push("  ● Installation complete!")
      lines.push("  Restart ARGENT to use the new version.")
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string }
      const output = (e.stdout || e.stderr || "").trim()
      if (output) {
        for (const l of output.split("\n").slice(0, 10)) {
          lines.push(`  ${l.trim()}`)
        }
      }
      lines.push("")
      lines.push(`  ● Installation failed: ${e.message || "Unknown error"}`)
      lines.push("  Try running manually: npm install -g argent@latest")
    }
  } else if (method === "bun") {
    lines.push("  Installing via bun...")
    try {
      const result = execSync("bun install -g argent@latest 2>&1", {
        encoding: "utf-8",
        timeout: 60000,
      })
      const trimmed = result.trim()
      if (trimmed) {
        for (const l of trimmed.split("\n").slice(0, 10)) {
          lines.push(`  ${l.trim()}`)
        }
      }
      lines.push("")
      lines.push("  ● Installation complete!")
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string }
      lines.push(`  ● Installation failed: ${e.message || "Unknown error"}`)
    }
  } else if (method === "build" || method === "source") {
    const wd = engine.config.getWorkingDir()
    lines.push("  Building from source...")
    try {
      const result = execSync("bun run build 2>&1", {
        encoding: "utf-8",
        timeout: 120000,
        cwd: wd,
      })
      lines.push("  ● Build complete!")
      lines.push("  Run: bun packages/argent/dist/main.js")
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string }
      lines.push(`  ● Build failed: ${e.message || "Unknown error"}`)
    }
  } else {
    lines.push(`  Unknown method: ${method}`)
    lines.push("")
    lines.push("  Usage:")
    lines.push("    /install          Install via npm (default)")
    lines.push("    /install npm      Install via npm")
    lines.push("    /install bun      Install via bun")
    lines.push("    /install source   Build from source")
  }

  return lines.join("\n")
}
