import type { ArgentEngine } from "../engine.js"
import { theme } from "../../ui/theme.js"
import { execSync } from "child_process"
import { existsSync } from "fs"
import { join } from "path"

export function doctorCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       ARGENT Doctor — Diagnostics         ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  const checks: Array<{ name: string; status: "pass" | "warn" | "fail"; detail: string }> = []

  const desc = engine.getCurrentProviderDescriptor()
  const pc = engine.config.getProvider()

  if (!pc) {
    checks.push({ name: "Provider Config", status: "fail", detail: "No provider configured. Run /setup." })
  } else if (!desc) {
    checks.push({ name: "Provider Config", status: "warn", detail: `Provider type '${pc.type}' set but descriptor not resolved.` })
  } else {
    checks.push({ name: "Provider Config", status: "pass", detail: `${desc.name} (${desc.id}) configured.` })
  }

  if (!pc || pc.type === "none") {
    checks.push({ name: "API Key", status: "fail", detail: "No API key set." })
  } else if (desc?.authType === "oauth") {
    const token = engine.getOAuthManager().getToken(desc.id)
    if (token) {
      checks.push({ name: "OAuth Token", status: "pass", detail: `Authenticated (expires: ${new Date(token.expiresAt).toLocaleDateString()}).` })
    } else {
      checks.push({ name: "OAuth Token", status: "fail", detail: "Not authenticated. Run /oauth <provider>." })
    }
  } else if (desc?.authType === "none") {
    checks.push({ name: "API Key", status: "pass", detail: "No auth required for this provider." })
  } else if (pc.apiKey && pc.apiKey.length > 0) {
    checks.push({ name: "API Key", status: "pass", detail: `Key set (${pc.apiKey.slice(0, 6)}...${pc.apiKey.slice(-4)}).` })
  } else {
    const envVar = desc?.envVars?.[0]
    if (envVar && process.env[envVar]) {
      checks.push({ name: "API Key", status: "pass", detail: `Found via ${envVar} env var.` })
    } else {
      checks.push({ name: "API Key", status: "fail", detail: `No API key found. Set ${envVar || "API key"} in env or /setup.` })
    }
  }

  try {
    execSync("node --version", { encoding: "utf-8", timeout: 5000 })
    checks.push({ name: "Node.js", status: "pass", detail: process.version })
  } catch {
    checks.push({ name: "Node.js", status: "fail", detail: "Node.js not found." })
  }

  const isBun = typeof (globalThis as unknown as Record<string, unknown>)?.Bun !== "undefined"
  if (isBun) {
    checks.push({ name: "Bun Runtime", status: "pass", detail: "Running on Bun." })
  }

  try {
    execSync("git --version", { encoding: "utf-8", timeout: 5000 })
    const version = execSync("git --version", { encoding: "utf-8", timeout: 5000 }).trim()
    checks.push({ name: "Git", status: "pass", detail: version })
  } catch {
    checks.push({ name: "Git", status: "warn", detail: "Git not found (some features limited)." })
  }

  try {
    const https = require("https")
    checks.push({ name: "HTTPS Connectivity", status: "pass", detail: "Module available." })
  } catch {
    checks.push({ name: "HTTPS Connectivity", status: "warn", detail: "https module unavailable." })
  }

  if (pc?.baseUrl) {
    checks.push({ name: "Custom Base URL", status: "pass", detail: pc.baseUrl })
  }

  const wd = engine.config.getWorkingDir()
  checks.push({ name: "Working Directory", status: "pass", detail: wd })

  const gitDir = existsSync(join(wd, ".git"))
  checks.push({
    name: "Git Repository",
    status: gitDir ? "pass" : "warn",
    detail: gitDir ? "Initialized." : "Not a git repo.",
  })

  const agent = engine.getAgent()
  if (agent) {
    checks.push({ name: "Active Agent", status: "pass", detail: `/${agent.name} — ${agent.description}` })
  }

  const passCount = checks.filter((c) => c.status === "pass").length
  const warnCount = checks.filter((c) => c.status === "warn").length
  const failCount = checks.filter((c) => c.status === "fail").length

  lines.push(`  ┌${"─".repeat(62)}┐`)

  for (const check of checks) {
    const icon = check.status === "pass" ? "●" : check.status === "warn" ? "◇" : "○"
    const name = check.name.padEnd(22, " ")
    const detail = check.detail.length > 34 ? check.detail.slice(0, 32) + ".." : check.detail
    lines.push(`  │ ${icon} ${name} ${detail.padEnd(34, " ")} │`)
  }

  lines.push(`  └${"─".repeat(62)}┘`)
  lines.push("")
  lines.push(`  ${passCount} passed, ${warnCount} warnings, ${failCount} failures`)

  if (failCount > 0) {
    lines.push("")
    lines.push("  Fix failures before using ARGENT:")
    if (!pc || pc.type === "none") {
      lines.push("    → Run /setup to configure a provider")
    }
    if (pc && pc.type !== "none" && desc?.authType !== "none" && desc?.authType !== "oauth" && !pc.apiKey) {
      lines.push(`    → Set ${desc?.envVars?.[0] || "API_KEY"} environment variable`)
    }
    if (desc?.authType === "oauth") {
      lines.push(`    → Run /oauth ${desc.id} to authenticate`)
    }
  }

  return lines.join("\n")
}
