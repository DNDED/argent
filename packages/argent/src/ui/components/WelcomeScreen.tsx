import React from "react"
import { Box, Text } from "ink"
import { theme, multiGradient } from "../theme.js"

export function WelcomeScreen({ width = 80 }: { width?: number }) {
  const innerWidth = Math.max(20, Math.min(width - 4, 58))
  const aurora = multiGradient(
    [theme.colors.accentDim, theme.colors.accent, theme.colors.accentAlt, theme.colors.accentTertiary],
    Math.max(6, innerWidth + 2)
  )

  return (
    <Box flexDirection="column" alignItems="center" paddingY={2}>
      <Box flexDirection="column" alignItems="center">
        <Text>
          <Text color={aurora[0]}>{theme.chars.round[0]}</Text>
          <Text color={aurora[4]}>{theme.chars.double.repeat(innerWidth)}</Text>
          <Text color={aurora[aurora.length - 1]}>{theme.chars.round[1]}</Text>
        </Text>
        <Box>
          <Text color={aurora[2]}>{theme.chars.vertical}</Text>
          <Text>{"  "}</Text>
          <Text color={aurora[10]}>{theme.chars.diamond}</Text>
          <Text>{" "}</Text>
          <Text bold color={theme.colors.textWhite}>
            A  R  G  E  N  T
          </Text>
          <Text>{" ".repeat(Math.max(0, innerWidth - 22))}</Text>
          <Text color={aurora[aurora.length - 3]}>{theme.chars.vertical}</Text>
        </Box>
        <Box>
          <Text color={aurora[2]}>{theme.chars.vertical}</Text>
          <Text>{"  "}</Text>
          <Text color={theme.colors.textDim}>The universal AI coding harness</Text>
          <Text>{" ".repeat(Math.max(0, innerWidth - 36))}</Text>
          <Text color={aurora[aurora.length - 3]}>{theme.chars.vertical}</Text>
        </Box>
        <Box>
          <Text color={aurora[2]}>{theme.chars.vertical}</Text>
          <Text>{" ".repeat(innerWidth)}</Text>
          <Text color={aurora[aurora.length - 3]}>{theme.chars.vertical}</Text>
        </Box>
        <Text>
          <Text color={aurora[0]}>{theme.chars.round[2]}</Text>
          <Text color={aurora[4]}>{theme.chars.double.repeat(innerWidth)}</Text>
          <Text color={aurora[aurora.length - 1]}>{theme.chars.round[3]}</Text>
        </Text>
      </Box>

      <Box marginTop={2} flexDirection="column" alignItems="center">
        <Box flexDirection="column">
          <AgentRow
            active
            symbol={theme.chars.dot}
            color={theme.colors.success}
            name="build"
            desc="Full-access development agent"
          />
          <AgentRow
            symbol={theme.chars.dotEmpty}
            color={theme.colors.accentAlt}
            name="plan"
            desc="Read-only analysis & exploration"
          />
          <AgentRow
            symbol={theme.chars.diamondEmpty}
            color={theme.colors.textMuted}
            name="explore"
            desc="Fast codebase search (subagent)"
          />
        </Box>
      </Box>

      <Box marginTop={2} flexDirection="column" alignItems="center">
        <Box marginBottom={1}>
          <Text color={theme.colors.textMuted}>{theme.chars.dotted.repeat(30)}</Text>
        </Box>
        <Box flexDirection="column">
          <Box gap={2}>
            <Box>
              <Text color={theme.colors.accent}>/agent</Text>
              <Text color={theme.colors.textMuted}> Switch agent</Text>
            </Box>
            <Box>
              <Text color={theme.colors.accent}>/model</Text>
              <Text color={theme.colors.textMuted}> Switch model</Text>
            </Box>
            <Box>
              <Text color={theme.colors.accent}>/provider</Text>
              <Text color={theme.colors.textMuted}> Change provider</Text>
            </Box>
          </Box>
          <Box gap={2}>
            <Box>
              <Text color={theme.colors.accent}>/clear</Text>
              <Text color={theme.colors.textMuted}> New session</Text>
            </Box>
            <Box>
              <Text color={theme.colors.accent}>/share</Text>
              <Text color={theme.colors.textMuted}> Share session</Text>
            </Box>
            <Box>
              <Text color={theme.colors.accent}>/help</Text>
              <Text color={theme.colors.textMuted}> All commands</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box marginTop={2}>
        <Text color={theme.colors.textDim}>Type a message to begin</Text>
        <Text color={theme.colors.textMuted}> {theme.chars.dash} </Text>
        <Text color={theme.colors.textDim}>
          <Text color={theme.colors.accent}>{theme.chars.keyCtrl}+K</Text> for command palette
        </Text>
      </Box>
    </Box>
  )
}

function AgentRow({
  active,
  symbol,
  color,
  name,
  desc,
}: {
  active?: boolean
  symbol: string
  color: string
  name: string
  desc: string
}) {
  return (
    <Box>
      <Text color={color}>{symbol}</Text>
      <Text color={active ? theme.colors.textBright : theme.colors.text}>{" "}{name.padEnd(8)}</Text>
      <Text color={theme.colors.textDim}>{desc}</Text>
    </Box>
  )
}
