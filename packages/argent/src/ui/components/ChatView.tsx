import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import { theme } from "../theme.js"
import type { Message } from "@argent/core"

interface ChatViewProps {
  messages: Message[]
  streamingText: string
  isStreaming: boolean
  errors: string[]
  streamingToolCalls?: { id: string; name: string; arguments: Record<string, unknown> }[]
}

export function ChatView({ messages, streamingText, isStreaming, errors, streamingToolCalls }: ChatViewProps) {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {errors.length > 0 && (
        <Box flexDirection="column" paddingY={1}>
          {errors.map((err, i) => (
            <Box key={i} paddingLeft={1}>
              <Text color={theme.colors.error}>
                {theme.icons.error} <Text dimColor>{err}</Text>
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      {isStreaming && (
        <StreamingBubble text={streamingText} toolCalls={streamingToolCalls} />
      )}
    </Box>
  )
}

function StreamingBubble({ text, toolCalls }: { text: string; toolCalls?: { id: string; name: string; arguments: Record<string, unknown> }[] }) {
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  if (!text && (!toolCalls || toolCalls.length === 0)) {
    return <ThinkingIndicator />
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={0}>
        <Text color={theme.colors.accentBright}>
          {theme.chars.diamond}{" "}
          <Text bold color={theme.colors.textWhite}>argent</Text>
        </Text>
      </Box>
      {text ? (
        <Box paddingLeft={2}>
          <Box flexDirection="column">
            <Text color={theme.colors.textMuted}>{theme.chars.verticalLight} </Text>
            <Box flexDirection="row">
              <Box flexShrink={1}>
                <MarkdownContent content={text} color={theme.colors.text} />
              </Box>
              <Box flexShrink={0}>
                <Text color={cursorVisible ? theme.colors.accent : theme.colors.bg}>
                  {theme.chars.cursor}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : null}
      {toolCalls && toolCalls.length > 0 && (
        <Box paddingLeft={2} flexDirection="column" marginTop={text ? 1 : 0}>
          {toolCalls.map((tc) => (
            <ToolCallDisplay key={tc.id} toolCall={tc} streaming />
          ))}
        </Box>
      )}
    </Box>
  )
}

function ThinkingIndicator() {
  const [dotIndex, setDotIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % 4)
    }, 400)
    return () => clearInterval(interval)
  }, [])

  const dots = [".", "..", "...", ".."]

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={0}>
        <Text color={theme.colors.accentBright}>
          {theme.chars.diamond}{" "}
          <Text bold color={theme.colors.textWhite}>argent</Text>
        </Text>
      </Box>
      <Box paddingLeft={2}>
        <Text color={theme.colors.textMuted}>
          {theme.chars.verticalLight}{" "}
          <Text color={theme.colors.accent}>thinking</Text>
          <Text color={theme.colors.textDim}>{dots[dotIndex]}</Text>
        </Text>
      </Box>
    </Box>
  )
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    const textContent = message.content.map((c) => ("text" in c ? c.text : "")).join(" ")

    return (
      <Box flexDirection="column" paddingY={1}>
        <Box marginBottom={0}>
          <Text color={theme.colors.textBright}>
            {theme.chars.arrow}{" "}
            <Text bold>you</Text>
          </Text>
        </Box>
        <Box paddingLeft={2}>
          <MarkdownContent content={textContent} color={theme.colors.text} />
        </Box>
      </Box>
    )
  }

  if (message.role === "assistant") {
    const textContent = message.content.map((c) => ("text" in c ? c.text : "")).join(" ")
    const toolCalls = ("toolCalls" in message ? message.toolCalls : []) || []

    return (
      <Box flexDirection="column" paddingY={1}>
        <Box marginBottom={0}>
          <Text color={theme.colors.accentBright}>
            {theme.chars.diamond}{" "}
            <Text bold color={theme.colors.textWhite}>argent</Text>
          </Text>
        </Box>

        {textContent && (
          <Box paddingLeft={2} flexDirection="column">
            <MarkdownContent content={textContent} color={theme.colors.text} />
          </Box>
        )}

        {toolCalls.length > 0 && (
          <Box paddingLeft={2} flexDirection="column" marginTop={textContent ? 1 : 0}>
            {toolCalls.map((tc: { id: string; name: string; arguments: Record<string, unknown> }) => (
              <ToolCallDisplay key={tc.id} toolCall={tc} />
            ))}
          </Box>
        )}
      </Box>
    )
  }

  if (message.role === "tool") {
    const fullText = message.content.map((c) => ("text" in c ? c.text : "")).join(" ")
    const isError = (message as any).isError === true

    return (
      <Box flexDirection="column" paddingLeft={4} paddingY={0}>
        <Text color={isError ? theme.colors.error : theme.colors.textMuted}>
          {theme.chars.branchLast}{theme.chars.connector}{" "}
          <Text dimColor={!isError} color={isError ? theme.colors.error : undefined}>
            <ExpandableToolResult text={fullText} />
          </Text>
        </Text>
      </Box>
    )
  }

  return null
}

function ToolCallDisplay({ toolCall, streaming }: { toolCall: { id: string; name: string; arguments: Record<string, unknown> }; streaming?: boolean }) {
  const args = Object.entries(toolCall.arguments)
    .map(([k, v]) => {
      const val = typeof v === "string" && v.length > 40 ? `"${v.slice(0, 37)}..."` : JSON.stringify(v)
      return `${k}=${val}`
    })
    .join(", ")

  return (
    <Box>
      <Text>
        <Text color={theme.colors.warning}>{theme.chars.branch}</Text>
        <Text color={theme.colors.warning}>{theme.chars.connector}</Text>
        <Text color={theme.colors.code}> {toolCall.name}</Text>
        <Text color={theme.colors.textMuted}>({args})</Text>
        {streaming && (
          <Text color={theme.colors.accent}> {theme.chars.block}</Text>
        )}
      </Text>
    </Box>
  )
}

function ExpandableToolResult({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const MAX = 200
  if (text.length <= MAX) return <>{text}</>
  return (
    <Box flexDirection="column">
      <Text>
        {expanded ? text : text.slice(0, MAX) + theme.chars.ellipsis}{" "}
        <Text color={theme.colors.accent}>
          [{expanded ? "show less" : `show full (${text.length} chars)`}]
        </Text>
      </Text>
    </Box>
  )
}

type MarkdownToken =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "italic"; content: string }
  | { type: "code"; content: string }
  | { type: "linebreak" }

type MarkdownBlock =
  | { type: "paragraph"; tokens: MarkdownToken[] }
  | { type: "codeblock"; language: string; content: string }
  | { type: "list_item"; tokens: MarkdownToken[]; ordered: boolean; index?: number }
  | { type: "diff_hunk"; lines: { prefix: string; content: string }[] }
  | { type: "heading"; level: number; content: string }

function parseInlineMarkdown(text: string): MarkdownToken[] {
  const tokens: MarkdownToken[] = []
  let i = 0

  while (i < text.length) {
    if (text[i] === "*" && text[i + 1] === "*") {
      i += 2
      const end = text.indexOf("**", i)
      if (end !== -1) {
        tokens.push({ type: "bold", content: text.slice(i, end) })
        i = end + 2
      } else {
        tokens.push({ type: "text", content: "**" })
      }
    } else if (text[i] === "*" && text[i + 1] !== "*" && (i === 0 || text[i - 1] !== "*")) {
      i++
      const end = text.indexOf("*", i)
      if (end !== -1 && text[end + 1] !== "*") {
        tokens.push({ type: "italic", content: text.slice(i, end) })
        i = end + 1
      } else {
        tokens.push({ type: "text", content: "*" })
      }
    } else if (text[i] === "`" && text[i + 1] !== "`") {
      i++
      const end = text.indexOf("`", i)
      if (end !== -1) {
        tokens.push({ type: "code", content: text.slice(i, end) })
        i = end + 1
      } else {
        tokens.push({ type: "text", content: "`" })
      }
    } else {
      let j = i
      while (j < text.length && text[j] !== "*" && text[j] !== "`") {
        j++
      }
      tokens.push({ type: "text", content: text.slice(i, j) })
      i = j
    }
  }

  return tokens
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split("\n")
  const blocks: MarkdownBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ""

    if (line.startsWith("```")) {
      const language = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        codeLines.push(lines[i] ?? "")
        i++
      }
      blocks.push({ type: "codeblock", language, content: codeLines.join("\n") })
      i++
      continue
    }

    const isDiffLine = /^[+\-]\s*/.test(line)
    if (isDiffLine) {
      const hunkLines: { prefix: string; content: string }[] = []
      while (i < lines.length && /^[+\-@ ]/.test(lines[i] ?? "")) {
        const hl = lines[i] ?? ""
        const prefix = hl[0] ?? " "
        hunkLines.push({ prefix, content: hl.slice(1) })
        i++
      }
      blocks.push({ type: "diff_hunk", lines: hunkLines })
      continue
    }

    if (/^#{1,6}\s/.test(line)) {
      const match = line.match(/^(#{1,6})\s+(.*)/)
      if (match) {
        blocks.push({ type: "heading", level: match[1]!.length, content: match[2] ?? "" })
      }
      i++
      continue
    }

    if (/^[\-\*]\s/.test(line) && !/^\*\*/.test(line)) {
      const inline = parseInlineMarkdown(line.replace(/^[\-\*]\s/, ""))
      blocks.push({ type: "list_item", tokens: inline, ordered: false })
      i++
      continue
    }

    if (/^\d+[\.\)]\s/.test(line)) {
      const match = line.match(/^(\d+)[\.\)]\s(.*)/)
      if (match) {
        const inline = parseInlineMarkdown(match[2] ?? "")
        blocks.push({ type: "list_item", tokens: inline, ordered: true, index: parseInt(match[1]!, 10) })
      }
      i++
      continue
    }

    if (line.trim() === "") {
      i++
      continue
    }

    const paraLines: string[] = []
    while (i < lines.length && (lines[i] ?? "").trim() !== "" && !(lines[i] ?? "").startsWith("```") && !(lines[i] ?? "").startsWith("#") && !/^[\-\*]\s/.test(lines[i] ?? "") && !/^\d+[\.\)]\s/.test(lines[i] ?? "") && !/^[+\-]/.test(lines[i] ?? "")) {
      paraLines.push(lines[i] ?? "")
      i++
    }
    const paraText = paraLines.join(" ")
    if (paraText.trim()) {
      blocks.push({ type: "paragraph", tokens: parseInlineMarkdown(paraText) })
    }
  }

  return blocks
}

function MarkdownContent({ content, color }: { content: string; color: string }) {
  const blocks = parseMarkdownBlocks(content)

  return (
    <Box flexDirection="column">
      {blocks.map((block, bi) => (
        <MarkdownBlockRenderer key={bi} block={block} baseColor={color} />
      ))}
    </Box>
  )
}

function MarkdownBlockRenderer({ block, baseColor }: { block: MarkdownBlock; baseColor: string }) {
  if (block.type === "paragraph") {
    return (
      <Box>
        <Text color={baseColor} wrap="wrap">
          {block.tokens.map((token, ti) => (
            <MarkdownTokenRenderer key={ti} token={token} />
          ))}
        </Text>
      </Box>
    )
  }

  if (block.type === "codeblock") {
    return (
      <Box flexDirection="column" marginY={1}>
        <Box
          borderStyle="single"
          borderColor={theme.colors.borderFocus}
          paddingX={1}
          paddingY={0}
          flexDirection="column"
        >
          {block.language && (
            <Box>
              <Text color={theme.colors.textMuted}>
                {theme.chars.dot} <Text color={theme.colors.accentDim}>{block.language}</Text>
              </Text>
            </Box>
          )}
          <SyntaxHighlightedCode code={block.content} language={block.language} />
        </Box>
      </Box>
    )
  }

  if (block.type === "heading") {
    return (
      <Box marginTop={block.level <= 2 ? 1 : 0}>
        <Text bold color={theme.colors.textBright} wrap="wrap">
          {block.level <= 2 ? `${theme.chars.diamond} ` : "  "}
          {block.content}
        </Text>
      </Box>
    )
  }

  if (block.type === "list_item") {
    const prefix = block.ordered
      ? ` ${block.index ?? 1}.`
      : ` ${theme.chars.bullet}`

    return (
      <Box>
        <Text color={theme.colors.accentDim}>{prefix} </Text>
        <Text color={baseColor} wrap="wrap">
          {block.tokens.map((token, ti) => (
            <MarkdownTokenRenderer key={ti} token={token} />
          ))}
        </Text>
      </Box>
    )
  }

  if (block.type === "diff_hunk") {
    return (
      <Box flexDirection="column" marginY={0}>
        {block.lines.map((line, li) => {
          const isAdd = line.prefix === "+"
          const isDel = line.prefix === "-"
          const lineColor = isAdd
            ? theme.colors.diffAdd
            : isDel
              ? theme.colors.diffDel
              : theme.colors.textDim

          return (
            <Box key={li}>
              <Text color={lineColor}>
                {isAdd ? theme.icons.diffAdd : isDel ? theme.icons.diffDel : " "}{line.content}
              </Text>
            </Box>
          )
        })}
      </Box>
    )
  }

  return null
}

function MarkdownTokenRenderer({ token }: { token: MarkdownToken }) {
  if (token.type === "text") return <>{token.content}</>
  if (token.type === "bold") return <Text bold color={theme.colors.textBright}>{token.content}</Text>
  if (token.type === "italic") return <Text italic color={theme.colors.textDim}>{token.content}</Text>
  if (token.type === "code") return <Text color={theme.colors.code}>{token.content}</Text>
  return null
}

function tokenizeCode(code: string, language: string): { text: string; color?: string; dim?: boolean }[] {
  const tokens: { text: string; color?: string; dim?: boolean }[] = []

  const keywords = [
    "const", "let", "var", "function", "return", "if", "else", "for", "while",
    "import", "export", "from", "default", "class", "extends", "new", "this",
    "try", "catch", "throw", "async", "await", "typeof", "instanceof",
    "interface", "type", "enum", "implements", "abstract", "public", "private",
    "protected", "static", "readonly", "yield", "switch", "case", "break",
    "continue", "do", "in", "of", "get", "set", "as", "is",
  ]

  const combinedPattern = new RegExp(
    `(${keywords.join("|")})\\b|` +
    `("(?:[^"\\\\]|\\\\.)*")|` +
    `('(?:[^'\\\\]|\\\\.)*')|` +
    `(\`(?:[^\`\\\\]|\\\\.)*\`)|` +
    `(//[^\n]*)|` +
    `(/\\*[\\s\\S]*?\\*/)|` +
    `(\\b\\d+\\.?\\d*\\b)|` +
    `(</?[a-zA-Z][a-zA-Z0-9._-]*(?:\\s[^>]*)?/?>)|` +
    `([A-Z][a-zA-Z0-9_]*\\b)|` +
    `([a-zA-Z_$][a-zA-Z0-9_$]*)`,
    "g"
  )

  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = combinedPattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index) })
    }

    if (match[1]) tokens.push({ text: match[1], color: theme.colors.keyword })
    else if (match[2] || match[3] || match[4]) tokens.push({ text: match[0], color: theme.colors.string })
    else if (match[5] || match[6]) tokens.push({ text: match[0], color: theme.colors.comment, dim: true })
    else if (match[7]) tokens.push({ text: match[0], color: theme.colors.number })
    else if (match[8]) tokens.push({ text: match[0], color: theme.colors.tag })
    else if (match[9]) tokens.push({ text: match[0], color: theme.colors.type })
    else tokens.push({ text: match[0] })

    lastIndex = combinedPattern.lastIndex
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex) })
  }

  return tokens
}

function SyntaxHighlightedCode({ code, language }: { code: string; language: string }) {
  const highlighted = tokenizeCode(code, language)

  return (
    <Box flexDirection="column">
      <Text>
        {highlighted.map((tok, i) => (
          <Text key={i} color={tok.color} dimColor={tok.dim}>
            {tok.text}
          </Text>
        ))}
      </Text>
    </Box>
  )
}
