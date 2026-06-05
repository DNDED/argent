import React from "react"
import { Box, Text } from "ink"
import { theme, gradient } from "../theme.js"

interface HeaderProps {
  agentName: string
  agentColor: string
  agentNames: string[]
  onAgentSwitch: (_name: string) => void
  maxWidth: number
}

export function Header({ agentName, agentColor, agentNames, onAgentSwitch: _onAgentSwitch, maxWidth }: HeaderProps) {
  const brandColors = gradient(theme.colors.accentDim, theme.colors.accentAlt, 5)

  const ruleWidth = Math.max(0, maxWidth - 4 - agentNames.join("").length - 8)

  return (
    <Box flexDirection="column" paddingX={1} paddingY={0}>
      <Box flexDirection="row" alignItems="center" marginBottom={0}>
        <Box marginRight={1}>
          <Text>
            <Text color={brandColors[0]}>{theme.chars.diamond}</Text>
            <Text bold color={theme.colors.textWhite}> argent</Text>
          </Text>
        </Box>

        <Box flexGrow={1}>
          <Text color={theme.colors.borderSubtle}>
            {theme.chars.connector.repeat(Math.max(0, ruleWidth))}
          </Text>
        </Box>

        <Box flexDirection="row">
          {agentNames.map((name, i) => {
            const isActive = name === agentName
            return (
              <React.Fragment key={name}>
                {i > 0 && (
                  <Text color={theme.colors.textMuted}> {theme.chars.verticalLight} </Text>
                )}
                <Text
                  color={isActive ? agentColor : theme.colors.textMuted}
                  bold={isActive}
                >
                  {isActive ? theme.chars.dot : theme.chars.dotEmpty} {name}
                </Text>
              </React.Fragment>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}
