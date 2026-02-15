"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import type { BeetleColors, BeetleStage } from "./types"

export const DEFAULT_BEETLE_COLORS: BeetleColors = {
  body: "#5c3a1e",
}

/* ---- HSL helpers ---- */
function hexToRgb(hex: string | undefined): [number, number, number] {
  if (!hex || typeof hex !== "string" || hex.length < 4) return [0, 0, 0]
  const n = parseInt(hex.slice(1), 16)
  if (isNaN(n)) return [0, 0, 0]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

/* ---- Component ---- */

export function RecoloredBeetleImage({ colors, className }: { colors: BeetleColors; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalDataRef = useRef<ImageData | null>(null)
  const nativeSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const colorsRef = useRef(colors)
  colorsRef.current = colors
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const img = document.createElement("img")
    img.src = "/images/beetle-sprite.png"
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      nativeSizeRef.current = { w, h }
      const offscreen = document.createElement("canvas")
      offscreen.width = w
      offscreen.height = h
      const offCtx = offscreen.getContext("2d")!
      offCtx.drawImage(img, 0, 0)
      originalDataRef.current = offCtx.getImageData(0, 0, w, h)
      setImageLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!imageLoaded) return
    recolor(colorsRef.current)
  }, [imageLoaded, colors.body]) // eslint-disable-line react-hooks/exhaustive-deps

  function recolor(c: BeetleColors) {
    const canvas = canvasRef.current
    const origData = originalDataRef.current
    if (!canvas || !origData) return
    const { w, h } = nativeSizeRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = w
    canvas.height = h

    const imageData = new ImageData(new Uint8ClampedArray(origData.data), w, h)
    const data = imageData.data

    // Detect background color by sampling corner pixels.
    // Corners are almost certainly background, not beetle.
    const corners = [
      0,                           // top-left
      (w - 1) * 4,                 // top-right
      (h - 1) * w * 4,             // bottom-left
      ((h - 1) * w + (w - 1)) * 4, // bottom-right
    ]
    let bgR = 0, bgG = 0, bgB = 0, bgCount = 0
    for (const ci of corners) {
      if (data[ci + 3] > 50) { // only count visible corner pixels
        bgR += data[ci]; bgG += data[ci + 1]; bgB += data[ci + 2]
        bgCount++
      }
    }
    // Average background color (or fallback to a neutral gray)
    if (bgCount > 0) {
      bgR = Math.round(bgR / bgCount)
      bgG = Math.round(bgG / bgCount)
      bgB = Math.round(bgB / bgCount)
    } else {
      bgR = 200; bgG = 200; bgB = 200
    }

    // Distance threshold: pixels close to the background color are skipped
    const BG_THRESHOLD = 45

    const bodyRgb = hexToRgb(c.body)
    const [targetH, targetS] = rgbToHsl(bodyRgb[0], bodyRgb[1], bodyRgb[2])

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 50) continue // skip fully transparent

      const r = data[i], g = data[i + 1], b = data[i + 2]

      // Skip pixels that match the background color
      const dbg = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2)
      if (dbg < BG_THRESHOLD) continue

      const [, , origL] = rgbToHsl(r, g, b)

      // Apply target hue/sat but keep original lightness
      const [newR, newG, newB] = hslToRgb(targetH, targetS, origL)
      data[i] = newR
      data[i + 1] = newG
      data[i + 2] = newB
    }

    ctx.putImageData(imageData, 0, 0)
  }

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "max-w-[120px] max-h-[100px] w-auto h-auto object-contain"}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  )
}

/* ---- Main sprite component ---- */

interface BeetleSpriteProps {
  colors?: BeetleColors
  onColorsChange?: (colors: BeetleColors) => void
  stage?: BeetleStage
  subspecies?: string
  onSubspeciesChange?: (value: string) => void
}

export function BeetleSprite({ colors: colorsProp, onColorsChange, stage, subspecies, onSubspeciesChange }: BeetleSpriteProps) {
  const colors = colorsProp ?? { ...DEFAULT_BEETLE_COLORS }
  const hasCustomColors = colorsProp != null &&
    colorsProp.body !== DEFAULT_BEETLE_COLORS.body
  const [open, setOpen] = useState(false)
  const [editingSub, setEditingSub] = useState(false)
  const [subDraft, setSubDraft] = useState(subspecies ?? "")
  const subInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingSub && subInputRef.current) {
      subInputRef.current.focus()
      subInputRef.current.select()
    }
  }, [editingSub])

  const saveSub = () => {
    const trimmed = subDraft.trim().toUpperCase()
    onSubspeciesChange?.(trimmed)
    setEditingSub(false)
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Pixel frame + palette button */}
      <div className="flex items-center gap-1">
        <div className="pixel-border bg-gb-darkest p-[3px]">
          <div className="relative w-[120px] h-[100px] bg-gb-dark flex items-center justify-center overflow-hidden">
            {hasCustomColors ? (
              <RecoloredBeetleImage colors={colors} />
            ) : (
              <Image
                src="/images/beetle-sprite.png"
                alt="Pixel art of a rhino beetle"
                width={120}
                height={100}
                className="object-contain"
                style={{ imageRendering: "pixelated" }}
                priority
                unoptimized
              />
            )}
            <div className="scanlines absolute inset-0 pointer-events-none" aria-hidden="true" />
            {/* Stage label in bottom-right corner */}
            {stage && (
              <span className="absolute bottom-[2px] right-[3px] text-[5px] font-bold tracking-wider text-gb-lightest bg-gb-darkest/70 px-[3px] py-[1px] leading-none">
                {stage}
              </span>
            )}
          </div>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center w-6 h-6 rounded border border-gb-dark hover:border-gb-light bg-gb-darkest/80 hover:bg-gb-dark/50 text-gb-dark hover:text-gb-light transition-colors"
              aria-label="Change beetle colors"
            >
              <span className="text-[10px]" aria-hidden="true">🎨</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="right"
            className="w-auto min-w-[180px] bg-gb-darkest border-gb-dark p-2 rounded"
          >
            <div className="text-[7px] text-gb-light mb-2 border-b border-gb-dark pb-1">
              COLORS
            </div>
            <div className="flex flex-col gap-2">
              <ColorRow
                label="Body"
                value={colors.body}
                onChange={(v) => onColorsChange?.({ body: v })}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Species label + info button */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1.5 text-[6px] text-gb-dark">
          <span aria-hidden="true">{"*"}</span>
          <span>RHINO BEETLE</span>
          <span aria-hidden="true">{"*"}</span>
          <BeetleSpeciesInfo />
        </div>
        {/* Editable subspecies line */}
        {editingSub ? (
          <input
            ref={subInputRef}
            value={subDraft}
            onChange={(e) => setSubDraft(e.target.value)}
            onBlur={saveSub}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveSub()
              if (e.key === "Escape") { setSubDraft(subspecies ?? ""); setEditingSub(false) }
            }}
            placeholder="e.g. ALLOMYRINA DICHOTOMA"
            className="bg-gb-dark/40 text-gb-light border border-gb-light px-1 py-0 text-[5px] font-mono outline-none text-center w-[160px]"
            maxLength={40}
            aria-label="Edit subspecies"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setSubDraft(subspecies ?? ""); setEditingSub(true) }}
            className="text-[5px] text-gb-dark hover:text-gb-light transition-colors tracking-wider italic"
            title="Click to set species name"
          >
            {subspecies || "TAP TO SET SPECIES"}
          </button>
        )}
      </div>
    </div>
  )
}

function BeetleSpeciesInfo() {
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <Popover open={infoOpen} onOpenChange={setInfoOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gb-dark hover:border-gb-light text-gb-dark hover:text-gb-light text-[5px] font-bold leading-none transition-colors"
          aria-label="Species information"
        >
          i
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        className="w-[260px] bg-gb-darkest border-gb-dark p-2.5 rounded"
      >
        <div className="text-[7px] text-gb-light mb-2 border-b border-gb-dark pb-1 tracking-wider text-center">
          DYNASTINAE (RHINOCEROS BEETLES)
        </div>

        {/* Description */}
        <div className="text-[5px] text-gb-light leading-relaxed space-y-1.5 mb-2">
          <p>
            Rhinoceros beetles are a subfamily (Dynastinae) of the scarab beetle
            family (Scarabaeidae). They are among the largest beetles in the world,
            with some species reaching over 15 cm in length.
          </p>
          <p>
            Males are famous for their prominent horns, used in combat with other
            males over feeding sites and mates. Despite their fearsome appearance,
            they are completely harmless to humans and cannot bite or sting.
          </p>
          <p>
            Found in tropical forests across Asia, Central and South America, and
            Africa. They go through complete metamorphosis: egg, larva (grub),
            pupa, and adult. Larvae feed on decaying wood and organic matter,
            while adults feed on fruit, nectar, and sap.
          </p>
          <p>
            Popular in some Asian countries as pets, particularly in Japan where
            beetle keeping (kabuto-mushi) is a traditional hobby. Adults typically
            live 2-3 months, while the full lifecycle can span 1-2 years.
          </p>
        </div>

        {/* Wikipedia link */}
        <div className="border-t border-gb-dark pt-1.5 text-center">
          <a
            href="https://en.wikipedia.org/wiki/Dynastinae"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[5px] text-gb-light hover:text-gb-lightest underline tracking-wider"
          >
            {">> WIKIPEDIA: RHINOCEROS BEETLE <<"}
          </a>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const SWATCH_COLORS = [
  "#5c3a1e", "#8b6914", "#6b4a14", "#4a3010", "#2a1a08",
  "#d4782a", "#c45a2a", "#a03020", "#c49b2a", "#e8c547",
  "#f0a030", "#f5d033", "#d44040", "#e87080", "#f0a0b0",
  "#111111", "#2d2d2d", "#404040", "#707070", "#a0a0a0",
  "#d0d0d0", "#ffffff", "#006020", "#208030", "#40a040",
  "#1040a0", "#2070c0", "#40a0d0", "#602090", "#8040b0",
]

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | undefined
  onChange: (v: string) => void
}) {
  const safeValue = (value ?? "#000000").toLowerCase()
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[6px] text-gb-light">{label}</span>
      <div className="grid grid-cols-10 gap-[2px]">
        {SWATCH_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="w-[14px] h-[14px] rounded-sm border transition-all"
            style={{
              background: c,
              borderColor: safeValue === c ? "#9bbc0f" : "transparent",
              boxShadow: safeValue === c ? "0 0 0 1px #9bbc0f" : "none",
            }}
            aria-label={`${label}: ${c}`}
          />
        ))}
      </div>
    </div>
  )
}
