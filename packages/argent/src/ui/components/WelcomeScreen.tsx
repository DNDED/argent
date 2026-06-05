import React from "react"
import { Box, Text } from "ink"
import { theme, gradient, multiGradient } from "../theme.js"

export function WelcomeScreen() {
  const aurora = multiGradient(
    [theme.colors.accentDim, theme.colors.accent, theme.colors.accentAlt, theme.colors.accentTertiary],
    40
  )
  const borderGrad = gradient(theme.colors.accentDim, theme.colors.accentAlt, 8)

  return (
    <Box flexDirection="column" alignItems="center" paddingY={2}>
      <Box flexDirection="column" alignItems="center">
        <Text>
          <Text color={borderGrad[0]}>{theme.borders.heavy[0]}</Text>
          <Text color={borderGrad[1]}>{theme.borders.thin.repeat(38)}</Text>
          <Text color={borderGrad[7]}>{theme.borders.heavy[1]}</Text>
        </Text>
        <Text>
          <Text color={borderGrad[1]}>{theme.borders.vertical}</Text>
          <Text>{" ".repeat(38)}</Text>
          <Text color={borderGrad[6]}>{theme.borders.vertical}</Text>
        </Text>
        <Text>
          <Text color={borderGrad[2]}>{theme.borders.vertical}</Text>
          <Text>{"  "}</Text>
          <Text color={aurora[0]}>{theme.borders.diamond}</Text>
          <Text>{" "}</Text>
          <Text bold color={theme.colors.textWhite}>A  R  G  E  N  T</Text>
          <Text>{" ".repeat(18)}</Text>
          <Text color={borderGrad[5]}>{theme.borders.vertical}</Text>
        </Text>
        <Text>
          <Text color={borderGrad[3]}>{theme.borders.vertical}</Text>
          <Text>{"  "}</Text>
          <Text color={theme.colors.textDim}>The universal AI coding harness</Text>
          <Text>{" ".repeat(6)}</Text>
          <Text color={borderGrad[4]}>{theme.borders.vertical}</Text>
        </Text>
        <Text>
          <Text color={borderGrad[4]}>{theme.borders.vertical}</Text>
          <Text>{" ".repeat(38)}</Text>
          <Text color={borderGrad[3]}>{theme.borders.vertical}</Text>
        </Text>
        <Text>
          <Text color={borderGrad[7]}>{theme.borders.heavy[2]}</Text>
          <Text color={borderGrad[6]}>{theme.borders.thin.repeat(38)}</Text>
          <Text color={borderGrad[0]}>{theme.borders.heavy[3]}</Text>
        </Text>
      </Box>

      <Box marginTop={2} flexDirection="column" alignItems="center">
        <Box flexDirection="column" gap={0}>
          <AgentRow
            active
            symbol={theme.borders.dot}
            color={theme.colors.success}
            name="build"
            desc="Full-access development agent"
          />
          <AgentRow
            symbol={theme.borders.dotEmpty}
            color={theme.colors.accentAlt}
            name="plan"
            desc="Read-only analysis & exploration"
          />
          <AgentRow
            symbol={theme.borders.dotEmpty}
            color={theme.colors.textMuted}
            name="explore"
            desc="Fast codebase search (subagent)"
          />
        </Box>
      </Box>

      <Box marginTop={2} flexDirection="column" alignItems="center">
        <Box marginBottom={1}>
          <Text color={theme.colors.textMuted}>{theme.borders.dash.repeat(30)}</Text>
        </Box>
        <Box flexDirection="column" gap={0}>
          <CommandRow commands={["/agent", "/model", "/provider"]} descriptions={["Switch agent", "Switch model", "Change provider"]} />
          <CommandRow commands={["/clear", "/share", "/help"]} descriptions={["New session", "Share session", "All commands"]} />
        </Box>
      </Box>

      <Box marginTop={2}>
        <Text color={theme.colors.textDim}>Type a message to begin</Text>
        <Text color={theme.colors.textMuted}> {theme.borders.dash} </Text>
        <Text color={theme.colors.accent}>/help</Text>
        <Text color={theme.colors.textMuted}> for all commands</Text>
      </Box>
    </Box>
  )
}

function AgentRow({ active, symbol, color, name, desc }: {
  active?: boolean
  symbol: string
  color: string
  name: string
  desc: string
}) {
  return (
    <Box>
      <Text color={color}>{symbol}</Text>
      <Text color={active ? theme.colors.textBright : theme.colors.text}> {name.padEnd(8)}</Text>
      <Text color={theme.colors.textDim}>{desc}</Text>
    </Box>
  )
}

function CommandRow({ commands, descriptions }: { commands: string[]; descriptions: string[] }) {
  return (
    <Box gap={2}>
      {commands.map((cmd, i) => (
        <Box key={cmd}>
          <Text color={theme.colors.accent}>{cmd}</Text>
          <Text color={theme.colors.textMuted}> {descriptions[i]}</Text>
        </Box>
      ))}
    </Box>
  )
}
