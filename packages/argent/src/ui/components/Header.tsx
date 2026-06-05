import React from "react"
import { Box, Text } from "ink"
import { theme, gradient } from "../theme.js"

interface HeaderProps {
  agentName: string
  agentColor: string
  agentNames: string[]
  onAgentSwitch: (name: string) => void
  width: number
}

export function Header({ agentName, agentColor, agentNames, onAgentSwitch: _onAgentSwitch }: HeaderProps) {
  const brandColors = gradient(theme.colors.accentDim, theme.colors.accentAlt, 5)

  return (
    <Box
      flexDirection="row"
      paddingX={1}
      paddingY={0}
      alignItems="center"
    >
      <Box marginRight={1}>
        <Text>
          <Text color={brandColors[0]}>{theme.borders.diamond}</Text>
          <Text bold color={theme.colors.textWhite}> argent</Text>
        </Text>
      </Box>

      <Box>
        <Text color={theme.colors.textMuted}>{theme.borders.verticalLight}</Text>
      </Box>

      <Box flexDirection="row" gap={1} marginLeft={1}>
        {agentNames.map((name) => {
          const isActive = name === agentName
          return (
            <Box key={name} paddingX={1}>
              <Text
                color={isActive ? agentColor : theme.colors.textMuted}
                bold={isActive}
              >
                {isActive ? theme.borders.dot : theme.borders.dotEmpty} {name}
              </Text>
            </Box>
          )
        })}
      </Box>

      <Box flexGrow={1} />

      <Box>
        <Text color={theme.colors.textMuted} dimColor>
          {theme.borders.bullet} tab to switch
        </Text>
      </Box>
    </Box>
  )
}
