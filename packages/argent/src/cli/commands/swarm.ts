import type { SwarmEngine } from "../swarm.js"
import type { ArgentEngine } from "../engine.js"

export function swarmCommand(
  args: string[],
  swarmEngine: SwarmEngine,
  argentEngine: ArgentEngine,
  sessionId: string
): string {
  const sub = args[0]?.toLowerCase()

  if (!sub) {
    const tasks = swarmEngine.getAllStatuses()
    if (tasks.length === 0) return "No active swarm tasks."
    return tasks
      .map((t) => `${t.id}: ${t.name} [${t.status}]${t.error ? ` — ${t.error}` : ""}`)
      .join("\n")
  }

  switch (sub) {
    case "spawn": {
      const description = args.slice(1).join(" ")
      if (!description) return "Usage: /swarm spawn <description>"
      const tasks = swarmEngine.spawn([
        { name: "swarm-task-1", description, agentType: "explore" },
      ])
      swarmEngine.executeAll(
        tasks.map((t) => t.id),
        sessionId
      ).catch(() => {})
      const first = tasks[0]
      return first ? `Spawned swarm task: ${first.id}` : "Failed to spawn task."
    }

    case "status": {
      const tasks = swarmEngine.getAllStatuses()
      if (tasks.length === 0) return "No swarm tasks."
      return tasks
        .map(
          (t) =>
            `${t.id}: ${t.name} [${t.status}] ${t.error || ""}`
        )
        .join("\n")
    }

    case "cancel": {
      const taskId = args[1]
      if (!taskId) return "Usage: /swarm cancel <taskId>"
      swarmEngine.cancel(taskId)
      return `Cancelled task: ${taskId}`
    }

    case "output": {
      const taskId = args[1]
      if (!taskId) return "Usage: /swarm output <taskId>"
      const output = swarmEngine.getOutput(taskId)
      return output
    }

    default:
      return "Usage: /swarm [spawn|status|cancel|output]"
  }
}
