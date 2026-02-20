"use client"

import { useEffect } from "react"

interface WaterModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export function WaterModal({ onConfirm, onCancel }: WaterModalProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel() }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[340px] pixel-border bg-gb-darkest p-3 flex flex-col gap-3"
        role="dialog"
        aria-label="Log water change"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[8px] text-gb-lightest text-center tracking-wider">
          {"== WATER CHANGE =="}
        </div>

        <div className="pixel-border-inset bg-gb-dark/20 py-3 px-3 flex flex-col items-center gap-1">
          <div className="text-[7px] text-gb-light text-center tracking-wider">
            LOG WATER CHANGE?
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 text-[8px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-[8px] text-gb-darkest bg-gb-light hover:bg-gb-lightest py-1.5 transition-colors tracking-wider font-bold"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  )
}
