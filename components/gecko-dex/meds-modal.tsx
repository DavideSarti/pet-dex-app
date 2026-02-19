"use client"

import { useState, useEffect } from "react"
import type { Prescription } from "./types"

interface MedsModalProps {
  prescriptions: Prescription[]
  onAddPrescription: (medName: string, totalDays: number, dosesPerDay: number, notes: string) => void
  onLogDose: (rxId: string) => void
  onComplete: (rxId: string) => void
  onClose: () => void
}

export function MedsModal({
  prescriptions,
  onAddPrescription,
  onLogDose,
  onComplete,
  onClose,
}: MedsModalProps) {
  const [view, setView] = useState<"list" | "add">("list")
  const [medName, setMedName] = useState("")
  const [totalDays, setTotalDays] = useState("")
  const [dosesPerDay, setDosesPerDay] = useState("1")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [onClose])

  const active = prescriptions.filter((rx) => !rx.completed)
  const completed = prescriptions.filter((rx) => rx.completed)

  const todayISO = new Date().toISOString().slice(0, 10)

  const handleCreate = () => {
    const name = medName.trim().toUpperCase()
    const days = parseInt(totalDays, 10)
    const perDay = parseInt(dosesPerDay, 10)
    if (!name || isNaN(days) || days < 1) return
    const validPerDay = isNaN(perDay) || perDay < 1 ? 1 : perDay
    onAddPrescription(name, days, validPerDay, notes.trim())
    setMedName("")
    setTotalDays("")
    setDosesPerDay("1")
    setNotes("")
    setView("list")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] pixel-border bg-gb-darkest p-3 flex flex-col gap-2 max-h-[80vh] overflow-hidden"
        role="dialog"
        aria-label="Medications"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-[8px] text-gb-lightest text-center tracking-wider">
          {"== MEDICATIONS =="}
        </div>

        {view === "list" ? (
          <>
            {/* Active prescriptions */}
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-0.5">
              {active.length === 0 && (
                <div className="text-[7px] text-gb-dark text-center py-3">
                  NO ACTIVE PRESCRIPTIONS
                </div>
              )}
              {active.map((rx) => (
                <PrescriptionCard
                  key={rx.id}
                  rx={rx}
                  todayISO={todayISO}
                  onLogDose={onLogDose}
                  onComplete={onComplete}
                />
              ))}

              {/* Completed section */}
              {completed.length > 0 && (
                <>
                  <div className="text-[6px] text-gb-dark tracking-wider border-t border-gb-dark pt-1 mt-1">
                    COMPLETED ({completed.length})
                  </div>
                  {completed.map((rx) => (
                    <div
                      key={rx.id}
                      className="border border-gb-dark/50 p-1.5 opacity-50"
                    >
                      <div className="text-[7px] text-gb-dark">
                        {rx.medName} - {rx.dosesGiven.length}/{rx.totalDays * (rx.dosesPerDay || 1)} DOSES
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-1">
              <button
                onClick={onClose}
                className="flex-1 text-[8px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
              >
                CLOSE
              </button>
              <button
                onClick={() => setView("add")}
                className="flex-1 text-[8px] text-gb-darkest bg-gb-light hover:bg-gb-lightest py-1.5 transition-colors tracking-wider font-bold"
              >
                + NEW RX
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Add prescription form */}
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-col gap-0.5">
                <label className="text-[6px] text-gb-dark">MEDICATION NAME</label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. VIT-A DROPS"
                  className="bg-gb-dark/20 border border-gb-dark text-gb-light text-[7px] px-1.5 py-1 placeholder:text-gb-dark/50 outline-none focus:border-gb-light font-mono"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[6px] text-gb-dark">TOTAL DAYS</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={totalDays}
                  onChange={(e) => setTotalDays(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 7"
                  className="bg-gb-dark/20 border border-gb-dark text-gb-light text-[7px] px-1.5 py-1 placeholder:text-gb-dark/50 outline-none focus:border-gb-light font-mono [appearance:textfield]"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[6px] text-gb-dark">DOSES PER DAY</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dosesPerDay}
                  onChange={(e) => setDosesPerDay(e.target.value.replace(/\D/g, ""))}
                  placeholder="1"
                  className="bg-gb-dark/20 border border-gb-dark text-gb-light text-[7px] px-1.5 py-1 placeholder:text-gb-dark/50 outline-none focus:border-gb-light font-mono [appearance:textfield]"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[6px] text-gb-dark">NOTES (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 2 drops daily"
                  className="bg-gb-dark/20 border border-gb-dark text-gb-light text-[7px] px-1.5 py-1 placeholder:text-gb-dark/50 outline-none focus:border-gb-light font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setView("list")}
                className="flex-1 text-[8px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 text-[8px] text-gb-darkest bg-gb-light hover:bg-gb-lightest py-1.5 transition-colors tracking-wider font-bold"
              >
                CREATE RX
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PrescriptionCard({
  rx,
  todayISO,
  onLogDose,
  onComplete,
}: {
  rx: Prescription
  todayISO: string
  onLogDose: (id: string) => void
  onComplete: (id: string) => void
}) {
  const perDay = rx.dosesPerDay || 1
  const totalDoses = rx.totalDays * perDay
  const dosesLeft = totalDoses - rx.dosesGiven.length
  const dosesToday = rx.dosesGiven.filter((d) => d === todayISO).length
  const allDoneToday = dosesToday >= perDay
  const progressPct = Math.round((rx.dosesGiven.length / totalDoses) * 100)

  return (
    <div className="border border-gb-dark p-1.5 flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[8px] text-gb-lightest tracking-wider font-bold">
          {rx.medName}
        </div>
        <div className="text-[6px] text-gb-dark">
          SINCE {rx.startDate.slice(8)}/{rx.startDate.slice(5, 7)}
        </div>
      </div>

      {/* Info line */}
      <div className="text-[6px] text-gb-dark">
        {perDay > 1 ? `${perDay}x/DAY` : "1x/DAY"} · {rx.totalDays} DAYS
        {rx.notes ? ` · ${rx.notes}` : ""}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-[4px] bg-gb-dark/30 overflow-hidden">
          <div
            className="h-full bg-gb-light transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[6px] text-gb-light shrink-0">
          {rx.dosesGiven.length}/{totalDoses}
        </span>
      </div>

      {/* Days left info */}
      <div className="text-[7px] text-gb-light">
        {dosesLeft > 0 ? (
          <>
            <span className="text-gb-lightest font-bold">{dosesLeft}</span>
            {" "}DOSE{dosesLeft > 1 ? "S" : ""} LEFT
          </>
        ) : (
          <span className="text-gb-lightest">ALL DOSES GIVEN</span>
        )}
        {dosesToday > 0 && (
          <span className="text-gb-dark ml-1">
            {"(TODAY: "}{dosesToday}/{perDay}{")"}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onLogDose(rx.id)}
          disabled={allDoneToday || dosesLeft <= 0}
          className={`flex-1 text-[7px] py-1 border transition-colors tracking-wider ${
            allDoneToday || dosesLeft <= 0
              ? "border-gb-dark/50 text-gb-dark/50 cursor-not-allowed"
              : "border-gb-light text-gb-darkest bg-gb-light hover:bg-gb-lightest font-bold"
          }`}
        >
          {allDoneToday ? `TODAY ${dosesToday}/${perDay} ✓` : dosesLeft <= 0 ? "DONE" : "LOG DOSE"}
        </button>
        {dosesLeft > 0 && (
          <button
            onClick={() => onComplete(rx.id)}
            className="text-[7px] px-2 py-1 border border-gb-dark text-gb-dark hover:text-gb-light hover:border-gb-light transition-colors tracking-wider"
          >
            END
          </button>
        )}
      </div>
    </div>
  )
}
