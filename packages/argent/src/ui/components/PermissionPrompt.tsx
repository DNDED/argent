import React from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"

interface PermissionPromptProps {
  toolName: string
  reason: string
  onAllow: () => void
  onDeny: () => void
  onAllowOnce: () => void
}

export function PermissionPrompt({ toolName, reason, onAllow: _onAllow, onDeny: _onDeny, onAllowOnce: _onAllowOnce }: PermissionPromptProps) {
  return (
    <Box
      flexDirection="column"
      paddingX={2}
      paddingY={1}
      borderStyle="round"
      borderColor={theme.colors.warning}
    >
      <Box marginBottom={1} alignItems="center">
        <Text bold color={theme.colors.warning}>
          {theme.borders.diamond} Permission Required
        </Text>
        <Text color={theme.colors.textMuted}> {theme.borders.dash} </Text>
        <Text color={theme.colors.code}>{toolName}</Text>
      </Box>

      <Box paddingLeft={2} marginBottom={1}>
        <Text color={theme.colors.textDim}>{reason}</Text>
      </Box>

      <Box gap={3} paddingLeft={2}>
        <Box>
          <Text bold color={theme.colors.success}>y</Text>
          <Text color={theme.colors.textDim}> allow</Text>
        </Box>
        <Box>
          <Text bold color={theme.colors.warning}>a</Text>
          <Text color={theme.colors.textDim}> allow once</Text>
        </Box>
        <Box>
          <Text bold color={theme.colors.error}>n</Text>
          <Text color={theme.colors.textDim}> deny</Text>
        </Box>
      </Box>
    </Box>
  )
}
