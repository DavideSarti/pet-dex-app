"use client"

import { useState } from "react"

const FEEDERS = ["MEALWORMS", "CRICKETS", "ROACHES", "CUSTOM"] as const

const INTEGRATOR_OPTIONS = ["Calcium", "D3", "Multivitamin"] as const

interface FeedRow {
  feeder: (typeof FEEDERS)[number]
  customName?: string
  qty: number
}

export type FeedModalResult = { rows: FeedRow[]; integrators: string[] }

interface FeedModalProps {
  onConfirm: (rows: FeedRow[], integrators: string[]) => void
  onCancel: () => void
}

function FeedModal({ onConfirm, onCancel }: FeedModalProps) {
  const [rows, setRows] = useState<FeedRow[]>([
    { feeder: "CRICKETS", qty: 3 },
  ])
  const [integrators, setIntegrators] = useState<Record<string, boolean>>({
    Calcium: false,
    D3: false,
    Multivitamin: false,
  })
  const [customIntegrator, setCustomIntegrator] = useState("")

  const getIntegratorsList = (): string[] => {
    const list = INTEGRATOR_OPTIONS.filter((key) => integrators[key]).slice()
    if (customIntegrator.trim()) list.push(customIntegrator.trim())
    return list
  }

  const handleConfirm = () => {
    const resolved = rows.map((r) => ({
      ...r,
      feeder: r.feeder === "CUSTOM" && r.customName?.trim()
        ? r.customName.trim().toUpperCase() as typeof r.feeder
        : r.feeder,
    }))
    onConfirm(resolved, getIntegratorsList())
  }

  const cycleFeeder = (index: number, dir: 1 | -1) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r
        const currentIdx = FEEDERS.indexOf(r.feeder)
        const nextIdx =
          (currentIdx + dir + FEEDERS.length) % FEEDERS.length
        return { ...r, feeder: FEEDERS[nextIdx] }
      })
    )
  }

  const changeQty = (index: number, dir: 1 | -1) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r
        const next = r.qty + dir
        return { ...r, qty: Math.max(1, Math.min(99, next)) }
      })
    )
  }

  const setCustomName = (index: number, name: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, customName: name } : r))
    )
  }

  const addRow = () => {
    if (rows.length >= 4) return
    const used = rows.map((r) => r.feeder)
    const next = FEEDERS.find((f) => !used.includes(f)) || FEEDERS[0]
    setRows((prev) => [...prev, { feeder: next, qty: 1 }])
  }

  const removeRow = (index: number) => {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[340px] pixel-border bg-gb-darkest p-3 flex flex-col gap-2"
        role="dialog"
        aria-label="Log feeding"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-[7px] text-gb-lightest text-center tracking-wider">
          {"== LOG FEED =="}
        </div>

        {/* Feeder rows */}
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              {/* Feeder type selector */}
              <button
                onClick={() => cycleFeeder(i, -1)}
                className="text-[8px] text-gb-dark hover:text-gb-light px-0.5"
                aria-label="Previous feeder type"
              >
                {"<"}
              </button>
              <div className="flex-1 text-center text-[6px] text-gb-light bg-gb-dark/30 py-1 px-1 border border-gb-dark min-w-[70px]">
                {row.feeder}
              </div>
              <button
                onClick={() => cycleFeeder(i, 1)}
                className="text-[8px] text-gb-dark hover:text-gb-light px-0.5"
                aria-label="Next feeder type"
              >
                {">"}
              </button>

              {/* Separator */}
              <span
                className="text-[6px] text-gb-dark"
                aria-hidden="true"
              >
                x
              </span>

              {/* Quantity selector */}
              <button
                onClick={() => changeQty(i, -1)}
                className="text-[8px] text-gb-dark hover:text-gb-light px-0.5"
                aria-label="Decrease quantity"
              >
                {"-"}
              </button>
              <div className="text-[7px] text-gb-light bg-gb-dark/30 py-1 px-2 border border-gb-dark min-w-[24px] text-center">
                {String(row.qty).padStart(2, "0")}
              </div>
              <button
                onClick={() => changeQty(i, 1)}
                className="text-[8px] text-gb-dark hover:text-gb-light px-0.5"
                aria-label="Increase quantity"
              >
                {"+"}
              </button>

              {/* Remove row */}
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="text-[7px] text-gb-dark hover:text-gb-light px-0.5"
                  aria-label="Remove feeder row"
                >
                  {"X"}
                </button>
              )}
            </div>
            {row.feeder === "CUSTOM" && (
              <input
                type="text"
                value={row.customName ?? ""}
                onChange={(e) => setCustomName(i, e.target.value)}
                placeholder="e.g. Hornworms, Waxworms..."
                className="bg-gb-dark/20 border border-gb-dark text-gb-light text-[6px] px-1.5 py-0.5 placeholder:text-gb-dark/50 outline-none ml-4"
                maxLength={30}
                aria-label="Custom feeder name"
              />
            )}
            </div>
          ))}
        </div>

        {/* Add row button */}
        {rows.length < 4 && (
          <button
            onClick={addRow}
            className="self-center text-[7px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light px-3 py-0.5 transition-colors"
          >
            {"+ ADD FEEDER"}
          </button>
        )}

        {/* Integrators */}
        <div className="border-t border-gb-dark pt-2 mt-1">
          <div className="text-[6px] text-gb-dark mb-1">INTEGRATORS (optional)</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {INTEGRATOR_OPTIONS.map((key) => (
              <label key={key} className="flex items-center gap-1 text-[6px] text-gb-light cursor-pointer">
                <input
                  type="checkbox"
                  checked={integrators[key] ?? false}
                  onChange={(e) =>
                    setIntegrators((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  className="rounded border-gb-dark bg-gb-darkest text-gb-light"
                />
                {key}
              </label>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[6px] text-gb-dark shrink-0">Custom:</span>
            <input
              type="text"
              value={customIntegrator}
              onChange={(e) => setCustomIntegrator(e.target.value)}
              placeholder="e.g. Probiotic"
              className="flex-1 min-w-0 bg-gb-dark/20 border border-gb-dark text-gb-light text-[6px] px-1.5 py-0.5 placeholder:text-gb-dark/50"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 text-[7px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 text-[7px] text-gb-darkest bg-gb-light hover:bg-gb-lightest py-1.5 transition-colors tracking-wider font-bold"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  )
}

export { FeedModal }
export type { FeedRow }
