"use client"

import { useState } from "react"

interface PinScreenProps {
  onSubmit: (pin: string) => void
  loading: boolean
  error: string | null
}

export function PinScreen({ onSubmit, loading, error }: PinScreenProps) {
  const [pin, setPin] = useState("")

  const handleSubmit = () => {
    const trimmed = pin.trim()
    if (trimmed.length >= 4) {
      onSubmit(trimmed)
    }
  }

  return (
    <div className="h-dvh bg-gb-darkest flex items-center justify-center p-2 sm:p-4">
      <div
        className="w-full max-w-[480px] flex flex-col items-center"
        style={{
          background:
            "linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 50%, #2a2a2a 100%)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow:
            "6px 6px 0px 0px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Screen bezel */}
        <div
          className="w-full"
          style={{
            background: "#1a1a1a",
            borderRadius: "4px",
            padding: "12px",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {/* Inner screen */}
          <div
            className="flex flex-col items-center gap-4 py-6 px-4"
            style={{
              background: "#0f380f",
              border: "3px solid #0a2a0a",
              boxShadow:
                "inset 0 0 20px rgba(15,56,15,0.8), 0 0 4px rgba(139,172,15,0.1)",
            }}
          >
            {/* Scanlines */}
            <div
              className="scanlines absolute inset-0 pointer-events-none"
              aria-hidden="true"
            />

            {/* Title */}
            <div className="text-center">
              <h1 className="text-[9px] text-gb-lightest tracking-[0.15em] mb-1">
                HERP-DEX
              </h1>
              <div className="text-[7px] text-gb-dark tracking-wider">
                CLOUD SYNC
              </div>
            </div>

            {/* Instructions */}
            <div className="text-[6px] text-gb-light text-center leading-relaxed max-w-[200px]">
              ENTER YOUR PIN TO SYNC DATA ACROSS ALL YOUR DEVICES.
              USE THE SAME PIN ON EVERY DEVICE.
            </div>

            {/* PIN input */}
            <div className="flex flex-col items-center gap-2 w-full max-w-[160px]">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="YOUR PIN"
                maxLength={20}
                autoComplete="off"
                className="w-full text-center text-[10px] tracking-[0.3em] py-1.5 px-2 border-2 border-gb-dark bg-gb-darkest text-gb-lightest placeholder:text-gb-dark focus:border-gb-light focus:outline-none"
                autoFocus
              />

              {error && (
                <div className="text-[6px] text-red-400 text-center">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={pin.trim().length < 4 || loading}
                className="w-full py-1.5 text-[7px] tracking-wider border-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-gb-darkest text-gb-light border-gb-dark hover:border-gb-light hover:text-gb-lightest"
              >
                {loading ? "CONNECTING..." : "ENTER"}
              </button>
            </div>

            {/* Hint */}
            <div className="text-[5px] text-gb-dark text-center tracking-wider">
              MIN 4 CHARACTERS
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
