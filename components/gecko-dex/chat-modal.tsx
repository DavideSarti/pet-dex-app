"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { AnimalProfile } from "./types"

interface ChatModalProps {
  animals: AnimalProfile[]
  onClose: () => void
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

function ChatModal({ animals, onClose }: ChatModalProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: input.trim() }
    const allMessages = [...messages, userMsg]
    setMessages(allMessages)
    setInput("")
    setIsLoading(true)
    setError(null)

    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }])

    try {
      abortRef.current = new AbortController()
      const res = await fetch("/api/gecko-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          animalsData: animals,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const payload = line.slice(6).trim()
          if (!payload || payload === "[DONE]") continue
          try {
            const parsed = JSON.parse(payload)
            if (parsed.text) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + parsed.text } : m))
              )
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: `ERROR: ${msg}` } : m))
      )
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [input, isLoading, messages, animals])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-[340px] max-h-[80vh] flex flex-col bg-gb-darkest p-3 pixel-border" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-1.5 pb-2 border-b border-gb-dark">
          <div className="text-[10px] text-gb-lightest tracking-wider">
            {"== HERP-AI =="}
          </div>
          <button
            onClick={onClose}
            className="text-[10px] text-gb-dark hover:text-gb-light transition-colors"
            aria-label="Close chat"
          >
            {"[X]"}
          </button>
        </div>

        {/* API error */}
        {error && (
          <div className="mx-1.5 mb-1.5 rounded border border-red-900/50 bg-red-950/30 px-2.5 py-2 text-[9px] text-red-300">
            <span className="font-bold">{error.includes("401") || error.includes("missing") ? "SETUP NEEDED" : "API ERROR"}</span>
            <div className="mt-1 text-[8px] text-red-200 leading-relaxed">
              {error.includes("401") || error.includes("missing")
                ? "Chat needs a Gemini API key. Set GOOGLE_GENERATIVE_AI_API_KEY in your environment."
                : error.includes("429") || error.includes("RESOURCE_EXHAUSTED")
                ? "Rate limit reached. Wait a minute and try again."
                : "Something went wrong. Try again."}
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-1 text-[8px] text-gb-light underline"
            >
              {"[DISMISS]"}
            </button>
          </div>
        )}

        {/* Welcome hint */}
        {messages.length === 0 && !error && (
          <div className="px-1.5 py-2.5 text-[8px] text-gb-dark text-center leading-relaxed">
            {"ASK ME ANYTHING ABOUT"}<br />
            {"YOUR PET COLLECTION!"}<br />
            <span className="text-gb-dark/60">
              {"I HAVE ACCESS TO ALL"}<br />
              {`${animals.length} ANIMAL${animals.length !== 1 ? "S" : ""} IN YOUR DEX`}
            </span>
            <div className="mt-2 text-gb-dark/70">
              {"TRY: \"WHO NEEDS FEEDING?\""}<br />
              {"OR \"HEALTH SUMMARY\""}<br />
              {"OR \"HEAVIEST PET?\""}
            </div>
          </div>
        )}

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-2 flex flex-col gap-2 min-h-0"
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user"
            if (!msg.content.trim()) return null
            return (
              <div
                key={msg.id}
                className={`text-[9px] leading-relaxed px-2 py-1.5 ${
                  isUser
                    ? "bg-gb-dark/30 text-gb-light self-end max-w-[85%]"
                    : "bg-gb-dark/15 text-gb-lightest self-start max-w-[90%]"
                } border ${isUser ? "border-gb-dark" : "border-gb-dark/50"}`}
              >
                <span className="text-gb-dark text-[8px]">
                  {isUser ? "YOU> " : "AI> "}
                </span>
                {msg.content}
              </div>
            )
          })}

          {isLoading && messages.length > 0 && (
            <div className="text-[9px] text-gb-dark px-2 self-start">
              <span className="animate-blink">{"..."}</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-gb-dark">
          <span className="text-[9px] text-gb-dark shrink-0">{">"}</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit()
            }}
            placeholder="TYPE HERE..."
            className="flex-1 bg-gb-dark/20 text-gb-lightest border border-gb-dark text-[9px] px-2 py-1.5 font-mono outline-none placeholder:text-gb-dark/50 focus:border-gb-light min-w-0"
            disabled={isLoading}
            aria-label="Chat message input"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="text-[9px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light px-2 py-1.5 transition-colors disabled:opacity-30"
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
