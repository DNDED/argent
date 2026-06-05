import React, { useState, useCallback } from "react"
import { Box, Text, useInput } from "ink"
import TextInput from "ink-text-input"
import { listProviders } from "@argent/integrations"
import type { ProviderDescriptor } from "@argent/integrations"
import { theme, multiGradient } from "../../ui/theme.js"

interface SetupWizardProps {
  onComplete: (providerId: string, apiKey?: string) => void
  onSkip: () => void
}

type SetupStep = "select" | "apikey" | "done"

export function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const providers = listProviders()
  const [step, setStep] = useState<SetupStep>("select")
  const [input, setInput] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<ProviderDescriptor | null>(null)
  const [error, setError] = useState("")

  const handleSelectSubmit = useCallback(
    (value: string) => {
      if (value.toLowerCase() === "q" || value.toLowerCase() === "quit") {
        onSkip()
        return
      }

      const num = parseInt(value.trim(), 10)
      if (!isNaN(num) && num >= 1 && num <= providers.length) {
        const selected = providers[num - 1]
        if (!selected) {
          setError("Invalid selection")
          return
        }
        setSelectedProvider(selected)
        setInput("")

        if (selected.authType === "none") {
          onComplete(selected.id)
          return
        }

        if (selected.authType === "oauth") {
          onComplete(selected.id)
          return
        }

        const envKey = selected.envVar ? process.env[selected.envVar] : undefined
        if (envKey) {
          onComplete(selected.id, envKey)
          return
        }

        setStep("apikey")
        return
      }

      const match = providers.find(
        (p) => p.id === value.trim() || p.name.toLowerCase() === value.trim().toLowerCase()
      )
      if (match) {
        setSelectedProvider(match)
        setInput("")

        if (match.authType === "none" || match.authType === "oauth") {
          onComplete(match.id)
          return
        }

        setStep("apikey")
        return
      }

      setError(`Invalid selection: "${value}". Enter a number 1-${providers.length} or 'q' to skip.`)
      setInput("")
    },
    [providers, onComplete, onSkip]
  )

  const handleApiKeySubmit = useCallback(
    (value: string) => {
      if (!selectedProvider) return
      if (value.trim()) {
        onComplete(selectedProvider.id, value.trim())
      } else {
        setError("API key cannot be empty. Enter a key or press Escape to skip.")
      }
    },
    [selectedProvider, onComplete]
  )

  useInput((_input, key) => {
    if (key.escape) {
      if (step === "apikey") {
        if (selectedProvider) {
          onComplete(selectedProvider.id)
        }
        return
      }
      onSkip()
    }
  })

  const aurora = multiGradient(
    [theme.colors.accentDim, theme.colors.accent, theme.colors.accentAlt],
    8
  )

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text>
          <Text color={aurora[0]}>{theme.borders.heavy[0]}</Text>
          <Text color={aurora[1]}>{theme.borders.thin.repeat(44)}</Text>
          <Text color={aurora[7]}>{theme.borders.heavy[1]}</Text>
        </Text>
        <Text>
          <Text color={aurora[1]}>{theme.borders.vertical}</Text>
          <Text>{" ".repeat(44)}</Text>
          <Text color={aurora[6]}>{theme.borders.vertical}</Text>
        </Text>
        <Text>
          <Text color={aurora[2]}>{theme.borders.vertical}</Text>
          <Text>{"  "}</Text>
          <Text color={theme.colors.accent}>{theme.borders.diamond}</Text>
          <Text bold color={theme.colors.textWhite}>  A  R  G  E  N  T</Text>
          <Text>{" ".repeat(24)}</Text>
          <Text color={aurora[5]}>{theme.borders.vertical}</Text>
        </Text>
        <Text>
          <Text color={aurora[3]}>{theme.borders.vertical}</Text>
          <Text>{"  "}</Text>
          <Text color={theme.colors.textDim}>Welcome! Let's set up your provider</Text>
          <Text>{" ".repeat(10)}</Text>
          <Text color={aurora[4]}>{theme.borders.vertical}</Text>
        </Text>
        <Text>
          <Text color={aurora[4]}>{theme.borders.vertical}</Text>
          <Text>{" ".repeat(44)}</Text>
          <Text color={aurora[3]}>{theme.borders.vertical}</Text>
        </Text>
        <Text>
          <Text color={aurora[7]}>{theme.borders.heavy[2]}</Text>
          <Text color={aurora[6]}>{theme.borders.thin.repeat(44)}</Text>
          <Text color={aurora[0]}>{theme.borders.heavy[3]}</Text>
        </Text>
      </Box>

      {step === "select" && (
        <Box flexDirection="column">
          <Box marginBottom={1} paddingLeft={1}>
            <Text color={theme.colors.textDim}>
              {theme.borders.arrow} Choose a provider:
            </Text>
          </Box>

          <Box flexDirection="column" paddingLeft={2}>
            {providers.map((p, i) => (
              <Box key={p.id}>
                <Text>
                  <Text color={theme.colors.accentDim}>{theme.borders.branch}</Text>
                  <Text color={theme.colors.border}>{theme.borders.connector}</Text>
                  <Text color={theme.colors.accent}> [</Text>
                  <Text bold color={theme.colors.textBright}>{String(i + 1).padStart(2, " ")}</Text>
                  <Text color={theme.colors.accent}>]</Text>
                  <Text>  </Text>
                  <Text color={theme.colors.text}>{p.name.padEnd(20, " ")}</Text>
                  <Text color={theme.colors.textMuted}> {formatAuthLabel(p)}</Text>
                </Text>
              </Box>
            ))}
          </Box>

          <Box marginTop={1} flexDirection="column" paddingLeft={1}>
            {error ? (
              <Box marginBottom={1}>
                <Text color={theme.colors.error}>  {theme.borders.arrow} {error}</Text>
              </Box>
            ) : null}
            <Box>
              <Text color={theme.colors.accentBright}>  {theme.borders.arrow} </Text>
              <TextInput
                value={input}
                onChange={setInput}
                onSubmit={handleSelectSubmit}
                placeholder={`Enter number (or 'q' to skip)`}
              />
            </Box>
          </Box>
        </Box>
      )}

      {step === "apikey" && selectedProvider && (
        <Box flexDirection="column" paddingLeft={1}>
          <Box marginBottom={1}>
            <Text color={theme.colors.textDim}>
              {theme.borders.arrow} Provider:{" "}
              <Text bold color={theme.colors.accent}>{selectedProvider.name}</Text>
            </Text>
          </Box>

          {selectedProvider.envVar && (
            <Box marginBottom={1} paddingLeft={2}>
              <Text color={theme.colors.textMuted}>
                {theme.borders.bullet} Or set{" "}
                <Text color={theme.colors.code}>{selectedProvider.envVar}</Text>
                {" "}environment variable
              </Text>
            </Box>
          )}

          {error ? (
            <Box marginBottom={1}>
              <Text color={theme.colors.error}>  {theme.borders.arrow} {error}</Text>
            </Box>
          ) : null}

          <Box paddingLeft={1}>
            <Text color={theme.colors.accentBright}>  API Key {theme.borders.arrow} </Text>
            <TextInput
              value={input}
              onChange={setInput}
              onSubmit={handleApiKeySubmit}
              mask="*"
              placeholder="Paste your API key"
            />
          </Box>

          <Box marginTop={1} paddingLeft={2}>
            <Text color={theme.colors.textMuted}>
              {theme.borders.bullet} Press Escape to skip (set later with /provider)
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}

function formatAuthLabel(provider: ProviderDescriptor): string {
  switch (provider.authType) {
    case "api-key":
      return "API key"
    case "oauth":
      return "free (browser login)"
    case "bearer":
      return "bearer token"
    case "none":
      return "no auth"
    default:
      return provider.authType
  }
}
