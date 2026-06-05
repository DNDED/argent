import React from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"

interface StatusBarProps {
  provider: string
  model: string
  tokensIn: number
  tokensOut: number
  cost: number
  latency: number
  workingDirectory: string
}

export function StatusBar({ provider, model, tokensIn, tokensOut, latency, workingDirectory }: StatusBarProps) {
  const dirParts = workingDirectory.split("/")
  const shortDir = dirParts.length > 2
    ? `${theme.borders.dash}${theme.borders.connector}${dirParts.slice(-2).join("/")}`
    : workingDirectory

  return (
    <Box
      flexDirection="row"
      paddingX={1}
      alignItems="center"
    >
      <Box>
        <Text color={theme.colors.textMuted}>{theme.borders.arrow}</Text>
        <Text color={theme.colors.textDim}> {shortDir}</Text>
      </Box>

      <Box flexGrow={1}>
        <Text color={theme.colors.border}>
          {"  "}{theme.borders.light.repeat(3)}
        </Text>
      </Box>

      <Box gap={1} alignItems="center">
        <Box>
          <Text color={theme.colors.textDim}>{model}</Text>
        </Box>

        <Box>
          <Text color={theme.colors.textMuted}>{theme.borders.verticalLight}</Text>
        </Box>

        <Box>
          <Text color={theme.colors.textMuted}>{provider.toUpperCase()}</Text>
        </Box>

        {tokensIn + tokensOut > 0 && (
          <>
            <Box>
              <Text color={theme.colors.textMuted}>{theme.borders.verticalLight}</Text>
            </Box>
            <Box>
              <Text color={theme.colors.textDim}>{formatTokens(tokensIn + tokensOut)}</Text>
            </Box>
          </>
        )}

        {latency > 0 && (
          <>
            <Box>
              <Text color={theme.colors.textMuted}>{theme.borders.verticalLight}</Text>
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
