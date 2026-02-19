"use client"

import { useEffect } from "react"

interface SpeciesPickerProps {
  onSelect: (species: string) => void
  onCancel: () => void
}

const SPECIES = [
  {
    id: "LEOPARD GECKO",
    icon: "🦎",
    label: "Reptile",
    available: true,
  },
  {
    id: "RHINO BEETLE",
    icon: "🪲",
    label: "Insect",
    available: false,
  },
] as const

export function SpeciesPicker({ onSelect, onCancel }: SpeciesPickerProps) {
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
        className="w-full max-w-[280px] pixel-border bg-gb-darkest p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[8px] text-gb-lightest text-center tracking-wider">
          {"== SELECT SPECIES =="}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {SPECIES.map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => sp.available && onSelect(sp.id)}
              disabled={!sp.available}
              className={`pixel-border p-3 flex flex-col items-center gap-2 transition-colors group ${
                sp.available
                  ? "bg-gb-dark/10 hover:bg-gb-dark/30"
                  : "bg-gb-darkest/40 opacity-40 cursor-not-allowed"
              }`}
            >
              <span className="text-[22px]">{sp.icon}</span>
              <span className="text-[8px] text-gb-lightest tracking-wider text-center leading-tight">
                {sp.id}
              </span>
              <span className="text-[6px] text-gb-dark tracking-wider">
                {sp.available ? sp.label : "COMING SOON"}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-[8px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
        >
          CANCEL
        </button>
      </div>
    </div>
  )
}
