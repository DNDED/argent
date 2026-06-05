import React, { useState, useEffect, useCallback } from "react"
import { Box, Text, useInput, useApp, useStdout } from "ink"
import { ArgentEngine, type UIEvent } from "./engine.js"
import { CommandHandler } from "./commands.js"
import { Header } from "../ui/components/Header.js"
import { StatusBar } from "../ui/components/StatusBar.js"
import { ChatView } from "../ui/components/ChatView.js"
import { PromptInput } from "../ui/components/PromptInput.js"
import { PermissionPrompt } from "../ui/components/PermissionPrompt.js"
import { WelcomeScreen } from "../ui/components/WelcomeScreen.js"
import { SetupWizard } from "../ui/components/SetupWizard.js"
import { CommandPalette } from "../ui/components/CommandPalette.js"
import { theme } from "../ui/theme.js"
import type { Message, ToolCall } from "@argent/core"

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-3.5-sonnet": { input: 3, output: 15 },
  "claude-3-opus": { input: 15, output: 75 },
  "claude-3.5-haiku": { input: 0.8, output: 4 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4": { input: 30, output: 60 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gemini-2.5-pro": { input: 1.25, output: 10 },
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "deepseek-v3": { input: 0.27, output: 1.1 },
  "deepseek-r1": { input: 0.55, output: 2.19 },
  "qwen2.5-coder:7b": { input: 0, output: 0 },
}

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0
  return ((tokensIn / 1_000_000) * pricing.input) + ((tokensOut / 1_000_000) * pricing.output)
}

type AppState = "setup" | "ready"

export function App() {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const [appState, setAppState] = useState<AppState>("setup")
  const [ready, setReady] = useState(false)
  const [engine, setEngine] = useState<ArgentEngine | null>(null)
  const [commands, setCommands] = useState<CommandHandler | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [agentName, setAgentName] = useState("build")
  const [agentColor, setAgentColor] = useState<string>(theme.colors.accent)
  const [agentNames, setAgentNames] = useState<string[]>(["build", "plan", "explore"])
  const [provider, setProvider] = useState("none")
  const [model, setModel] = useState("none")
  const [tokensIn, setTokensIn] = useState(0)
  const [tokensOut, setTokensOut] = useState(0)
  const [streamTokensIn, setStreamTokensIn] = useState(0)
  const [streamTokensOut, setStreamTokensOut] = useState(0)
  const [latency, setLatency] = useState(0)
  const [cost, setCost] = useState(0)
  const [permissionReq, setPermissionReq] = useState<{ toolName: string; reason: string } | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [workingDir, setWorkingDir] = useState(process.cwd())
  const [errors, setErrors] = useState<string[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCall[]>([])

  const terminalWidth = stdout?.columns ?? 80
  const contentMaxWidth = Math.min(terminalWidth - 4, 100)
  const horizontalPadding = Math.max(0, Math.floor((terminalWidth - contentMaxWidth) / 2))

  useEffect(() => {
    const eng = new ArgentEngine(process.cwd())
    const cmd = new CommandHandler(eng)

    eng.setEventEmitter((event: UIEvent) => {
      switch (event.type) {
        case "message":
          setMessages((prev) => [...prev, event.message])
          break
        case "stream_start":
          setStreamingText("")
          setStreamingToolCalls([])
          setStreamTokensIn(0)
          setStreamTokensOut(0)
          setIsStreaming(true)
          setIsProcessing(true)
          break
        case "stream_delta":
          setStreamingText((prev) => prev + event.text)
          setStreamTokensOut((prev) => prev + Math.ceil(event.text.length / 4))
          break
        case "stream_stop":
          setIsStreaming(false)
          setIsProcessing(false)
          if (event.usage) {
            setTokensIn((prev) => prev + event.usage!.inputTokens)
            setTokensOut((prev) => prev + event.usage!.outputTokens)
          }
          break
        case "tool_call":
          setStreamingToolCalls((prev) => [...prev, event.toolCall])
          break
        case "tool_result":
          setStreamingToolCalls((prev) => prev.filter((tc) => tc.id !== event.toolCallId))
          break
        case "permission_needed":
          setPermissionReq({ toolName: event.toolName, reason: event.reason })
          break
        case "permission_denied":
          setStatusMessage(`Permission denied: ${event.toolName}`)
          setTimeout(() => setStatusMessage(""), 3000)
          break
        case "error":
          setErrors((prev) => [...prev, event.message])
          setIsProcessing(false)
          setIsStreaming(false)
          break
        case "status":
          setTokensIn(event.tokensIn)
          setTokensOut(event.tokensOut)
          setLatency(event.latency)
          break
      }
    })

    const info = eng.getProviderInfo()
    setProvider(info.name)
    setModel(info.model)
    setAgentNames(eng.getAgents().map((a) => a.name))
    setWorkingDir(eng.config.getWorkingDir())

    setEngine(eng)
    setCommands(cmd)
    setReady(true)

    if (eng.hasProvider()) {
      setAppState("ready")
    } else {
      setAppState("setup")
    }
  }, [])

  useEffect(() => {
    const totalIn = tokensIn + streamTokensIn
    const totalOut = tokensOut + streamTokensOut
    setCost(estimateCost(model, totalIn, totalOut))
  }, [tokensIn, tokensOut, streamTokensIn, streamTokensOut, model])

  const handleSetupComplete = useCallback(
    (providerId: string, apiKey?: string) => {
      if (!engine) return
      const success = engine.setProvider(providerId, apiKey)
      if (success) {
        const info = engine.getProviderInfo()
        setProvider(info.name)
        setModel(info.model)
        setAppState("ready")
        setStatusMessage(`Provider set to ${info.name}`)
        setTimeout(() => setStatusMessage(""), 3000)
      }
    },
    [engine]
  )

  const handleSubmit = useCallback(
    (text: string) => {
      if (!engine || !commands || isProcessing) return

      setErrors([])
      setStatusMessage("")
      setCommandHistory((prev) => [...prev, text])

      const result = commands.handle(text)
      if (result.handled) {
        if (result.message === "SETUP_WIZARD") {
          setAppState("setup")
          return
        }
        if (result.message?.startsWith("SETUP_PROVIDER:")) {
          const providerId = result.message.slice("SETUP_PROVIDER:".length)
          handleSetupComplete(providerId)
          return
        }
        if (result.message) {
          setStatusMessage(result.message)
          setTimeout(() => setStatusMessage(""), 4000)
        }
        return
      }

      setStreamingText("")
      engine.sendMessage(text)
    },
    [engine, commands, isProcessing, handleSetupComplete]
  )

  const handlePermission = useCallback(
    (mode: "allow" | "allowOnce" | "deny") => {
      if (!engine) return
      if (mode === "allow") engine.resolveAllow()
      else if (mode === "allowOnce") engine.resolveAllowOnce()
      else engine.resolveDeny()
      setPermissionReq(null)
    },
    [engine]
  )

  const handleCommandPaletteExecute = useCallback(
    (action: () => void) => {
      const cmd = ALL_COMMAND_IDS.find((c) => c.action === action)
      if (cmd && commands) {
        const result = commands.handle(cmd.id)
        if (result.handled) {
          if (result.message === "SETUP_WIZARD") {
            setAppState("setup")
            return
          }
          if (result.message?.startsWith("SETUP_PROVIDER:")) {
            const providerId = result.message.slice("SETUP_PROVIDER:".length)
            handleSetupComplete(providerId)
            return
          }
          if (result.message) {
            setStatusMessage(result.message)
            setTimeout(() => setStatusMessage(""), 4000)
          }
          return
        }
      }
      action()
    },
    [commands, handleSetupComplete]
  )

  useInput((input, key) => {
    if (!engine || !commands) return

    if (key.ctrl && input === "k") {
      setCommandPaletteOpen(true)
      return
    }

    if (key.escape && isStreaming) {
      engine.cancelStreaming()
      setIsStreaming(false)
      setIsProcessing(false)
      setStreamingToolCalls([])
      setStatusMessage("Stream cancelled.")
      return
    }

    if (commandPaletteOpen) return

    if (permissionReq) {
      if (input === "y") {
        handlePermission("allow")
        return
      }
      if (input === "a") {
        handlePermission("allowOnce")
        return
      }
      if (input === "n") {
        handlePermission("deny")
        return
      }
      return
    }

    if (key.tab) {
      const agents = engine.getAgents().map((a) => a.name)
      const currentIdx = agents.indexOf(agentName)
      const nextIdx = (currentIdx + 1) % agents.length
      const nextAgent = agents[nextIdx]
      if (nextAgent) {
        const agent = engine.switchAgent(nextAgent)
        if (agent) {
          setAgentName(agent.name)
          setAgentColor(agent.color || theme.colors.accent)
          setStatusMessage(`Switched to ${agent.name}`)
          setTimeout(() => setStatusMessage(""), 2000)
        }
      }
    }
  })

  const liveTokens = tokensIn + tokensOut

  if (!ready) {
    return (
      <Box padding={1}>
        <Text color={theme.colors.accent}>{theme.chars.diamond}</Text>
        <Text color={theme.colors.text}> Initializing ARGENT...</Text>
      </Box>
    )
  }

  if (appState === "setup") {
    return (
      <SetupWizard
        onComplete={handleSetupComplete}
        onSkip={() => setAppState("ready")}
      />
    )
  }

  return (
    <Box flexDirection="column" height="100%" paddingX={horizontalPadding}>
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onExecute={handleCommandPaletteExecute}
      />

      {!commandPaletteOpen && (
        <>
          <Header
            agentName={agentName}
            agentColor={agentColor}
            agentNames={agentNames}
            onAgentSwitch={(name) => {
              const agent = engine!.switchAgent(name)
              if (agent) {
                setAgentName(agent.name)
                setAgentColor(agent.color || theme.colors.accent)
              }
            }}
            maxWidth={contentMaxWidth}
          />

          <Box flexGrow={1} flexDirection="column" paddingY={0}>
            {messages.length === 0 && !isStreaming ? (
              <WelcomeScreen width={terminalWidth} />
            ) : (
              <ChatView
                messages={messages}
                streamingText={streamingText}
                isStreaming={isStreaming}
                errors={errors}
                streamingToolCalls={streamingToolCalls}
              />
            )}
          </Box>

          {permissionReq && (
            <PermissionPrompt
              toolName={permissionReq.toolName}
              reason={permissionReq.reason}
              onAllow={() => handlePermission("allow")}
              onDeny={() => handlePermission("deny")}
              onAllowOnce={() => handlePermission("allowOnce")}
            />
          )}

          {statusMessage && (
            <Box paddingX={1} paddingY={0}>
              <Text color={theme.colors.textDim}>{statusMessage}</Text>
            </Box>
          )}

          <PromptInput
            onSubmit={handleSubmit}
            disabled={isProcessing}
            history={commandHistory}
          />

          <StatusBar
            provider={provider}
            model={model}
            tokensIn={tokensIn + streamTokensIn}
            tokensOut={tokensOut + streamTokensOut}
            latency={latency}
            workingDirectory={workingDir}
            isStreaming={isStreaming}
            errorCount={errors.length}
            cost={cost}
          />
        </>
      )}
    </Box>
  )
}

const ALL_COMMAND_IDS = [
  { id: "/agent build", action: () => {} },
  { id: "/agent plan", action: () => {} },
  { id: "/agent explore", action: () => {} },
  { id: "/model", action: () => {} },
  { id: "/provider", action: () => {} },
  { id: "/oauth", action: () => {} },
  { id: "/clear", action: () => {} },
  { id: "/undo", action: () => {} },
  { id: "/status", action: () => {} },
  { id: "/share", action: () => {} },
  { id: "/setup", action: () => {} },
  { id: "/help", action: () => {} },
  { id: "/exit", action: () => {} },
]
