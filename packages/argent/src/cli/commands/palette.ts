import type { ArgentEngine } from "../engine.js"
import { theme } from "../../ui/theme.js"

export interface PaletteAction {
  id: string
  label: string
  description: string
  shortcut?: string
  handler: () => string
}

export function paletteCommand(engine: ArgentEngine): string {
  return `PALETTE_OPEN`
}

export function getPaletteActions(engine: ArgentEngine): PaletteAction[] {
  return [
    { id: "provider", label: "Change Provider",   description: "Switch AI provider",                        shortcut: "Ctrl+P", handler: () => "" },
    { id: "model",    label: "Change Model",       description: "Switch the AI model",                      shortcut: "Ctrl+M", handler: () => "" },
    { id: "agent",    label: "Switch Agent",       description: "Change the active agent (build/plan)",     shortcut: "Tab",    handler: () => "" },
    { id: "compact",  label: "Compact Session",    description: "Summarize and reduce context",                                     handler: () => "" },
    { id: "fork",     label: "Fork Session",       description: "Create a copy at this point",                                     handler: () => "" },
    { id: "resume",   label: "Resume Session",     description: "Switch to a past session",                                        handler: () => "" },
    { id: "rewind",   label: "Rewind",             description: "Jump to a checkpoint",                                             handler: () => "" },
    { id: "diff",     label: "Show Diffs",         description: "View all pending changes",                                         handler: () => "" },
    { id: "review",   label: "Code Review",        description: "Review changes before commit",                                     handler: () => "" },
    { id: "lint",     label: "Run Linter",         description: "Check code quality",                                               handler: () => "" },
    { id: "security", label: "Security Scan",      description: "Scan for vulnerabilities",                                         handler: () => "" },
    { id: "test",     label: "Run Tests",          description: "Execute test suite",                                               handler: () => "" },
    { id: "cost",     label: "Cost Breakdown",     description: "Show token usage and pricing",                                     handler: () => "" },
    { id: "doctor",   label: "Doctor",             description: "Diagnose configuration issues",                                    handler: () => "" },
    { id: "stats",    label: "Statistics",         description: "Show session and tool usage stats",                                handler: () => "" },
    { id: "context",  label: "Context Usage",      description: "Show context window token breakdown",                              handler: () => "" },
    { id: "history",  label: "Command History",    description: "Recent commands",                                   shortcut: "Ctrl+R", handler: () => "" },
    { id: "spec",     label: "Start Spec",         description: "Spec-driven development interview",                                handler: () => "" },
    { id: "init",     label: "Initialize",         description: "Generate AGENTS.md for this project",                              handler: () => "" },
    { id: "pr",       label: "Create PR",          description: "Open a pull request with changes",                                 handler: () => "" },
    { id: "theme",    label: "Switch Theme",       description: "Change UI theme (dark/light/contrast)",                            handler: () => "" },
    { id: "vim",      label: "Toggle Vim Mode",    description: "Enable vim keybindings",                                           handler: () => "" },
    { id: "voice",    label: "Toggle Voice Input", description: "Enable voice-to-text input",                                       handler: () => "" },
    { id: "help",     label: "Show Help",          description: "Display all available commands",                                   handler: () => "" },
    { id: "status",   label: "Show Status",        description: "Current provider, model, agent info",                              handler: () => "" },
    { id: "setup",    label: "Setup Wizard",       description: "Re-run first-time configuration",                                  handler: () => "" },
    { id: "shortcuts",label: "Keyboard Shortcuts", description: "Show all keybindings",                              shortcut: "Ctrl+K, Ctrl+S", handler: () => "" },
    { id: "clear",    label: "Clear Session",      description: "Start a fresh session",                                           handler: () => "" },
    { id: "undo",     label: "Undo",               description: "Revert last change",                                               handler: () => "" },
    { id: "quit",     label: "Quit ARGENT",        description: "Exit the application",                              shortcut: "Ctrl+C", handler: () => "" },
  ]
}
