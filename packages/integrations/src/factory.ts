import type { LLMProvider, ProviderOptions } from "@argent/llm"
import type { ProviderDescriptor } from "./descriptors/provider.js"
import { createAnthropicProvider } from "@argent/llm/anthropic"
import { createOpenAIProvider } from "@argent/llm/openai"
import { createOllamaProvider } from "@argent/llm/ollama"
import { createGeminiProvider } from "@argent/llm/gemini"

export interface ProviderCredentials {
  apiKey?: string
  oauthToken?: string
  baseUrl?: string
  model?: string
}

export function createProviderFromDescriptor(
  descriptor: ProviderDescriptor,
  credentials: ProviderCredentials
): LLMProvider {
  const apiKey = credentials.apiKey || credentials.oauthToken || ""
  const baseUrl = credentials.baseUrl || descriptor.baseUrl || ""
  const model = credentials.model || descriptor.defaultModel

  const options: ProviderOptions = {
    apiKey,
    baseUrl,
    model,
    headers: descriptor.headers,
  }

  switch (descriptor.transport) {
    case "anthropic-native":
      return createAnthropicProvider(options)

    case "openai-compatible":
      return createOpenAIProvider(options)

    case "codex":
    case "codex-responses":
      return createOpenAIProvider({
        ...options,
        headers: {
          ...descriptor.headers,
          "OpenAI-Beta": "responses=v1",
        },
      })

    case "gemini":
    case "gemini-native":
      return createGeminiProvider(options)

    case "custom":
      return createOpenAIProvider(options)

    default:
      return createOpenAIProvider(options)
  }
}

export function createProviderFromEnv(descriptor: ProviderDescriptor): LLMProvider | null {
  let apiKey: string | undefined

  for (const envVar of descriptor.envVars) {
    const val = process.env[envVar]
    if (val) {
      apiKey = val
      break
    }
  }

  if (!apiKey && descriptor.authType !== "none" && descriptor.authType !== "oauth") {
    return null
  }

  return createProviderFromDescriptor(descriptor, {
    apiKey: apiKey || "none",
    baseUrl: descriptor.baseUrl,
    model: descriptor.defaultModel,
  })
}

export function autoDetectProvider(descriptors: Record<string, ProviderDescriptor>): {
  provider: ProviderDescriptor
  credentials: ProviderCredentials
} | null {
  for (const descriptor of Object.values(descriptors)) {
    for (const envVar of descriptor.envVars) {
      const apiKey = process.env[envVar]
      if (apiKey) {
        return {
          provider: descriptor,
          credentials: {
            apiKey,
            baseUrl: descriptor.baseUrl,
            model: descriptor.defaultModel,
          },
        }
      }
    }
  }

  return null
}
