"use client"

import { useState, useEffect } from "react"

const SHED_QUALITY = ["CLEAN", "PARTIAL", "STUCK"] as const

interface ShedModalProps {
  lastShed: string
  onConfirm: (quality: (typeof SHED_QUALITY)[number]) => void
  onCancel: () => void
}

function ShedModal({ lastShed, onConfirm, onCancel }: ShedModalProps) {
  const [quality, setQuality] =
    useState<(typeof SHED_QUALITY)[number]>("CLEAN")
  const [animFrame, setAnimFrame] = useState(0)
  const [confirmed, setConfirmed] = useState(false)

  // Pixel shedding animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimFrame((prev) => (prev + 1) % 4)
    }, 400)
    return () => clearInterval(interval)
  }, [])

  // Auto-close after celebration
  useEffect(() => {
    if (confirmed) {
      const timeout = setTimeout(() => {
        onConfirm(quality)
      }, 1400)
      return () => clearTimeout(timeout)
    }
  }, [confirmed, quality, onConfirm])

  const cycleQuality = (dir: 1 | -1) => {
    const idx = SHED_QUALITY.indexOf(quality)
    const next =
      (idx + dir + SHED_QUALITY.length) % SHED_QUALITY.length
    setQuality(SHED_QUALITY[next])
  }

  // Compute days since last shed (lastShed is ISO "YYYY-MM-DD")
  const daysSinceLastShed = (() => {
    const now = new Date()
    const shedDate = new Date(lastShed)
    if (isNaN(shedDate.getTime())) return 0
    return Math.max(
      0,
      Math.floor((now.getTime() - shedDate.getTime()) / (1000 * 60 * 60 * 24))
    )
  })()

  // Progress bar (~30 day cycle)
  const cycleLength = 30
  const progress = Math.min(daysSinceLastShed / cycleLength, 1)
  const barWidth = 18
  const filled = Math.round(progress * barWidth)

  // Animated gecko shedding frames (ASCII art)
  const shedFrames = [
    ["  ___      ", " / o \\__   ", "|  __/  \\  ", " \\_|  |\\ \\ ", "    |_| \\_\\"],
    ["  ___      ", " / o \\__   ", "|  __/ ~\\  ", " \\_|  | ~\\ ", "    |_| \\_\\"],
    ["  ___      ", " / o \\__   ", "|  __/~ \\  ", " \\_| ~|\\ \\ ", "    |_| \\_\\"],
    ["  ___      ", " / o \\__   ", "|  __/  \\  ", " \\_| ~| ~\\ ", "   ~|_| \\_\\"],
  ]

  // Celebration screen
  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-[340px] pixel-border bg-gb-darkest p-4 flex flex-col items-center gap-3">
          <div className="text-gb-lightest text-[8px] animate-pulse tracking-wider">
            {"~~ SHED LOGGED ~~"}
          </div>

          {/* Sparkle animation */}
          <div className="relative w-full h-12 flex items-center justify-center overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="absolute text-[10px] text-gb-light animate-bounce"
                style={{
                  left: `${10 + i * 11}%`,
                  top: `${i % 2 === 0 ? 0 : 30}%`,
                  animationDelay: `${i * 80}ms`,
                  animationDuration: "0.6s",
                }}
              >
                {"*"}
              </span>
            ))}
            <span className="text-[14px] text-gb-lightest z-10">
              {"FRESH!"}
            </span>
          </div>

          <div className="text-[6px] text-gb-dark">
            {"QUALITY: "}
            <span
              className={
                quality === "CLEAN"
                  ? "text-gb-lightest"
                  : quality === "PARTIAL"
                    ? "text-gb-light"
                    : "text-gb-dark"
              }
            >
              {quality}
            </span>
          </div>

          {/* Skin pieces falling */}
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="text-[8px] text-gb-dark animate-bounce"
                style={{
                  animationDelay: `${i * 120}ms`,
                  animationDuration: "0.8s",
                }}
              >
                {"~"}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[340px] pixel-border bg-gb-darkest p-3 flex flex-col gap-2"
        role="dialog"
        aria-label="Log shed"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-[7px] text-gb-lightest text-center tracking-wider">
          {"== SHED TRACKER =="}
        </div>

        {/* Animated gecko ASCII art */}
        <div className="pixel-border-inset bg-gb-dark/20 py-2 px-3 flex flex-col items-center">
          {shedFrames[animFrame].map((line, i) => (
            <div
              key={i}
              className="text-[5px] text-gb-light whitespace-pre font-mono leading-tight"
            >
              {line}
            </div>
          ))}
        </div>

        {/* Days counter + progress */}
        <div className="flex flex-col gap-1 items-center">
          <div className="text-[5px] text-gb-dark tracking-wider">
            DAYS SINCE LAST SHED
          </div>
          <div className="text-[14px] text-gb-lightest leading-none">
            {daysSinceLastShed}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 justify-center">
          <span className="text-[5px] text-gb-dark">{"["}</span>
          <div className="flex">
            {Array.from({ length: barWidth }).map((_, i) => (
              <span
                key={i}
                className={`text-[6px] ${
                  i < filled ? "text-gb-light" : "text-gb-dark"
                }`}
              >
                {i < filled ? "#" : "-"}
              </span>
            ))}
          </div>
          <span className="text-[5px] text-gb-dark">{"]"}</span>
          <span className="text-[5px] text-gb-light">
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* Quality selector */}
        <div className="flex items-center gap-1 justify-center">
          <span className="text-[5px] text-gb-dark">QUALITY:</span>
          <button
            onClick={() => cycleQuality(-1)}
            className="text-[8px] text-gb-dark hover:text-gb-light px-1"
            aria-label="Previous quality"
          >
            {"<"}
          </button>
          <div
            className={`text-[7px] px-2 py-0.5 border text-center min-w-[72px] ${
              quality === "CLEAN"
                ? "text-gb-lightest border-gb-light"
                : quality === "PARTIAL"
                  ? "text-gb-light border-gb-dark"
                  : "text-gb-dark border-gb-dark"
            }`}
          >
            {quality}
          </div>
          <button
            onClick={() => cycleQuality(1)}
            className="text-[8px] text-gb-dark hover:text-gb-light px-1"
            aria-label="Next quality"
          >
            {">"}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-0.5">
          <button
            onClick={onCancel}
            className="flex-1 text-[7px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
          >
            CANCEL
          </button>
          <button
            onClick={() => setConfirmed(true)}
            className="flex-1 text-[7px] text-gb-darkest bg-gb-light hover:bg-gb-lightest py-1.5 transition-colors tracking-wider font-bold"
          >
            LOG SHED
          </button>
        </div>
      </div>
    </div>
  )
}

export { ShedModal }
