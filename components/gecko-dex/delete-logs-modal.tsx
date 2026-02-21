"use client"

import { useState, useEffect, useCallback } from "react"
import type { HealthLogEntry } from "./types"

interface DeleteLogsModalProps {
  entries: HealthLogEntry[]
  onDelete: (from: string | null, to: string | null) => void
  onCancel: () => void
}

type Step = "choose" | "confirm"
type Mode = "all" | "range"

function getEntryDate(entry: HealthLogEntry): string | null {
  const n = Number(entry.id)
  if (!isNaN(n) && n > 1e12) {
    try { return new Date(n).toISOString().slice(0, 10) } catch { return null }
  }
  return null
}

function countMatching(entries: HealthLogEntry[], from: string | null, to: string | null): number {
  if (!from && !to) return entries.length
  return entries.filter((e) => {
    const d = getEntryDate(e)
    if (!d) return false
    if (from && d < from) return false
    if (to && d > to) return false
    return true
  }).length
}

export function DeleteLogsModal({ entries, onDelete, onCancel }: DeleteLogsModalProps) {
  const [step, setStep] = useState<Step>("choose")
  const [mode, setMode] = useState<Mode>("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [countToDelete, setCountToDelete] = useState(0)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel() }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [onCancel])

  const handleNext = useCallback(() => {
    if (mode === "all") {
      setCountToDelete(entries.length)
      setStep("confirm")
    } else {
      if (!fromDate && !toDate) return
      setCountToDelete(countMatching(entries, fromDate || null, toDate || null))
      setStep("confirm")
    }
  }, [mode, fromDate, toDate, entries])

  const handleConfirmDelete = useCallback(() => {
    if (mode === "all") {
      onDelete(null, null)
    } else {
      onDelete(fromDate || null, toDate || null)
    }
    onCancel()
  }, [mode, fromDate, toDate, onDelete, onCancel])

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[300px] pixel-border bg-gb-darkest p-3 flex flex-col gap-3"
        role="dialog"
        aria-label="Delete logs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[8px] text-gb-lightest text-center tracking-wider">
          {"== DELETE LOGS =="}
        </div>

        {step === "choose" && (
          <>
            <div className="pixel-border-inset bg-gb-dark/20 py-2 px-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setMode("all")}
                className={"text-[7px] tracking-wider py-1.5 px-2 border transition-colors w-full text-left " +
                  (mode === "all"
                    ? "border-gb-light text-gb-light bg-gb-dark/50"
                    : "border-gb-dark text-gb-dark hover:text-gb-light hover:border-gb-light")}
              >
                DELETE ALL LOGS ({entries.length})
              </button>
              <button
                type="button"
                onClick={() => setMode("range")}
                className={"text-[7px] tracking-wider py-1.5 px-2 border transition-colors w-full text-left " +
                  (mode === "range"
                    ? "border-gb-light text-gb-light bg-gb-dark/50"
                    : "border-gb-dark text-gb-dark hover:text-gb-light hover:border-gb-light")}
              >
                DELETE BY DATE RANGE
              </button>

              {mode === "range" && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-[6px] text-gb-dark tracking-wider">FROM</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-gb-darkest border border-gb-dark text-gb-light text-[7px] px-2 py-1 tracking-wider focus:border-gb-light outline-none"
                  />
                  <label className="text-[6px] text-gb-dark tracking-wider">TO</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-gb-darkest border border-gb-dark text-gb-light text-[7px] px-2 py-1 tracking-wider focus:border-gb-light outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 text-[8px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
              >
                CANCEL
              </button>
              <button
                onClick={handleNext}
                className="flex-1 text-[8px] text-gb-darkest bg-red-700 hover:bg-red-600 py-1.5 transition-colors tracking-wider font-bold"
              >
                NEXT
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <div className="pixel-border-inset bg-gb-dark/20 py-3 px-3 flex flex-col items-center gap-2">
              <div className="text-[8px] text-red-400 text-center tracking-wider font-bold">
                {"!! WARNING !!"}
              </div>
              <div className="text-[7px] text-gb-light text-center tracking-wider leading-relaxed">
                {countToDelete} log{countToDelete !== 1 ? "s" : ""} will be
                permanently deleted.
              </div>
              <div className="text-[6px] text-gb-dark text-center tracking-wider">
                This action cannot be undone.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep("choose")}
                className="flex-1 text-[8px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
              >
                GO BACK
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 text-[8px] text-gb-darkest bg-red-700 hover:bg-red-600 py-1.5 transition-colors tracking-wider font-bold"
              >
                DELETE
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}