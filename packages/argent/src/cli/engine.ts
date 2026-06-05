import type { ProviderConfig, Agent, Message, UserMessage, AssistantMessage, ToolResultMessage, ToolCall, ToolResult, ToolPermission } from "@argent/core"
import { ConfigService, SessionService, ToolRegistry, PermissionService } from "@argent/core"
import { createAnthropicProvider, createOpenAIProvider, createOllamaProvider, type LLMProvider, type ProviderStreamEvent } from "@argent/llm"
import { PROVIDERS, getProvider, listProviders, findProviderByEnvVar, OAuthManager } from "@argent/integrations"
import type { ProviderDescriptor } from "@argent/integrations"
import { builtinTools } from "../tools/index.js"
import { theme } from "../ui/theme.js"

export type UIEvent =
  | { type: "message"; message: Message }
  | { type: "stream_start" }
  | { type: "stream_delta"; text: string }
  | { type: "stream_stop"; usage?: { inputTokens: number; outputTokens: number } }
  | { type: "tool_call"; toolCall: ToolCall }
  | { type: "tool_result"; result: ToolResult; toolCallId: string }
  | { type: "permission_needed"; toolName: string; reason: string }
  | { type: "permission_denied"; toolName: string }
  | { type: "error"; message: string }
  | { type: "status"; tokensIn: number; tokensOut: number; latency: number }

export class ArgentEngine {
  config: ConfigService
  sessions: SessionService
  tools: ToolRegistry
  permissions: PermissionService
  provider: LLMProvider | null = null
  sessionId: string | null = null
  onEvent: (event: UIEvent) => void = () => {}
  private totalTokensIn = 0
  private totalTokensOut = 0
  private permissionQueue: Array<{ resolve: (v: boolean) => void; sessionId: string; toolName: string }> = []
  private onceAllowed: Set<string> = new Set()
  private oauthManager: OAuthManager
  private currentProviderDescriptor: ProviderDescriptor | null = null
  private abortController: AbortController | null = null
  private systemPromptSent = false

  constructor(workingDir?: string) {
    this.config = new ConfigService(workingDir)
    this.sessions = new SessionService()
    this.tools = new ToolRegistry()
    this.permissions = new PermissionService(this.config.getConfig().permission || {})
    this.oauthManager = new OAuthManager()

    this.tools.registerAll(builtinTools)

    this.permissions.setHandler(async (req) => {
      this.onEvent({ type: "permission_needed", toolName: req.toolName, reason: req.reason })
      return new Promise((resolve) => {
        this.permissionQueue.push({ resolve, sessionId: req.sessionId, toolName: req.toolName })
      })
    })

    this.autoDetectProvider()
    this.initProvider()
  }

  setEventEmitter(fn: (event: UIEvent) => void): void {
    this.onEvent = fn
  }

  private autoDetectProvider(): void {
    const existing = this.config.getProvider()
    if (existing && existing.type !== "none") return

    const detected = findProviderByEnvVar()
    if (detected) {
      const firstEnvVar = detected.envVars[0]
      const apiKey = firstEnvVar ? process.env[firstEnvVar] || "" : ""
      this.currentProviderDescriptor = detected
      this.config.setProvider({
        type: detected.transport === "anthropic-native" ? "anthropic" : detected.transport === "custom" ? "openai-compatible" : detected.transport === "gemini" ? "openai-compatible" : "openai",
        apiKey,
        model: detected.defaultModel,
        baseUrl: detected.baseUrl,
        headers: detected.headers,
      })
      this.onEvent({ type: "status", tokensIn: 0, tokensOut: 0, latency: 0 })
    }
  }

  initProvider(): void {
    const pc = this.config.getProvider()
    if (!pc) {
      return
    }

    const desc = this.currentProviderDescriptor || this.resolveDescriptor(pc)

    if (desc?.transport === "anthropic-native" || pc.type === "anthropic") {
      this.provider = createAnthropicProvider({
        apiKey: pc.apiKey || "",
        baseUrl: pc.baseUrl || desc?.baseUrl,
        model: pc.model || desc?.defaultModel || "claude-sonnet-4-20250514",
        headers: pc.headers || desc?.headers,
      })
    } else if (pc.type === "ollama" || desc?.id === "ollama") {
      this.provider = createOllamaProvider({
        apiKey: pc.apiKey || "ollama",
        baseUrl: pc.baseUrl || desc?.baseUrl,
        model: pc.model || desc?.defaultModel || "qwen2.5-coder:7b",
      })
    } else {
      this.provider = createOpenAIProvider({
        apiKey: pc.apiKey || "",
        baseUrl: pc.baseUrl || desc?.baseUrl,
        model: pc.model || desc?.defaultModel || "gpt-4o",
        headers: pc.headers || desc?.headers,
      })
    }
  }

  private resolveDescriptor(pc: ProviderConfig): ProviderDescriptor | null {
    if (this.currentProviderDescriptor) return this.currentProviderDescriptor
    const match = Object.values(PROVIDERS).find((p) => {
      if (pc.type === "anthropic" && p.id === "anthropic") return true
      if (pc.type === "ollama" && p.id === "ollama") return true
      if (pc.baseUrl && p.baseUrl === pc.baseUrl) return true
      return false
    })
    return match || null
  }

  setProvider(providerId: string, apiKey?: string): boolean {
    const desc = getProvider(providerId)
    if (!desc) return false

    this.currentProviderDescriptor = desc

    const key = apiKey || (desc.envVars[0] ? process.env[desc.envVars[0]] || "" : "")

    let type: ProviderConfig["type"] = "openai"
    if (desc.transport === "anthropic-native") type = "anthropic"
    else if (desc.id === "ollama") type = "ollama"
    else if (desc.transport === "custom") type = "openai-compatible"

    if (desc.authType === "oauth") {
      const token = this.oauthManager.getToken(desc.id)
      if (token) {
        this.config.setProvider({
          type,
          apiKey: token.accessToken,
          model: desc.defaultModel,
          baseUrl: desc.baseUrl,
          headers: desc.headers,
        })
      } else {
        this.config.setProvider({
          type,
          apiKey: "",
          model: desc.defaultModel,
          baseUrl: desc.baseUrl,
          headers: desc.headers,
        })
      }
    } else {
      this.config.setProvider({
        type,
        apiKey: key,
        model: desc.defaultModel,
        baseUrl: desc.baseUrl,
        headers: desc.headers,
      })
    }

    this.initProvider()
    return true
  }

  setModel(modelName: string): void {
    const pc = this.config.getProvider()
    if (!pc) return
    this.config.setProvider({
      ...pc,
      model: modelName,
      type: pc.type || "openai",
    })
    this.initProvider()
  }

  getAvailableModels(): string[] {
    if (this.currentProviderDescriptor) {
      return this.currentProviderDescriptor.models
    }
    const pc = this.config.getProvider()
    if (!pc) return []
    const desc = Object.values(PROVIDERS).find((p) => p.models.includes(pc.model || ""))
    return desc?.models || []
  }

  getCurrentProviderDescriptor(): ProviderDescriptor | null {
    return this.currentProviderDescriptor
  }

  getCurrentProviderId(): string | null {
    return this.currentProviderDescriptor?.id || null
  }

  getOAuthManager(): OAuthManager {
    return this.oauthManager
  }

  emitStatusMessage(msg: string): void {
    this.onEvent({ type: "error", message: msg })
  }

  hasProvider(): boolean {
    const pc = this.config.getProvider()
    if (!pc) return false
    if (this.currentProviderDescriptor?.authType === "oauth") {
      return this.oauthManager.getToken(this.currentProviderDescriptor.id) !== undefined
    }
    if (this.currentProviderDescriptor?.authType === "none") return true
    return !!(pc.apiKey && pc.apiKey.length > 0)
  }

  getAgent(): Agent | undefined {
    if (!this.sessionId) return this.config.getAgent("build")
    const session = this.sessions.get(this.sessionId)
    if (!session) return this.config.getAgent("build")
    return this.config.getAgent(session.agentName)
  }

  getAgents(): Agent[] {
    return this.config.getAgents()
  }

  switchAgent(name: string): Agent | undefined {
    const agent = this.config.getAgent(name)
    if (!agent) return undefined
    if (this.sessionId) this.sessions.switchAgent(this.sessionId, name)
    return agent
  }

  getProviderInfo(): { name: string; model: string } {
    const pc = this.config.getProvider()
    const descName = this.currentProviderDescriptor?.name
    return {
      name: descName || pc?.type || "none",
      model: pc?.model || "unknown",
    }
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.provider) {
      this.initProvider()
      if (!this.provider) {
        this.onEvent({ type: "error", message: "No provider configured." })
        return
      }
    }

    this.abortController = new AbortController()

    if (!this.sessionId) {
      const agent = this.getAgent() || this.config.getAgent("build")!
      const pc = this.config.getProvider()!
      const session = this.sessions.create(
        agent.name,
        { provider: pc.type, model: pc.model || "" },
        this.config.getWorkingDir()
      )
      this.sessionId = session.id
      this.systemPromptSent = false
    }

    const agent = this.getAgent()!

    const userMsg: UserMessage = {
      role: "user",
      content: [{ type: "text", text }],
    }
    this.sessions.addMessage(this.sessionId, userMsg)
    this.onEvent({ type: "message", message: userMsg })

    await this.runAgentLoop(agent)
  }

  cancelStreaming(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
      this.onEvent({ type: "stream_stop" })
    }
  }

  undoLastExchange(): void {
    if (!this.sessionId) return
    this.sessions.undo(this.sessionId)
    this.systemPromptSent = false
    const msgs = this.sessions.getMessages(this.sessionId)
    for (const msg of msgs) {
      this.onEvent({ type: "message", message: msg })
    }
  }

  private async runAgentLoop(agent: Agent): Promise<void> {
    const maxLoops = 25
    let loopCount = 0

    while (loopCount < maxLoops) {
      loopCount++
      const messages = this.sessions.getMessages(this.sessionId!)

      let allMsgs: Message[]
      if (!this.systemPromptSent) {
        const systemMsg = this.buildSystemMessage(agent)
        allMsgs = [
          { role: "user", content: [{ type: "text", text: systemMsg }] } as UserMessage,
          ...messages,
        ]
        this.systemPromptSent = true
      } else {
        allMsgs = messages
      }

      const allowedTools = this.tools.listAllowed(agent.tools)
      const toolDefs = allowedTools.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))

      this.onEvent({ type: "stream_start" })

      const startTime = Date.now()
      let fullText = ""
      let toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = []

      try {
        const stream = this.provider!.stream(allMsgs, toolDefs.length > 0 ? toolDefs : undefined)

        for await (const event of stream) {
          if (event.type === "start") continue

          if (event.type === "delta") {
            fullText += event.text
            this.onEvent({ type: "stream_delta", text: event.text })
          }

          if (event.type === "tool_call") {
            let args: Record<string, unknown> = {}
            try {
              args = JSON.parse(event.toolCall.arguments)
            } catch {
              args = {}
            }
            const tc = { id: event.toolCall.id, name: event.toolCall.name, arguments: args }
            toolCalls.push(tc)
            this.onEvent({ type: "tool_call", toolCall: tc })
          }

          if (event.type === "stop") {
            this.totalTokensIn += event.usage?.inputTokens || 0
            this.totalTokensOut += event.usage?.outputTokens || 0
            const latency = Date.now() - startTime
            this.onEvent({
              type: "stream_stop",
              usage: { inputTokens: event.usage?.inputTokens || 0, outputTokens: event.usage?.outputTokens || 0 },
            })
            this.onEvent({ type: "status", tokensIn: this.totalTokensIn, tokensOut: this.totalTokensOut, latency })
          }

          if (event.type === "error") {
            this.onEvent({ type: "error", message: event.error })
            return
          }
        }
      } catch (err) {
        this.onEvent({ type: "error", message: err instanceof Error ? err.message : String(err) })
        return
      }

      const assistantMsg: AssistantMessage = {
        role: "assistant",
        content: fullText ? [{ type: "text", text: fullText }] : [],
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      }
      this.sessions.addMessage(this.sessionId!, assistantMsg)
      this.onEvent({ type: "message", message: assistantMsg })

      if (toolCalls.length === 0) return

      const parallelTools = new Set(["read", "grep", "glob"])
      const sequentialCalls: typeof toolCalls = []
      const parallelCalls: typeof toolCalls = []

      for (const tc of toolCalls) {
        if (parallelTools.has(tc.name)) {
          parallelCalls.push(tc)
        } else {
          sequentialCalls.push(tc)
        }
      }

      if (parallelCalls.length > 0) {
        const results = await Promise.all(
          parallelCalls.map(async (tc) => {
            const allowed = await this.permissions.check(tc.name, tc.arguments, this.sessionId!)
            if (!allowed) {
              this.onEvent({ type: "permission_denied", toolName: tc.name })
              return { tc, allowed: false }
            }
            const ctx = {
              sessionId: this.sessionId!,
              workingDirectory: this.config.getWorkingDir(),
              agentName: agent.name,
            }
            const result = await this.tools.execute(tc.name, tc.arguments, ctx)
            this.onEvent({ type: "tool_result", result, toolCallId: tc.id })
            return { tc, allowed: true, result }
          })
        )
        for (const r of results) {
          const onceKey = `${this.sessionId!}:${r.tc.name}`
          if (this.onceAllowed.has(onceKey)) {
            this.permissions.clearDecision(this.sessionId!, r.tc.name)
            this.onceAllowed.delete(onceKey)
          }
          const toolMsg: ToolResultMessage = {
            role: "tool",
            toolCallId: r.tc.id,
            content: r.allowed ? r.result!.content : [{ type: "text" as const, text: `Permission denied for tool "${r.tc.name}"` }],
            isError: r.allowed ? r.result!.isError : true,
          }
          this.sessions.addMessage(this.sessionId!, toolMsg)
        }
      }

      for (const tc of sequentialCalls) {
        const allowed = await this.permissions.check(tc.name, tc.arguments, this.sessionId!)
        if (!allowed) {
          this.onEvent({ type: "permission_denied", toolName: tc.name })
          const errMsg: ToolResultMessage = {
            role: "tool",
            toolCallId: tc.id,
            content: [{ type: "text", text: `Permission denied for tool "${tc.name}"` }],
            isError: true,
          }
          this.sessions.addMessage(this.sessionId!, errMsg)
          continue
        }

        const ctx = {
          sessionId: this.sessionId!,
          workingDirectory: this.config.getWorkingDir(),
          agentName: agent.name,
        }

        const result = await this.tools.execute(tc.name, tc.arguments, ctx)
        this.onEvent({ type: "tool_result", result, toolCallId: tc.id })

        const onceKey = `${this.sessionId!}:${tc.name}`
        if (this.onceAllowed.has(onceKey)) {
          this.permissions.clearDecision(this.sessionId!, tc.name)
          this.onceAllowed.delete(onceKey)
        }

        const toolMsg: ToolResultMessage = {
          role: "tool",
          toolCallId: tc.id,
          content: result.content,
          isError: result.isError,
        }
        this.sessions.addMessage(this.sessionId!, toolMsg)
      }
    }
  }

  resolveAllow(): void {
    const next = this.permissionQueue.shift()
    if (next) next.resolve(true)
  }

  resolveAllowOnce(): void {
    const next = this.permissionQueue.shift()
    if (next) {
      this.permissions.allowOnce(next.sessionId, next.toolName)
      this.onceAllowed.add(`${next.sessionId}:${next.toolName}`)
      next.resolve(false)
    }
  }

  resolveDeny(): void {
    const next = this.permissionQueue.shift()
    if (next) next.resolve(false)
  }

  private buildSystemMessage(agent: Agent): string {
    const parts = [agent.systemPrompt]

    parts.push(`\nCurrent date: ${new Date().toISOString().split("T")[0]}`)
    parts.push(`Working directory: ${this.config.getWorkingDir()}`)

    const allowed = this.tools.listAllowed(agent.tools)
    parts.push(`\nAvailable tools: ${allowed.map((t) => t.name).join(", ")}`)

    return parts.join("\n")
  }
}
