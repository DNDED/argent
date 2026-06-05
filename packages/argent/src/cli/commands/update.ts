import type { ArgentEngine } from "../engine.js"
import { theme } from "../../ui/theme.js"
import { execSync } from "child_process"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

export function updateCommand(engine: ArgentEngine): string {
  const lines: string[] = []

  lines.push("")
  lines.push("╔══════════════════════════════════════════╗")
  lines.push("║       Check for Updates                  ║")
  lines.push("╚══════════════════════════════════════════╝")
  lines.push("")

  let currentVersion = "unknown"
  let latestVersion = ""

  const wd = engine.config.getWorkingDir()
  const pkgPath = join(wd, "package.json")
  const lookupPaths = [join(wd, "package.json"), "/home/trader/argent/package.json"]

  for (const p of lookupPaths) {
    if (existsSync(p)) {
      try {
        const pkg = JSON.parse(readFileSync(p, "utf-8"))
        if (pkg.version) {
          currentVersion = pkg.version
          break
        }
      } catch {
        // continue
      }
    }
  }

  lines.push(`  Current version: ${currentVersion}`)

  try {
    const result = execSync("npm view argent version 2>&1", {
      encoding: "utf-8",
      timeout: 15000,
    })
    latestVersion = result.trim()
  } catch {
    try {
      const registryResult = execSync(
        "curl -s https://registry.npmjs.org/argent/latest 2>/dev/null | node -e \"process.stdin.on('data',d=>{try{console.log(JSON.parse(d).version)}catch(e){}})\" 2>/dev/null || true",
        { encoding: "utf-8", timeout: 15000 }
      )
      latestVersion = registryResult.trim()
    } catch {
      latestVersion = ""
    }
  }

  if (latestVersion) {
    lines.push(`  Latest version:  ${latestVersion}`)
    lines.push("")

    if (currentVersion === latestVersion) {
      lines.push("  ● Already up to date!")
    } else if (currentVersion !== "unknown" && compareVersions(latestVersion, currentVersion) > 0) {
      lines.push("  ● An update is available!")
      lines.push(`  ${currentVersion} → ${latestVersion}`)
      lines.push("")
      lines.push("  Run /install to upgrade to the latest version.")
    } else {
      lines.push("  ● You may be on a development build.")
    }
  } else {
    lines.push("")
    lines.push("  ● Could not check for updates (network issue?).")
  }

  return lines.join("\n")
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}
