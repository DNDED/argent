import type { Agent, ToolContext, ToolResultMessage, UserMessage, AssistantMessage } from "@argent/core"
import { createAnthropicProvider, createOpenAIProvider, createOllamaProvider, type LLMProvider } from "@argent/llm"
import type { ArgentEngine } from "./engine.js"
import { PROVIDERS } from "@argent/integrations"

export interface SwarmTask {
  id: string
  name: string
  description: string
  agentType: string
  model?: string
  maxSteps?: number
  timeoutMs?: number
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  output: string
  startTime?: number
  endTime?: number
  error?: string
}

let taskCounter = 0

export class SwarmEngine {
  private tasks: Map<string, SwarmTask> = new Map()
  private runningTasks: Map<string, AbortController> = new Map()
  private engine: ArgentEngine

  constructor(engine: ArgentEngine) {
    this.engine = engine
  }

  spawn(tasks: Omit<SwarmTask, "id" | "status" | "output">[]): SwarmTask[] {
    return tasks.map((t) => {
      const id = `swarm-${Date.now()}-${++taskCounter}`
      const task: SwarmTask = {
        id,
        name: t.name,
        description: t.description,
        agentType: t.agentType,
        model: t.model,
        maxSteps: t.maxSteps,
        timeoutMs: t.timeoutMs,
        status: "pending",
        output: "",
      }
      this.tasks.set(id, task)
      return task
    })
  }

  async execute(taskId: string, sessionId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)

    const controller = new AbortController()
    this.runningTasks.set(taskId, controller)

    task.status = "running"
    task.startTime = Date.now()

    try {
      const agent = this.engine.config.getAgent(task.agentType)
      if (!agent) throw new Error(`Agent "${task.agentType}" not found`)

      const pc = this.engine.config.getProvider()
      const subSession = this.engine.sessions.create(
        task.agentType,
        { provider: pc?.type || "openai", model: task.model || pc?.model || "" },
        this.engine.config.getWorkingDir()
      )

      const userMsg: UserMessage = {
        role: "user",
        content: [{ type: "text", text: task.description }],
      }
      this.engine.sessions.addMessage(subSession.id, userMsg)

      const provider = this.createTaskProvider(task.model)

      const output = await this.runSwarmAgentLoop(
        subSession.id,
        agent,
        provider,
        controller.signal,
        task.maxSteps
      )

      task.output = output
      task.status = "completed"
    } catch (err) {
      if (controller.signal.aborted) {
        task.status = "cancelled"
        task.error = "Cancelled"
      } else {
        task.status = "failed"
        task.error = err instanceof Error ? err.message : String(err)
      }
    } finally {
      task.endTime = Date.now()
      this.runningTasks.delete(taskId)
    }
  }

  async executeAll(taskIds: string[], sessionId: string): Promise<void> {
    await Promise.all(taskIds.map((id) => this.execute(id, sessionId)))
  }

  cancel(taskId: string): void {
    const controller = this.runningTasks.get(taskId)
    if (controller) {
      controller.abort()
    }
    const task = this.tasks.get(taskId)
    if (task && task.status === "pending") {
      task.status = "cancelled"
    }
  }

  cancelAll(): void {
    for (const taskId of this.runningTasks.keys()) {
      this.cancel(taskId)
    }
  }

  getStatus(taskId: string): SwarmTask | undefined {
    return this.tasks.get(taskId)
  }

  getAllStatuses(): SwarmTask[] {
    return Array.from(this.tasks.values())
  }

  getOutput(taskId: string): string {
    const task = this.tasks.get(taskId)
    if (!task) return "Task not found."
    if (task.status === "pending" || task.status === "running") return "Task still running..."
    if (task.error) return `Error: ${task.error}`
    return task.output || "No output produced."
  }

  private createTaskProvider(overrideModel?: string): LLMProvider {
    const pc = this.engine.config.getProvider()
    if (!pc) throw new Error("No provider configured")

    const model = overrideModel || pc.model || "gpt-4o"

    const desc = Object.values(PROVIDERS).find((p) => {
      if (pc.type === "anthropic" && p.id === "anthropic") return true
      if (pc.type === "ollama" && p.id === "ollama") return true
      if (pc.baseUrl && p.baseUrl === pc.baseUrl) return true
      return false
    }) || undefined

    if (desc?.transport === "anthropic-native" || pc.type === "anthropic") {
      return createAnthropicProvider({
        apiKey: pc.apiKey || "",
        baseUrl: pc.baseUrl || desc?.baseUrl,
        model,
        headers: pc.headers || desc?.headers,
      })
    } else if (pc.type === "ollama" || desc?.id === "ollama") {
      return createOllamaProvider({
        apiKey: pc.apiKey || "ollama",
        baseUrl: pc.baseUrl || desc?.baseUrl,
        model,
      })
    } else {
      return createOpenAIProvider({
        apiKey: pc.apiKey || "",
        baseUrl: pc.baseUrl || desc?.baseUrl,
        model,
        headers: pc.headers || desc?.headers,
      })
    }
  }

  private async runSwarmAgentLoop(
    sessionId: string,
    agent: Agent,
    provider: LLMProvider,
    signal: AbortSignal,
    maxSteps?: number
  ): Promise<string> {
    const maxLoops = maxSteps || 25
    let loopCount = 0
    let finalOutput = ""

    while (loopCount < maxLoops) {
      loopCount++

      if (signal.aborted) throw new Error("Cancelled")

      const messages = this.engine.sessions.getMessages(sessionId)
      const systemMsg = this.buildSystemMessage(agent)

      const allMsgs = [
        { role: "user", content: [{ type: "text", text: systemMsg }] } as UserMessage,
        ...messages,
      ]

      const allowedTools = this.engine.tools.listAllowed(agent.tools)
      const toolDefs = allowedTools.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))

      const response = await provider.chat(allMsgs, toolDefs.length > 0 ? toolDefs : undefined)

      const fullText = response.text
      const toolCalls = response.toolCalls || []

      if (fullText) finalOutput = fullText

      const assistantMsg: AssistantMessage = {
        role: "assistant",
        content: fullText ? [{ type: "text", text: fullText }] : [],
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      }
      this.engine.sessions.addMessage(sessionId, assistantMsg)

      if (toolCalls.length === 0) break

      for (const tc of toolCalls) {
        const ctx: ToolContext = {
          sessionId,
          workingDirectory: this.engine.config.getWorkingDir(),
          agentName: agent.name,
          signal,
        }

        const result = await this.engine.tools.execute(tc.name, tc.arguments, ctx)

        const toolMsg: ToolResultMessage = {
          role: "tool",
          toolCallId: tc.id,
          content: result.content,
        }
        this.engine.sessions.addMessage(sessionId, toolMsg)
      }
    }

    return finalOutput
  }

  private buildSystemMessage(agent: Agent): string {
    const parts = [agent.systemPrompt]
    parts.push(`\nCurrent date: ${new Date().toISOString().split("T")[0]}`)
    parts.push(`Working directory: ${this.engine.config.getWorkingDir()}`)
    const allowed = this.engine.tools.listAllowed(agent.tools)
    parts.push(`\nAvailable tools: ${allowed.map((t) => t.name).join(", ")}`)
    return parts.join("\n")
  }
}
