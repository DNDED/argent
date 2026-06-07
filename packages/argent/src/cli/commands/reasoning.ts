import type { ReasoningLevel } from "@argent/core"

export function reasoningCommand(
  args: string[],
  currentReasoning: ReasoningLevel
): string {
  if (args.length === 0) {
    return renderReasoningList(currentReasoning)
  }

  const input = args[0] ?? ""
  const num = parseInt(input, 10)

  const levels: ReasoningLevel[] = ["low", "medium", "high", "max"]

  if (!isNaN(num) && num >= 1 && num <= levels.length) {
    const selected = levels[num - 1]
    if (!selected) return `Invalid selection: ${num}`
    return `REASONING_SELECT:${selected}`
  }

  const match = levels.find(
    (l) => l === input || l.toLowerCase() === input.toLowerCase()
  )
  if (match) {
    return `REASONING_SELECT:${match}`
  }

  return `Reasoning level "${input}" not found. Use /reasoning to see options.`
}

function renderReasoningList(currentReasoning: ReasoningLevel): string {
  const lines: string[] = []
  const width = 52

  lines.push(`┌${"─".repeat(width)}┐`)
  lines.push(`│  Reasoning Levels${" ".repeat(width - 18)}│`)
  lines.push(`├${"─".repeat(width)}┤`)

  const levels: Array<{ level: ReasoningLevel; desc: string; temp: string }> = [
    { level: "low", desc: "Fast, cheap", temp: "0.3" },
    { level: "medium", desc: "Balanced", temp: "0.7" },
    { level: "high", desc: "More creative", temp: "0.9" },
    { level: "max", desc: "Maximum creativity", temp: "1.0" },
  ]

  for (let i = 0; i < levels.length; i++) {
    const item = levels[i]
    if (!item) continue
    const { level, desc, temp } = item
    const isCurrent = level === currentReasoning
    const marker = isCurrent ? "●" : "○"
    const num = String(i + 1).padStart(2, " ")
    const name = level.padEnd(8, " ")
    const description = desc.padEnd(20, " ")
    const currentLabel = isCurrent ? " ← current" : ""
    const line = `│  ${marker} [${num}] ${name} ${description} temp: ${temp}${currentLabel}${" ".repeat(Math.max(0, width - 50 - currentLabel.length))}│`
    lines.push(line)
  }

  lines.push(`└${"─".repeat(width)}┘`)
  lines.push("")
  lines.push("Use /reasoning <number> or /reasoning <name> to change")

  return lines.join("\n")
}
