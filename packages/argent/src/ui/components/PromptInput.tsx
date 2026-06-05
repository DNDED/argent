import React, { useState } from "react"
import { Box, Text } from "ink"
import TextInput from "ink-text-input"
import { theme } from "../theme.js"

interface PromptInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

export function PromptInput({ onSubmit, disabled, placeholder = "Message argent... (/ for commands)" }: PromptInputProps) {
  const [value, setValue] = useState("")

  const handleSubmit = (text: string) => {
    const trimmed = text.trim()
    if (trimmed && !disabled) {
      onSubmit(trimmed)
      setValue("")
    }
  }

  return (
    <Box flexDirection="row" paddingX={1} paddingY={0} alignItems="center">
      <Box marginRight={1}>
        <Text color={disabled ? theme.colors.textMuted : theme.colors.accentBright}>
          {disabled ? theme.borders.dotEmpty : theme.borders.arrow}
        </Text>
      </Box>
      <Box flexGrow={1}>
        {disabled ? (
          <Text color={theme.colors.textMuted}>
            {value || "Processing..."}
          </Text>
        ) : (
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            placeholder={placeholder}
            showCursor={true}
          />
        )}
      </Box>
      {disabled && (
        <Box marginLeft={1}>
          <Text color={theme.colors.accent} dimColor>
            {theme.borders.blockLight.repeat(3)}
          </Text>
        </Box>
      )}
    </Box>
  )
}
