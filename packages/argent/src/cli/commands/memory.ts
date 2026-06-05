import type { ArgentEngine } from "../engine.js"
import { theme } from "../../ui/theme.js"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"

export function memoryCommand(args: string[], engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Persistent Memory (MEMORY.md)       ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const wd = engine.config.getWorkingDir()
  const memoryPath = join(wd, "MEMORY.md")

  if (args.length === 0) {
    if (!existsSync(memoryPath)) {
      lines.push("  No MEMORY.md file found.")
      lines.push("")
      lines.push("  Use /memory <content> to create one.")
      lines.push("  The assistant will reference this file")
      lines.push("  for persistent context across sessions.")
      return lines.join("\n")
    }

    const content = readFileSync(memoryPath, "utf-8")
    lines.push(`  MEMORY.md (${memoryPath})`)
    lines.push("")
    lines.push("  ── Content ──")
    lines.push("")

    const contentLines = content.split("\n")
    for (const l of contentLines.slice(0, 40)) {
      lines.push(`  ${l}`)
    }
    if (contentLines.length > 40) {
      lines.push(`  ... (${contentLines.length - 40} more lines)`)
    }

    lines.push("")
    lines.push("  Use /memory <text> to append content.")
    lines.push("  Use /memory edit to open for editing.")
    return lines.join("\n")
  }

  const subcmd = args[0]?.toLowerCase() ?? ""

  if (subcmd === "edit") {
    try {
      const { execSync } = require("child_process")
      const editor = process.env.EDITOR || process.env.VISUAL || "nano"
      execSync(`${editor} ${memoryPath}`, { stdio: "inherit", timeout: 300000 })
      lines.push("  ● MEMORY.md updated.")
    } catch {
      lines.push("  ● Could not open editor.")
      lines.push(`  File is at: ${memoryPath}`)
    }
    return lines.join("\n")
  }

  if (subcmd === "clear") {
    try {
      writeFileSync(memoryPath, "", "utf-8")
      lines.push("  ● MEMORY.md cleared.")
    } catch (err) {
      lines.push(`  Error: ${err instanceof Error ? err.message : String(err)}`)
    }
    return lines.join("\n")
  }

  if (subcmd === "delete") {
    try {
      const { unlinkSync } = require("fs")
      unlinkSync(memoryPath)
      lines.push("  ● MEMORY.md deleted.")
    } catch (err) {
      lines.push(`  Error: ${err instanceof Error ? err.message : String(err)}`)
    }
    return lines.join("\n")
  }

  const appendText = args.join(" ")

  try {
    if (existsSync(memoryPath)) {
      const existing = readFileSync(memoryPath, "utf-8")
      const append = `\n\n---\n${appendText}\n`
      writeFileSync(memoryPath, existing + append, "utf-8")
    } else {
      writeFileSync(memoryPath, `# MEMORY\n\n${appendText}\n`, "utf-8")
    }
    lines.push("  ● Content appended to MEMORY.md")
    lines.push(`  ${appendText.slice(0, 60)}${appendText.length > 60 ? "..." : ""}`)
  } catch (err) {
    lines.push(`  Error: ${err instanceof Error ? err.message : String(err)}`)
  }

  return lines.join("\n")
}
