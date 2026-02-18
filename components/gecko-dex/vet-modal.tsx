"use client"

import { useState } from "react"

interface VetModalProps {
  lastVetCheckup: string
  nextVaccination: string
  onLogVet: (notes: string) => void
  onSetVaccination: (dateIso: string) => void
  onCancel: () => void
}

export function VetModal({ lastVetCheckup, nextVaccination, onLogVet, onSetVaccination, onCancel }: VetModalProps) {
  const [tab, setTab] = useState<"checkup" | "vaccine">("checkup")
  const [vetNotes, setVetNotes] = useState("")
  const [vaccDate, setVaccDate] = useState(nextVaccination || "")

  return (
    <div className="absolute inset-0 z-20 bg-gb-darkest/95 flex flex-col p-3 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] text-gb-lightest tracking-wider">
          {"== VET =="}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-[9px] text-gb-dark hover:text-gb-light transition-colors"
        >
          CLOSE
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        <button
          type="button"
          onClick={() => setTab("checkup")}
          className={`flex-1 text-[7px] py-1 border transition-colors tracking-wider ${
            tab === "checkup"
              ? "border-gb-light text-gb-light bg-gb-dark/50"
              : "border-gb-dark text-gb-dark hover:text-gb-light hover:border-gb-light"
          }`}
        >
          LOG CHECKUP
        </button>
        <button
          type="button"
          onClick={() => setTab("vaccine")}
          className={`flex-1 text-[7px] py-1 border transition-colors tracking-wider ${
            tab === "vaccine"
              ? "border-gb-light text-gb-light bg-gb-dark/50"
              : "border-gb-dark text-gb-dark hover:text-gb-light hover:border-gb-light"
          }`}
        >
          VACCINATION
        </button>
      </div>

      {tab === "checkup" && (
        <div className="flex flex-col gap-2">
          {lastVetCheckup && (
            <div className="text-[7px] text-gb-dark">
              LAST CHECKUP: {lastVetCheckup}
            </div>
          )}

          <div className="text-[7px] text-gb-light mb-0.5">NOTES (optional):</div>
          <textarea
            value={vetNotes}
            onChange={(e) => setVetNotes(e.target.value)}
            placeholder="e.g. ALL CLEAR, DENTAL CLEANING..."
            className="bg-gb-dark/40 text-gb-light border border-gb-dark px-1.5 py-1 text-[7px] font-mono outline-none focus:border-gb-light min-h-[40px] resize-none"
            maxLength={120}
          />

          <button
            type="button"
            onClick={() => {
              onLogVet(vetNotes.trim().toUpperCase() || "CHECKUP OK")
              onCancel()
            }}
            className="w-full text-[8px] text-gb-darkest bg-gb-light hover:bg-gb-lightest border border-gb-light py-1.5 transition-colors tracking-wider font-bold mt-1"
          >
            LOG VET VISIT TODAY
          </button>
        </div>
      )}

      {tab === "vaccine" && (
        <div className="flex flex-col gap-2">
          {nextVaccination && (
            <div className="text-[7px] text-gb-dark">
              CURRENT NEXT VACC: {nextVaccination}
            </div>
          )}

          <div className="text-[7px] text-gb-light mb-0.5">NEXT VACCINATION DATE:</div>
          <input
            type="date"
            value={vaccDate}
            onChange={(e) => setVaccDate(e.target.value)}
            className="bg-gb-dark/40 text-gb-light border border-gb-dark px-1.5 py-1 text-[7px] font-mono outline-none focus:border-gb-light"
          />

          <button
            type="button"
            onClick={() => {
              if (vaccDate) {
                onSetVaccination(vaccDate)
                onCancel()
              }
            }}
            disabled={!vaccDate}
            className="w-full text-[8px] text-gb-darkest bg-gb-light hover:bg-gb-lightest border border-gb-light py-1.5 transition-colors tracking-wider font-bold mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            SET VACCINATION DATE
          </button>
        </div>
      )}
    </div>
  )
}
