import React from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"
import type { Message } from "@argent/core"

interface ChatViewProps {
  messages: Message[]
  streamingText: string
  isStreaming: boolean
}

export function ChatView({ messages, streamingText, isStreaming }: ChatViewProps) {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      {isStreaming && (
        <StreamingBubble text={streamingText} />
      )}
    </Box>
  )
}

function StreamingBubble({ text }: { text: string }) {
  if (!text) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Box marginBottom={0}>
          <Text color={theme.colors.accentBright}>
            {theme.borders.diamond}{" "}
            <Text bold color={theme.colors.textWhite}>argent</Text>
          </Text>
        </Box>
        <Box paddingLeft={2}>
          <Text color={theme.colors.textMuted}>
            {theme.borders.verticalLight}{" "}
            <Text color={theme.colors.accent}>thinking</Text>
            <Text color={theme.colors.textMuted}>...</Text>
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={0}>
        <Text color={theme.colors.accentBright}>
          {theme.borders.diamond}{" "}
          <Text bold color={theme.colors.textWhite}>argent</Text>
        </Text>
      </Box>
      <Box paddingLeft={2}>
        <Box flexDirection="column">
          <Text color={theme.colors.textMuted}>{theme.borders.verticalLight} </Text>
          <Text color={theme.colors.text} wrap="wrap">
            {text}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Box marginBottom={0}>
          <Text color={theme.colors.textBright}>
            {theme.borders.arrow}{" "}
            <Text bold>you</Text>
          </Text>
        </Box>
        <Box paddingLeft={2}>
          <Text color={theme.colors.text} wrap="wrap">
            {message.content.map((c) => c.text || "").join(" ")}
          </Text>
        </Box>
      </Box>
    )
  }

  if (message.role === "assistant") {
    const textContent = message.content.map((c) => c.text || "").join(" ")
    const toolCalls = message.toolCalls || []

    return (
      <Box flexDirection="column" paddingY={1}>
        <Box marginBottom={0}>
          <Text color={theme.colors.accentBright}>
            {theme.borders.diamond}{" "}
            <Text bold color={theme.colors.textWhite}>argent</Text>
          </Text>
        </Box>

        {textContent && (
          <Box paddingLeft={2} flexDirection="column">
            <Text color={theme.colors.text} wrap="wrap">
              {textContent}
            </Text>
          </Box>
        )}

        {toolCalls.length > 0 && (
          <Box paddingLeft={2} flexDirection="column" marginTop={textContent ? 1 : 0}>
            {toolCalls.map((tc) => (
              <ToolCallDisplay key={tc.id} toolCall={tc} />
            ))}
          </Box>
        )}
      </Box>
    )
  }

  if (message.role === "tool") {
    const fullText = message.content.map((c) => c.text || "").join(" ")
    const truncated = fullText.length > 200 ? fullText.slice(0, 200) + "..." : fullText

    return (
      <Box flexDirection="column" paddingLeft={4} paddingY={0}>
        <Text color={theme.colors.textMuted}>
          {theme.borders.branchLast}{theme.borders.connector}{" "}
          <Text dimColor>{truncated}</Text>
        </Text>
      </Box>
    )
  }

  return null
}

function ToolCallDisplay({ toolCall }: { toolCall: { id: string; name: string; arguments: Record<string, unknown> } }) {
  const args = Object.entries(toolCall.arguments)
    .map(([k, v]) => {
      const val = typeof v === "string" && v.length > 40 ? `"${v.slice(0, 37)}..."` : JSON.stringify(v)
      return `${k}=${val}`
    })
    .join(", ")

  return (
    <Box>
      <Text>
        <Text color={theme.colors.warning}>{theme.borders.branch}</Text>
        <Text color={theme.colors.warning}>{theme.borders.connector}</Text>
        <Text color={theme.colors.code}> {toolCall.name}</Text>
        <Text color={theme.colors.textMuted}>({args})</Text>
      </Text>
    </Box>
  )
}
