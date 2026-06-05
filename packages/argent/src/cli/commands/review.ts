import type { ArgentEngine } from "../engine.js"
import { theme } from "../../ui/theme.js"
import { execSync } from "child_process"

export function reviewCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Code Review — Pending Changes       ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const wd = engine.config.getWorkingDir()

  try {
    const statOutput = execSync("git diff --stat", { cwd: wd, encoding: "utf-8", timeout: 10000 })

    if (!statOutput.trim()) {
      lines.push("  No pending changes to review.")
      return lines.join("\n")
    }

    const summaryLine = statOutput.trim().split("\n").pop() || ""
    lines.push(`  Summary: ${summaryLine}`)
    lines.push("")

    const changedFiles = execSync("git diff --name-only", { cwd: wd, encoding: "utf-8", timeout: 10000 })
      .trim()
      .split("\n")
      .filter(Boolean)

    lines.push("  Changed files:")
    lines.push("")
    for (const file of changedFiles) {
      const ext = file.split(".").pop()?.toLowerCase() ?? ""
      const icon = getFileIcon(ext)
      lines.push(`  ${icon}  ${file}`)
    }

    lines.push("")
    lines.push("  ── Review Checklist ──")
    lines.push(`    ○  No hardcoded secrets or API keys`)
    lines.push(`    ○  Error handling present`)
    lines.push(`    ○  No debug/leftover code`)
    lines.push(`    ○  Types are correct`)
    lines.push(`    ○  Follows project conventions`)

    let warnings: string[] = []

    try {
      const fullDiff = execSync("git diff", { cwd: wd, encoding: "utf-8", timeout: 10000, maxBuffer: 500 * 1024 })

      if (fullDiff.includes("TODO") || fullDiff.includes("FIXME") || fullDiff.includes("HACK")) {
        warnings.push("  ● TODOs/FIXMEs/HACKs found in diff")
      }

      const secretPatterns = [
        /['"][A-Za-z0-9+/]{40,}['"]/,
        /sk-[A-Za-z0-9]{32,}/,
        /AIza[0-9A-Za-z_-]{32,}/,
        /ghp_[A-Za-z0-9]{36,}/,
        /-----BEGIN.*PRIVATE KEY-----/,
      ]

      for (const pattern of secretPatterns) {
        if (pattern.test(fullDiff)) {
          warnings.push("  ● Potential secret/credential detected in diff!")
          break
        }
      }

      if (fullDiff.includes("console.log") || fullDiff.includes("console.debug")) {
        warnings.push("  ● Console statements found — remove before commit")
      }

      if (fullDiff.includes("debugger")) {
        warnings.push("  ● debugger statement found")
      }
    } catch {
      // silent
    }

    if (warnings.length > 0) {
      lines.push("")
      lines.push("  ── Warnings ──")
      for (const w of warnings) {
        lines.push(w)
      }
    } else {
      lines.push("")
      lines.push("  ● No automated issues detected.")
    }

    lines.push("")
    lines.push("  Ready to commit? Use /pr to create a pull request.")

  } catch (err) {
    lines.push(`  Error: ${err instanceof Error ? err.message : String(err)}`)
    lines.push("  Make sure this is a git repository.")
  }

  return lines.join("\n")
}

function getFileIcon(ext: string): string {
  const icons: Record<string, string> = {
    ts: "[TS]",
    tsx: "[TX]",
    js: "[JS]",
    jsx: "[JX]",
    json: "{ }",
    md: "[MD]",
    css: "[# ]",
    html: "<>",
    yml: "[Y]",
    yaml: "[Y]",
    toml: "[T]",
    sh: "[SH]",
    bash: "[SH]",
    py: "[PY]",
    rs: "[RS]",
    go: "[GO]",
    java: "[JV]",
    rb: "[RB]",
  }
  return icons[ext] ?? "   "
}
