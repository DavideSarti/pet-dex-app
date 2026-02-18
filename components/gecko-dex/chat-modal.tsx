"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { AnimalProfile } from "./types"

interface ChatModalProps {
  animals: AnimalProfile[]
  onClose: () => void
}

function getUIMessageText(msg: {
  parts?: Array<{ type: string; text?: string }>
  content?: string
}): string {
  if (msg.parts && Array.isArray(msg.parts)) {
    const fromParts = msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("")
    if (fromParts) return fromParts
  }
  if (typeof (msg as { content?: string }).content === "string") {
    return (msg as { content: string }).content
  }
  return ""
}

function ChatModal({ animals, onClose }: ChatModalProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/gecko-chat" }),
    messages: [],
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (!error) return
    const errMsg = error instanceof Error ? error.message : String(error)
    setMessages((prev) => [
      ...prev,
      {
        id: `error-${Date.now()}`,
        role: "assistant",
        parts: [{ type: "text" as const, text: `ERROR: ${errMsg}. Check your API key and restart the dev server.` }],
      },
    ])
    clearError()
  }, [error, setMessages, clearError])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    sendMessage(
      { text: input },
      {
        body: { animalsData: animals },
      }
    )
    setInput("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-[340px] max-h-[80vh] flex flex-col bg-gb-darkest p-2 pixel-border" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-1 pb-1.5 border-b border-gb-dark">
          <div className="text-[7px] text-gb-lightest tracking-wider">
            {"== PET-AI =="}
          </div>
          <button
            onClick={onClose}
            className="text-[7px] text-gb-dark hover:text-gb-light transition-colors"
            aria-label="Close chat"
          >
            {"[X]"}
          </button>
        </div>

        {/* API error */}
        {error && (
          <div className="mx-1.5 mb-1.5 rounded border border-red-900/50 bg-red-950/30 px-2 py-1.5 text-[6px] text-red-300">
            <span className="font-bold">SETUP NEEDED</span>
            <div className="mt-1 text-[5px] text-red-200 leading-relaxed">
              Chat needs a Gemini API key. Do this once:
            </div>
            <ol className="mt-1 text-[5px] text-red-400 list-decimal list-inside space-y-0.5">
              <li>Get a key: aistudio.google.com → API keys → Create</li>
              <li>Open file: .env.local (same folder as package.json)</li>
              <li>Add: GOOGLE_GENERATIVE_AI_API_KEY=your-key-here</li>
              <li>Save, then restart the dev server</li>
            </ol>
            <button
              type="button"
              onClick={() => clearError()}
              className="mt-1 text-[5px] text-gb-light underline"
            >
              {"[DISMISS]"}
            </button>
          </div>
        )}

        {/* Welcome hint */}
        {messages.length === 0 && !error && (
          <div className="px-1 py-2 text-[5px] text-gb-dark text-center leading-relaxed">
            {"ASK ME ANYTHING ABOUT"}<br />
            {"YOUR PET COLLECTION!"}<br />
            <span className="text-gb-dark/60">
              {"I HAVE ACCESS TO ALL"}<br />
              {`${animals.length} ANIMAL${animals.length !== 1 ? "S" : ""} IN YOUR DEX`}
            </span>
            <div className="mt-1.5 text-gb-dark/70">
              {"TRY: \"WHO NEEDS FEEDING?\""}<br />
              {"OR \"HEALTH SUMMARY\""}<br />
              {"OR \"HEAVIEST PET?\""}
            </div>
          </div>
        )}

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-1.5 flex flex-col gap-1.5 min-h-0"
        >
          {messages.map((msg) => {
            const text = getUIMessageText(msg)
            const isUser = msg.role === "user"
            if (!text.trim()) return null
            return (
              <div
                key={msg.id}
                className={`text-[6px] leading-relaxed px-1.5 py-1 ${
                  isUser
                    ? "bg-gb-dark/30 text-gb-light self-end max-w-[85%]"
                    : "bg-gb-dark/15 text-gb-lightest self-start max-w-[90%]"
                } border ${isUser ? "border-gb-dark" : "border-gb-dark/50"}`}
              >
                <span className="text-gb-dark text-[5px]">
                  {isUser ? "YOU> " : "AI> "}
                </span>
                {text}
              </div>
            )
          })}

          {isLoading && messages.length > 0 && (
            <div className="text-[6px] text-gb-dark px-1.5 self-start">
              <span className="animate-blink">{"..."}</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-1 pt-1.5 border-t border-gb-dark">
          <span className="text-[6px] text-gb-dark shrink-0">{">"}</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit()
            }}
            placeholder="TYPE HERE..."
            className="flex-1 bg-gb-dark/20 text-gb-lightest border border-gb-dark text-[6px] px-1.5 py-1 font-mono outline-none placeholder:text-gb-dark/50 focus:border-gb-light min-w-0"
            disabled={isLoading}
            aria-label="Chat message input"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="text-[6px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light px-1.5 py-1 transition-colors disabled:opacity-30"
            aria-label="Send message"
          >
            {">>"}
          </button>
        </div>
      </div>
    </div>
  )
}

export { ChatModal }
