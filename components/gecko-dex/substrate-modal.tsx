"use client"

import { useState, useEffect } from "react"

const SUBSTRATE_TYPES = [
  "OAK FLAKE SOIL",
  "COCONUT FIBER",
  "FERMENTED WOOD",
  "LEAF LITTER MIX",
  "CUSTOM",
] as const

interface SubstrateModalProps {
  currentSubstrate: string
  lastChange: string // ISO date
  onConfirm: (substrateType: string) => void
  onCancel: () => void
}

export function SubstrateModal({ currentSubstrate, lastChange, onConfirm, onCancel }: SubstrateModalProps) {
  const [selected, setSelected] = useState(currentSubstrate || SUBSTRATE_TYPES[0])
  const [customName, setCustomName] = useState("")
  const [confirmed, setConfirmed] = useState(false)

  // Compute days since last change
  const daysSinceChange = (() => {
    const now = new Date()
    const d = new Date(lastChange)
    if (isNaN(d.getTime())) return 0
    return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)))
  })()

  // Auto-close after celebration
  useEffect(() => {
    if (confirmed) {
      const value = selected === "CUSTOM" ? (customName.trim().toUpperCase() || "CUSTOM") : selected
      const timeout = setTimeout(() => onConfirm(value), 1200)
      return () => clearTimeout(timeout)
    }
  }, [confirmed, selected, customName, onConfirm])

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-[340px] pixel-border bg-gb-darkest p-4 flex flex-col items-center gap-3">
          <div className="text-gb-lightest text-[8px] animate-pulse tracking-wider">
            {"~~ SUBSTRATE CHANGED ~~"}
          </div>
          <div className="text-[14px] text-gb-lightest">{"FRESH!"}</div>
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="text-[8px] text-gb-dark animate-bounce"
                style={{ animationDelay: `${i * 120}ms`, animationDuration: "0.8s" }}
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
        aria-label="Log substrate change"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-[7px] text-gb-lightest text-center tracking-wider">
          {"== SUBSTRATE CHANGE =="}
        </div>

        {/* Days since last change */}
        <div className="flex flex-col gap-1 items-center">
          <div className="text-[5px] text-gb-dark tracking-wider">
            DAYS SINCE LAST CHANGE
          </div>
          <div className="text-[14px] text-gb-lightest leading-none">
            {daysSinceChange}
          </div>
        </div>

        {/* Current substrate */}
        <div className="text-[6px] text-gb-dark text-center">
          CURRENT: <span className="text-gb-light">{currentSubstrate || "N/A"}</span>
        </div>

        {/* Substrate type selector */}
        <div className="text-[5px] text-gb-dark tracking-wider text-center mt-1">
          SELECT NEW SUBSTRATE
        </div>
        <div className="flex flex-col gap-1">
          {SUBSTRATE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelected(type)}
              className={`w-full text-[7px] py-1 px-2 border transition-colors tracking-wider text-left ${
                selected === type
                  ? "border-gb-light text-gb-light bg-gb-dark/50"
                  : "border-gb-dark text-gb-dark hover:text-gb-light hover:border-gb-light"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Custom name input */}
        {selected === "CUSTOM" && (
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Enter substrate name..."
            className="w-full bg-gb-dark/40 text-gb-lightest border border-gb-light px-2 py-1 text-[7px] font-mono outline-none"
            maxLength={30}
            autoFocus
          />
        )}

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
            LOG CHANGE
          </button>
        </div>
      </div>
    </div>
  )
}
