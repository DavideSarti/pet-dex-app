"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import type { GeckoColors } from "./types"

export const DEFAULT_COLORS: GeckoColors = {
  skin: "#e8c547",
  dots: "#c49b2a",
  belly: "#f5e6b8",
  eyes: "#2d2d2d",
}

function hexToRgb(hex: string | undefined): [number, number, number] {
  if (!hex || typeof hex !== "string" || hex.length < 4) return [0, 0, 0]
  const n = parseInt(hex.slice(1), 16)
  if (isNaN(n)) return [0, 0, 0]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

/**
 * Tint a pixel: instead of flat-replacing the color, preserve the
 * brightness ratio relative to the original reference color.
 * This keeps shading/gradients intact.
 */
function tintPixel(
  r: number, g: number, b: number,
  origRef: [number, number, number],
  newRef: [number, number, number]
): [number, number, number] {
  // Compute brightness ratio per channel (how bright this pixel is relative to the reference)
  const ratio = (channel: number, ref: number) => {
    if (ref === 0) return channel / 128
    return channel / ref
  }
  return [
    Math.min(255, Math.round(newRef[0] * ratio(r, origRef[0]))),
    Math.min(255, Math.round(newRef[1] * ratio(g, origRef[1]))),
    Math.min(255, Math.round(newRef[2] * ratio(b, origRef[2]))),
  ]
}

export function RecoloredGeckoImage({ colors, className }: { colors: GeckoColors; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalDataRef = useRef<ImageData | null>(null)
  const nativeSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const colorsRef = useRef(colors)
  colorsRef.current = colors
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const img = document.createElement("img")
    img.src = "/images/gecko-sprite.png?v=2"
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
  }, [imageLoaded, colors.skin, colors.dots, colors.belly, colors.eyes]) // eslint-disable-line react-hooks/exhaustive-deps

  function recolor(c: GeckoColors) {
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

    const origSkin = hexToRgb(DEFAULT_COLORS.skin)
    const origDots = hexToRgb(DEFAULT_COLORS.dots)
    const origBelly = hexToRgb(DEFAULT_COLORS.belly)
    const origEyes = hexToRgb(DEFAULT_COLORS.eyes)
    const newSkin = hexToRgb(c.skin)
    const newDots = hexToRgb(c.dots)
    const newBelly = hexToRgb(c.belly)
    const newEyes = hexToRgb(c.eyes)

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 50) continue
      const r = data[i], g = data[i + 1], b = data[i + 2]

      const dEyes = colorDistance(r, g, b, origEyes[0], origEyes[1], origEyes[2])
      const dSkin = colorDistance(r, g, b, origSkin[0], origSkin[1], origSkin[2])
      const dDots = colorDistance(r, g, b, origDots[0], origDots[1], origDots[2])
      const dBelly = colorDistance(r, g, b, origBelly[0], origBelly[1], origBelly[2])

      const isDark = (r + g + b) / 3 < 100
      const isGreenish = g > r * 0.8

      // Skip background pixels (dark greenish) — leave them untouched
      if (isDark && isGreenish) continue

      // Eyes: very dark, neutral (not greenish)
      if (isDark && !isGreenish && dEyes < 80) {
        const t = tintPixel(r, g, b, origEyes, newEyes)
        data[i] = t[0]; data[i + 1] = t[1]; data[i + 2] = t[2]
      }
      // Belly: light cream, closest to belly ref
      else if (dBelly < 80 && dBelly < dDots && dBelly < dSkin * 0.9) {
        const t = tintPixel(r, g, b, origBelly, newBelly)
        data[i] = t[0]; data[i + 1] = t[1]; data[i + 2] = t[2]
      }
      // Dots: brown spots — must be clearly closer to dots than skin
      else if (dDots < 60 && dDots < dSkin * 0.7) {
        const t = tintPixel(r, g, b, origDots, newDots)
        data[i] = t[0]; data[i + 1] = t[1]; data[i + 2] = t[2]
      }
      // Skin: yellow/tan body (including shaded legs — wide threshold)
      else if (dSkin < 120) {
        const t = tintPixel(r, g, b, origSkin, newSkin)
        data[i] = t[0]; data[i + 1] = t[1]; data[i + 2] = t[2]
      }
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

interface GeckoSpriteProps {
  colors?: GeckoColors
  onColorsChange?: (colors: GeckoColors) => void
}

export function GeckoSprite({ colors: colorsProp, onColorsChange }: GeckoSpriteProps) {
  const colors = colorsProp ?? { ...DEFAULT_COLORS }
  const hasCustomColors = colorsProp != null && (
    colorsProp.skin !== DEFAULT_COLORS.skin ||
    colorsProp.dots !== DEFAULT_COLORS.dots ||
    colorsProp.belly !== DEFAULT_COLORS.belly ||
    colorsProp.eyes !== DEFAULT_COLORS.eyes
  )
  const [open, setOpen] = useState(false)

  const setColor = (key: keyof GeckoColors, value: string) => {
    const updated = { ...colors, [key]: value }
    onColorsChange?.(updated)
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Pixel frame + palette button */}
      <div className="flex items-center gap-1">
        <div className="pixel-border bg-gb-darkest p-[3px]">
          <div className="relative w-[120px] h-[100px] bg-gb-dark flex items-center justify-center overflow-hidden">
            {hasCustomColors ? (
              <RecoloredGeckoImage colors={colors} />
            ) : (
              <Image
                src="/images/gecko-sprite.png?v=2"
                alt="Pixel art of a leopard gecko named Mango"
                width={120}
                height={100}
                className="object-contain"
                style={{ imageRendering: "pixelated" }}
                priority
                unoptimized
              />
            )}
            <div className="scanlines absolute inset-0" aria-hidden="true" />
          </div>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center w-6 h-6 rounded border border-gb-dark hover:border-gb-light bg-gb-darkest/80 hover:bg-gb-dark/50 text-gb-dark hover:text-gb-light transition-colors"
              aria-label="Change gecko colors"
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
                label="Main skin"
                value={colors.skin}
                onChange={(v) => setColor("skin", v)}
              />
              <ColorRow
                label="Dots"
                value={colors.dots}
                onChange={(v) => setColor("dots", v)}
              />
              <ColorRow
                label="Belly"
                value={colors.belly}
                onChange={(v) => setColor("belly", v)}
              />
              <ColorRow
                label="Eyes"
                value={colors.eyes}
                onChange={(v) => setColor("eyes", v)}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Species label + info button */}
      <div className="flex items-center gap-1.5 text-[6px] text-gb-dark">
        <span aria-hidden="true">{"*"}</span>
        <span>LEOPARD GECKO</span>
        <span aria-hidden="true">{"*"}</span>
        <SpeciesInfo />
      </div>
    </div>
  )
}

function SpeciesInfo() {
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
          EUBLEPHARIS MACULARIUS
        </div>

        {/* World map with highlighted range */}
        <div className="mb-2 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/world-map.svg"
            alt="World map showing leopard gecko native range"
            width={240}
            height={160}
            className="border border-gb-dark/50"
          />
        </div>

        {/* Description */}
        <div className="text-[5px] text-gb-light leading-relaxed space-y-1.5 mb-2">
          <p>
            The leopard gecko (Eublepharis macularius) is a ground-dwelling
            lizard native to the rocky dry grasslands and deserts of
            Afghanistan, Pakistan, northwestern India, Iran, and Nepal.
          </p>
          <p>
            They are crepuscular (active at dawn and dusk), insectivorous,
            and one of the few gecko species with moveable eyelids. Adults
            reach 20-28 cm and live 15-20+ years in captivity.
          </p>
          <p>
            Known for their docile temperament and wide variety of color
            morphs, they are among the most popular pet reptiles worldwide.
            Unlike most geckos, they lack adhesive toe pads and cannot climb
            smooth surfaces.
          </p>
        </div>

        {/* Wikipedia link */}
        <div className="border-t border-gb-dark pt-1.5 text-center">
          <a
            href="https://en.wikipedia.org/wiki/Leopard_gecko"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[5px] text-gb-light hover:text-gb-lightest underline tracking-wider"
          >
            {">> WIKIPEDIA: LEOPARD GECKO <<"}
          </a>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const SWATCH_COLORS = [
  "#e8c547", "#f5d033", "#f0a030", "#d4782a", "#c45a2a",
  "#a03020", "#d44040", "#e87080", "#f0a0b0", "#f5d0d0",
  "#f5e6b8", "#ffe8c0", "#f0f0e0", "#ffffff", "#d0d0d0",
  "#a0a0a0", "#707070", "#404040", "#2d2d2d", "#111111",
  "#c49b2a", "#8b6914", "#6b4a14", "#4a3010", "#2a1a08",
  "#80c040", "#40a040", "#208030", "#006020", "#004010",
  "#60c0e0", "#40a0d0", "#2070c0", "#1040a0", "#102060",
  "#a060d0", "#8040b0", "#602090", "#401070", "#200840",
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
