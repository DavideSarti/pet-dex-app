"use client"

import type { WeightEntry } from "./types"

interface WeightChartProps {
  history: WeightEntry[]
  onClose: () => void
}

export function WeightChart({ history, onClose }: WeightChartProps) {
  // Sort by date
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))

  if (sorted.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[320px] pixel-border bg-gb-darkest p-4 flex flex-col gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[7px] text-gb-lightest text-center tracking-wider">
            {"== WEIGHT HISTORY =="}
          </div>
          <div className="text-[6px] text-gb-dark text-center py-4">
            NO DATA YET. LOG A WEIGHT TO SEE THE CHART.
          </div>
          <button
            onClick={onClose}
            className="text-[7px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
          >
            CLOSE
          </button>
        </div>
      </div>
    )
  }

  // Chart dimensions
  const W = 280
  const H = 140
  const PAD_L = 32
  const PAD_R = 8
  const PAD_T = 12
  const PAD_B = 22
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  const weights = sorted.map((e) => e.value)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = maxW - minW || 1 // avoid division by 0

  // Scale points into chart area
  const points = sorted.map((entry, i) => ({
    x: PAD_L + (sorted.length === 1 ? chartW / 2 : (i / (sorted.length - 1)) * chartW),
    y: PAD_T + chartH - ((entry.value - minW) / range) * chartH,
    value: entry.value,
    date: entry.date,
  }))

  // Build SVG polyline path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")

  // Y axis labels (min, mid, max)
  const midW = Math.round((minW + maxW) / 2)
  const yLabels = minW === maxW
    ? [{ value: minW, y: PAD_T + chartH / 2 }]
    : [
        { value: maxW, y: PAD_T },
        { value: midW, y: PAD_T + chartH / 2 },
        { value: minW, y: PAD_T + chartH },
      ]

  // X axis labels (first and last date)
  const formatShort = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] pixel-border bg-gb-darkest p-3 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[7px] text-gb-lightest text-center tracking-wider">
          {"== WEIGHT HISTORY =="}
        </div>

        {/* SVG Chart */}
        <div className="flex justify-center">
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className="border border-gb-dark/50"
            style={{ background: "#0a2a0a" }}
          >
            {/* Grid lines */}
            {yLabels.map((yl) => (
              <line
                key={yl.value}
                x1={PAD_L}
                y1={yl.y}
                x2={W - PAD_R}
                y2={yl.y}
                stroke="#1a4a1a"
                strokeWidth={0.5}
              />
            ))}

            {/* Y axis labels */}
            {yLabels.map((yl) => (
              <text
                key={yl.value}
                x={PAD_L - 3}
                y={yl.y + 2}
                textAnchor="end"
                fill="#8bac0f"
                fontSize={5}
                fontFamily="monospace"
              >
                {yl.value}g
              </text>
            ))}

            {/* X axis labels */}
            {sorted.length > 0 && (
              <>
                <text
                  x={points[0].x}
                  y={H - 4}
                  textAnchor="start"
                  fill="#306230"
                  fontSize={5}
                  fontFamily="monospace"
                >
                  {formatShort(sorted[0].date)}
                </text>
                {sorted.length > 1 && (
                  <text
                    x={points[points.length - 1].x}
                    y={H - 4}
                    textAnchor="end"
                    fill="#306230"
                    fontSize={5}
                    fontFamily="monospace"
                  >
                    {formatShort(sorted[sorted.length - 1].date)}
                  </text>
                )}
              </>
            )}

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#8bac0f"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Data points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={2.5}
                fill="#9bbc0f"
                stroke="#0a2a0a"
                strokeWidth={0.5}
              />
            ))}

            {/* Value labels on points */}
            {points.length <= 12 && points.map((p, i) => (
              <text
                key={`lbl-${i}`}
                x={p.x}
                y={p.y - 5}
                textAnchor="middle"
                fill="#9bbc0f"
                fontSize={4.5}
                fontFamily="monospace"
              >
                {p.value}
              </text>
            ))}
          </svg>
        </div>

        {/* Entry count */}
        <div className="text-[5px] text-gb-dark text-center tracking-wider">
          {sorted.length} MEASUREMENT{sorted.length !== 1 ? "S" : ""}
        </div>

        <button
          onClick={onClose}
          className="text-[7px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
        >
          CLOSE
        </button>
      </div>
    </div>
  )
}
