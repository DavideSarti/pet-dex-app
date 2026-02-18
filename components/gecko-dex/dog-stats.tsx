"use client"

import { useState } from "react"
import { toDDMM, daysAgo } from "@/lib/utils"
import type { WeightEntry } from "./types"
import { WeightChart } from "./weight-chart"

interface DogStatsProps {
  weight: string
  lastVetCheckupIso: string
  nextVaccinationIso: string
  weightHistory: WeightEntry[]
}

function formatDateWithDaysAgo(iso: string): string {
  if (!iso) return "N/A"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "N/A"
  const ddmm = toDDMM(d)
  const days = daysAgo(iso)
  const ago = days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`
  return `${ddmm} - ${ago}`
}

function formatDateWithDaysUntil(iso: string): string {
  if (!iso) return "NOT SET"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "NOT SET"
  const ddmm = toDDMM(d)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    const overdue = Math.abs(diffDays)
    return `${ddmm} - ${overdue}d OVERDUE!`
  }
  if (diffDays === 0) return `${ddmm} - TODAY!`
  if (diffDays === 1) return `${ddmm} - TOMORROW`
  return `${ddmm} - in ${diffDays}d`
}

export function DogStats({
  weight,
  lastVetCheckupIso,
  nextVaccinationIso,
  weightHistory,
}: DogStatsProps) {
  const [showChart, setShowChart] = useState(false)

  return (
    <>
      <div className="pixel-border-inset bg-gb-darkest p-2.5">
        <div className="text-[6px] text-gb-dark mb-1.5 border-b border-gb-dark pb-1 tracking-wider">
          {"- STATS -"}
        </div>
        <div className="flex flex-col gap-1">
          <WeightRow value={weight} onChartOpen={() => setShowChart(true)} />
          <StatRow label="LAST VET" value={formatDateWithDaysAgo(lastVetCheckupIso)} />
          <StatRow label="NEXT VACC." value={formatDateWithDaysUntil(nextVaccinationIso)} />
        </div>
      </div>

      {showChart && (
        <WeightChart history={weightHistory} onClose={() => setShowChart(false)} />
      )}
    </>
  )
}

function WeightRow({ value, onChartOpen }: { value: string; onChartOpen: () => void }) {
  return (
    <div className="flex items-center text-[7px] leading-relaxed">
      <span className="text-gb-light mr-1" aria-hidden="true">{">"}</span>
      <span className="text-gb-dark w-[55px] shrink-0">WEIGHT:</span>
      <span className="text-gb-light flex-1">{value}</span>
      <button
        type="button"
        onClick={onChartOpen}
        className="text-gb-light hover:text-gb-lightest transition-colors ml-1 shrink-0"
        aria-label="View weight chart"
        title="Weight chart"
      >
        <svg width="15" height="15" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
          <path d="M0 7h8v1H0zM0 6l2-3 2 1.5L6 1l1.5 2H8V0H6L4 3.5 2 2 0 5z" />
        </svg>
      </button>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center text-[7px] leading-relaxed">
      <span className="text-gb-light mr-1" aria-hidden="true">{">"}</span>
      <span className="text-gb-dark w-[55px] shrink-0">{label}:</span>
      <span className="text-gb-light">{value}</span>
    </div>
  )
}
