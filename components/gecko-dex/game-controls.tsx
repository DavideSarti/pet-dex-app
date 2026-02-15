"use client"

import { useState } from "react"

interface ChatButtonProps {
  onChatPress: () => void
}

export function ChatButton({ onChatPress }: ChatButtonProps) {
  const [active, setActive] = useState(false)

  const handlePress = () => {
    setActive(true)
    onChatPress()
    setTimeout(() => setActive(false), 150)
  }

  return (
    <div className="flex items-center justify-center px-3 py-2">
      <button
        onClick={handlePress}
        className={`flex items-center gap-1.5 px-4 py-1.5 text-[6px] tracking-wider transition-all ${
          active
            ? "text-neutral-200"
            : "text-neutral-500 hover:text-neutral-300"
        }`}
        style={{
          background: active
            ? "#2a2a2a"
            : "linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)",
          borderRadius: "12px",
          boxShadow: active
            ? "inset 1px 1px 3px rgba(0,0,0,0.6)"
            : "1px 1px 0px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
        aria-label="Open AI chat"
      >
        <ChatIcon />
        <span>GECKO-AI</span>
      </button>
    </div>
  )
}

function ChatIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
      <rect x="0" y="1" width="7" height="5" rx="0" />
      <polygon points="1,6 3,6 1,8" />
    </svg>
  )
}
