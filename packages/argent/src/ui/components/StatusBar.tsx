import React from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"

interface StatusBarProps {
  provider: string
  model: string
  tokensIn: number
  tokensOut: number
  latency: number
  workingDirectory: string
  isStreaming: boolean
  errorCount: number
  cost?: number
}

export function StatusBar({
  provider,
  model,
  tokensIn,
  tokensOut,
  latency,
  workingDirectory,
  isStreaming,
  errorCount,
  cost = 0,
}: StatusBarProps) {
  const dirParts = workingDirectory.split("/")
  const shortDir =
    dirParts.length > 2
      ? `${theme.chars.dash}${theme.chars.connector}${dirParts.slice(-2).join("/")}`
      : workingDirectory

  return (
    <Box flexDirection="row" paddingX={1} alignItems="center">
      <Box>
        <Text color={theme.colors.textMuted}>{theme.chars.arrow}</Text>
        <Text color={theme.colors.textDim}> {shortDir}</Text>
      </Box>

      <Box flexGrow={1}>
        <Text color={theme.colors.border}>
          {"  "}
          {theme.chars.light.repeat(3)}
        </Text>
      </Box>

      <Box gap={1} alignItems="center">
        {isStreaming && (
          <Box marginRight={1}>
            <Text color={theme.colors.accent}>
              {theme.chars.blockLight}{" "}
              <Text color={theme.colors.textDim}>
                {formatTokens(tokensIn + tokensOut)}
              </Text>
            </Text>
          </Box>
        )}

        {errorCount > 0 && (
          <Box marginRight={1}>
            <Text color={theme.colors.error}>
              {theme.icons.error} {errorCount} error{errorCount !== 1 ? "s" : ""}
            </Text>
          </Box>
        )}

        <Box>
          <Text color={theme.colors.textDim}>{model}</Text>
        </Box>

        <Box>
          <Text color={theme.colors.textMuted}>{theme.chars.verticalLight}</Text>
        </Box>

        <Box>
          <Text color={theme.colors.textMuted}>{provider.toUpperCase()}</Text>
        </Box>

        {!isStreaming && tokensIn + tokensOut > 0 && (
          <>
            <Box>
              <Text color={theme.colors.textMuted}>{theme.chars.verticalLight}</Text>
            </Box>
            <Box>
              <Text color={theme.colors.textDim}>{formatTokens(tokensIn + tokensOut)}</Text>
            </Box>
          </>
        )}

        {cost > 0 && (
          <>
            <Box>
              <Text color={theme.colors.textMuted}>{theme.chars.verticalLight}</Text>
            </Box>
            <Box>
              <Text color={theme.colors.textDim}>${cost.toFixed(4)}</Text>
            </Box>
          </>
        )}

        {latency > 0 && (
          <>
            <Box>
              <Text color={theme.colors.textMuted}>{theme.chars.verticalLight}</Text>
            </Box>
            <Box>
              <Text color={latencyColor(latency)}>{latency.toFixed(0)}ms</Text>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M tok`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k tok`
  return `${n} tok`
}

function latencyColor(ms: number): string {
  if (ms < 500) return theme.colors.success
  if (ms < 2000) return theme.colors.textDim
  return theme.colors.warning
}
