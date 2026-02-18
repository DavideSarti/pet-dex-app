"use client"

import { useState } from "react"

interface WeightModalProps {
  currentWeight: string
  onConfirm: (weight: string) => void
  onCancel: () => void
  unit?: string
}

function WeightModal({ currentWeight, onConfirm, onCancel, unit = "g" }: WeightModalProps) {
  const [digits, setDigits] = useState<string>(
    currentWeight.replace(/[a-zA-Z]/g, "")
  )

  const handleConfirm = () => {
    if (digits !== "0" && digits !== "") onConfirm(digits)
  }

  const handleDigit = (d: string) => {
    if (d === ".") {
      if (digits.includes(".")) return
      setDigits((prev) => prev + ".")
      return
    }
    const maxLen = unit === "kg" ? 6 : 4
    if (digits.length >= maxLen) return
    setDigits((prev) => {
      const next = prev === "0" ? d : prev + d
      return next
    })
  }

  const handleBackspace = () => {
    setDigits((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)))
  }

  const handleClear = () => {
    setDigits("0")
  }

  const NUM_KEYS = unit === "kg"
    ? [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["C", "0", ".", "DEL"],
      ]
    : [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["C", "0", "DEL"],
      ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[340px] pixel-border bg-gb-darkest p-3 flex flex-col gap-2.5"
        role="dialog"
        aria-label="Log weight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-[8px] text-gb-lightest text-center tracking-wider">
          {"== LOG WEIGHT =="}
        </div>

        {/* Weight display */}
        <div className="pixel-border-inset bg-gb-dark/20 p-2 flex items-center justify-center gap-1">
          <span className="text-[6px] text-gb-dark">WEIGHT:</span>
          <span className="text-[13px] text-gb-lightest tracking-widest">
            {digits}
          </span>
          <span className="text-[8px] text-gb-light">{unit}</span>
        </div>

        {/* Number pad */}
        <div className="flex flex-col gap-1">
          {NUM_KEYS.map((row, ri) => (
            <div key={ri} className="flex gap-1 justify-center">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "C") handleClear()
                    else if (key === "DEL") handleBackspace()
                    else handleDigit(key)
                  }}
                  className={`w-[48px] py-1.5 text-[8px] text-center border transition-colors ${
                    key === "C" || key === "DEL"
                      ? "text-gb-dark border-gb-dark hover:text-gb-light hover:border-gb-light"
                      : "text-gb-light border-gb-dark hover:border-gb-light bg-gb-dark/20"
                  }`}
                  aria-label={
                    key === "DEL"
                      ? "Delete"
                      : key === "C"
                        ? "Clear"
                        : `Number ${key}`
                  }
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 text-[8px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 text-[8px] text-gb-darkest bg-gb-light hover:bg-gb-lightest py-1.5 transition-colors tracking-wider font-bold"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  )
}

export { WeightModal }
