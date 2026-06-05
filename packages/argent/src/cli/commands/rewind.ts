import type { ArgentEngine } from "../engine.js"
import { theme } from "../../ui/theme.js"

export function rewindCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Rewind — Choose Checkpoint         ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  if (!engine.sessionId) {
    lines.push("  No active session to rewind.")
    return lines.join("\n")
  }

  const session = engine.sessions.get(engine.sessionId)
  if (!session) {
    lines.push("  Session not found.")
    return lines.join("\n")
  }

  const messages = session.messages
  const checkpoints: Array<{ index: number; type: string; preview: string }> = []

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (!msg) continue
    if (msg.role === "user") {
      const text = msg.content?.[0]?.text ?? "(no text)"
      const preview = text.length > 50 ? text.slice(0, 47) + "..." : text
      checkpoints.push({ index: i, type: "user", preview })
    }
  }

  if (checkpoints.length === 0) {
    lines.push("  No checkpoints available in this session.")
    return lines.join("\n")
  }

  lines.push("  Choose a checkpoint to rewind to:")
  lines.push("")
  lines.push(`  ┌${"─".repeat(62)}┐`)
  lines.push(`  │  #    Type     Preview                                    │`)
  lines.push(`  ├${"─".repeat(62)}┤`)

  for (const cp of checkpoints) {
    const num = String(cp.index + 1).padStart(3, " ")
    const type = cp.type.padEnd(8, " ")
    const preview = cp.preview.padEnd(42, " ").slice(0, 42)
    lines.push(`  │ ${num}  ${type} ${preview} │`)
  }

  lines.push(`  └${"─".repeat(62)}┘`)
  lines.push("")
  lines.push("  Use /rewind <number> to jump to a checkpoint.")
  lines.push("  ─────────────────────────────────────────────")
  lines.push("  Options:")
  lines.push("    code         Revert code changes only")
  lines.push("    conversation Revert conversation only")
  lines.push("    both         Revert both (default)")

  return lines.join("\n")
}
