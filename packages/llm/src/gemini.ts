import type { LLMProvider, ProviderOptions, ProviderResponse, ProviderStreamEvent } from "./provider.js"
import type { Message, MessageContent, ToolCall } from "@rigal/core"

export function createGeminiProvider(options: ProviderOptions): LLMProvider {
  const apiKey = options.apiKey
  const baseUrl = options.baseUrl || "https://generativelanguage.googleapis.com/v1beta"
  const model = options.model || "gemini-2.5-pro"

  function toGeminiContents(messages: Message[]) {
    return messages.map((m) => {
      if (m.role === "user") {
        return { role: "user", parts: m.content.map((c) => (c.type === "text" ? { text: c.text } : { inline_data: { mime_type: "image/png", data: c.imageUrl } })) }
      }
      if (m.role === "assistant") {
        const parts: Record<string, unknown>[] = m.content.filter((c) => c.text).map((c) => ({ text: c.text }))
        if (m.toolCalls?.length) {
          for (const tc of m.toolCalls) {
            parts.push({
              functionCall: { name: tc.name, args: tc.arguments },
            })
          }
        }
        return { role: "model", parts: parts.length > 0 ? parts : [{ text: " " }] }
      }
      return {
        role: "function",
        parts: [{ functionResponse: { name: "tool_result", response: { content: m.content.map((c) => c.text || "").join("\n") } } }],
      }
    })
  }

  function toolsToGeminiDeclarations(tools: unknown[]) {
    if (!tools?.length) return undefined
    return tools.map((t: unknown) => {
      const f = (t as { function: { name: string; description: string; parameters: unknown } }).function
      return { name: f.name, description: f.description, parameters: f.parameters }
    })
  }

  return {
    name: "gemini",
    models: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-pro-preview-05-25",
    ],

    async chat(messages, tools, opts) {
      const body: Record<string, unknown> = {
        contents: toGeminiContents(messages),
        generationConfig: {
          maxOutputTokens: opts?.maxTokens || 8192,
          temperature: opts?.temperature ?? 0.7,
        },
      }

      const toolDeclarations = toolsToGeminiDeclarations(tools || [])
      if (toolDeclarations) body.tools = [{ functionDeclarations: toolDeclarations }]

      const res = await fetch(
        `${baseUrl}/models/${opts?.model || model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`)

      const json = await res.json()
      const candidate = json.candidates?.[0]
      const content = candidate?.content

      const parts = content?.parts || []
      const textParts = parts.filter((p: { text?: string }) => p.text).map((p: { text: string }) => p.text).join("")
      const toolCalls = parts
        .filter((p: { functionCall?: { name: string; args: Record<string, unknown> } }) => p.functionCall)
        .map((p: { functionCall: { name: string; args: Record<string, unknown> } }, i: number) => ({
          id: `call_${i}`,
          name: p.functionCall.name,
          arguments: p.functionCall.args || {},
        }))

      return {
        text: textParts,
        toolCalls: toolCalls.length ? toolCalls : undefined,
        usage: {
          inputTokens: json.usageMetadata?.promptTokenCount || 0,
          outputTokens: json.usageMetadata?.candidatesTokenCount || 0,
        },
        stopReason: candidate?.finishReason || "STOP",
      }
    },

    async *stream(messages, tools, opts) {
      const body: Record<string, unknown> = {
        contents: toGeminiContents(messages),
        generationConfig: {
          maxOutputTokens: opts?.maxTokens || 8192,
          temperature: opts?.temperature ?? 0.7,
        },
      }

      const toolDeclarations = toolsToGeminiDeclarations(tools || [])
      if (toolDeclarations) body.tools = [{ functionDeclarations: toolDeclarations }]

      const res = await fetch(
        `${baseUrl}/models/${opts?.model || model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) {
        yield { type: "error", error: `Gemini API error: ${res.status}` }
        return
      }

      yield { type: "start" }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let fullText = ""
      let inputTokens = 0
      let outputTokens = 0
      let finishReason = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6)
            if (!data.trim() || data === "[DONE]") continue

            try {
              const event = JSON.parse(data)
              const candidate = event.candidates?.[0]
              if (!candidate) continue

              const parts = candidate.content?.parts || []
              for (const part of parts) {
                if (part.text) {
                  fullText += part.text
                  yield { type: "delta", text: part.text }
                }
                if (part.functionCall) {
                  yield {
                    type: "tool_call",
                    toolCall: {
                      id: `call_0`,
                      name: part.functionCall.name || "unknown",
                      arguments: JSON.stringify(part.functionCall.args || {}),
                    },
                  }
                  yield { type: "tool_call_done" }
                }
              }

              if (event.usageMetadata) {
                inputTokens = event.usageMetadata.promptTokenCount || 0
                outputTokens = event.usageMetadata.candidatesTokenCount || 0
              }

              if (candidate.finishReason) {
                finishReason = candidate.finishReason
              }
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (err) {
        yield { type: "error", error: err instanceof Error ? err.message : String(err) }
      }

      yield { type: "stop", stopReason: finishReason, usage: { inputTokens, outputTokens } }
    },
  }
}
