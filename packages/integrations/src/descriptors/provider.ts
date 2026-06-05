export interface ProviderDescriptor {
  id: string
  name: string
  vendor: string
  transport:
    | "anthropic-native"
    | "openai-compatible"
    | "codex"
    | "codex-responses"
    | "gemini"
    | "gemini-native"
    | "custom"
  authType: "api-key" | "oauth" | "bearer" | "aws-sdk" | "none"
  envVars: string[]
  baseUrl?: string
  defaultModel: string
  models: string[]
  headers?: Record<string, string>
  description?: string
  oauthConfig?: {
    clientId: string
    tokenUrl: string
    authUrl?: string
    scopes?: string[]
    grantType: "device_code" | "authorization_code" | "user_code"
  }
  features?: {
    streaming?: boolean
    toolCalling?: boolean
    vision?: boolean
    thinking?: boolean
  }
}

export interface GatewayDescriptor {
  name: string
  baseUrl: string
  providers: string[]
  authType: "api-key" | "bearer"
}

export function defineProvider(desc: ProviderDescriptor): ProviderDescriptor {
  return desc
}

export function defineGateway(desc: GatewayDescriptor): GatewayDescriptor {
  return desc
}
