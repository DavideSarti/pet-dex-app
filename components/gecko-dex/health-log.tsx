"use client"

import { useState, useRef, useEffect } from "react"
import type { HealthLogType, HealthLogEntry } from "./types"

export type { HealthLogType, HealthLogEntry }

const GECKO_FILTERS: { value: HealthLogType | "all"; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "feeding", label: "FEED" },
  { value: "meds", label: "MEDS" },
  { value: "vet", label: "VET" },
  { value: "shed", label: "SHED" },
]

const BEETLE_FILTERS: { value: HealthLogType | "all"; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "feeding", label: "FEED" },
  { value: "substrate", label: "SUB." },
]

const DOG_FILTERS: { value: HealthLogType | "all"; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "meds", label: "MEDS" },
  { value: "vet", label: "VET" },
]

interface HealthLogProps {
  entries: HealthLogEntry[]
  species?: string
  fullScreen?: boolean
}

export function HealthLog({ entries, species, fullScreen }: HealthLogProps) {
  const filters = species === "DOG" ? DOG_FILTERS : species === "RHINO BEETLE" ? BEETLE_FILTERS : GECKO_FILTERS
  const [filter, setFilter] = useState<HealthLogType | "all">("all")
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtered =
    filter === "all"
      ? entries
      : entries.filter((e) => e.type === filter)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [filtered])

  return (
    <div className={`pixel-border-inset bg-gb-darkest p-2.5 flex flex-col ${fullScreen ? "flex-1 min-h-0" : ""}`}>
      <div className="flex items-center justify-between gap-1.5 mb-1.5 border-b border-gb-dark pb-1">
        <span className="text-[5px] text-gb-dark tracking-wider shrink-0">
          {"- RECORDS -"}
        </span>
        <div className="flex gap-0.5 items-center flex-wrap">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`text-[5px] px-1 py-0.5 border transition-colors shrink-0 ${
                filter === value
                  ? "border-gb-light text-gb-light bg-gb-dark/50"
                  : "border-gb-dark text-gb-dark hover:text-gb-light hover:border-gb-light"
              }`}
              aria-pressed={filter === value}
              aria-label={`Filter by ${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={scrollRef}
        className={`overflow-y-auto flex flex-col gap-0.5 pr-1 ${fullScreen ? "flex-1 min-h-0" : "h-[72px]"}`}
        role="log"
        aria-label="Records"
      >
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="text-[6px] text-gb-light leading-relaxed flex items-start"
          >
            <span className="text-gb-dark mr-0.5 shrink-0" aria-hidden="true">
              {">"}
            </span>
            <span>{entry.text}</span>
          </div>
        ))}
        {/* Blinking cursor */}
        <div className="text-[6px] text-gb-light flex items-center" aria-hidden="true">
          <span className="animate-blink">_</span>
        </div>
      </div>
    </div>
  )
}
