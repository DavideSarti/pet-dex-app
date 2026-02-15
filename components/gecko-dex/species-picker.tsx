"use client"

interface SpeciesPickerProps {
  onSelect: (species: string) => void
  onCancel: () => void
}

const SPECIES = [
  {
    id: "LEOPARD GECKO",
    icon: "🦎",
    label: "Reptile",
  },
  {
    id: "RHINO BEETLE",
    icon: "🪲",
    label: "Insect",
  },
] as const

export function SpeciesPicker({ onSelect, onCancel }: SpeciesPickerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[280px] pixel-border bg-gb-darkest p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[7px] text-gb-lightest text-center tracking-wider">
          {"== SELECT SPECIES =="}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SPECIES.map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => onSelect(sp.id)}
              className="pixel-border bg-gb-dark/10 hover:bg-gb-dark/30 p-3 flex flex-col items-center gap-2 transition-colors group"
            >
              <span className="text-[20px]">{sp.icon}</span>
              <span className="text-[7px] text-gb-lightest group-hover:text-gb-lightest tracking-wider text-center leading-tight">
                {sp.id}
              </span>
              <span className="text-[5px] text-gb-dark tracking-wider">
                {sp.label}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-[7px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
        >
          CANCEL
        </button>
      </div>
    </div>
  )
}
