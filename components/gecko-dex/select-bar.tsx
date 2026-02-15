"use client"

import { useState } from "react"

interface SelectBarProps {
  tabs: string[]
  onSelect: (tab: string) => void
}

export function SelectBar({ tabs, onSelect }: SelectBarProps) {
  const [active, setActive] = useState<number>(0)

  const handleSelect = (index: number) => {
    setActive(index)
    onSelect(tabs[index])
  }

  return (
    <div className="flex items-center gap-1" role="tablist" aria-label="Actions">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          role="tab"
          aria-selected={i === active}
          onClick={() => handleSelect(i)}
          className={`flex-1 py-1 text-[6px] text-center transition-colors border-2 ${
            i === active
              ? "bg-gb-light text-gb-darkest border-gb-lightest"
              : "bg-gb-darkest text-gb-dark border-gb-dark hover:border-gb-light hover:text-gb-light"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
