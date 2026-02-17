"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import type { BeetleStage } from "./types"

interface BeetleSpriteProps {
  stage?: BeetleStage
  subspecies?: string
  onSubspeciesChange?: (value: string) => void
  customPhoto?: string
  onPhotoChange?: (dataUrl: string | undefined) => void
}

export function BeetleSprite({ stage, subspecies, onSubspeciesChange, customPhoto, onPhotoChange }: BeetleSpriteProps) {
  const [editingSub, setEditingSub] = useState(false)
  const [subDraft, setSubDraft] = useState(subspecies ?? "")
  const subInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX = 300
        let w = img.width
        let h = img.height
        if (w > MAX || h > MAX) {
          const sc = MAX / Math.max(w, h)
          w = Math.round(w * sc)
          h = Math.round(h * sc)
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          onPhotoChange?.(canvas.toDataURL("image/jpeg", 0.8))
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

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
      {/* Pixel frame with overlaid buttons */}
      <div className="relative">
        <div className="pixel-border bg-gb-darkest p-[3px]">
          <div className="relative w-[120px] h-[100px] bg-gb-dark flex items-center justify-center overflow-hidden">
            {customPhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={customPhoto} alt="Custom beetle photo" className="w-full h-full object-cover" />
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* Buttons overlaid on the right edge */}
        <div className="absolute -right-7 top-0 flex flex-col gap-1">
          {/* Photo upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-6 h-6 rounded border border-gb-dark hover:border-gb-light bg-gb-darkest/80 hover:bg-gb-dark/50 text-gb-dark hover:text-gb-light transition-colors"
            aria-label="Upload photo"
          >
            <span className="text-[10px]" aria-hidden="true">📷</span>
          </button>

          {/* Remove photo button */}
          {customPhoto && (
            <button
              type="button"
              onClick={() => onPhotoChange?.(undefined)}
              className="flex items-center justify-center w-6 h-6 rounded border border-gb-dark hover:border-gb-light bg-gb-darkest/80 hover:bg-gb-dark/50 text-gb-dark hover:text-gb-light transition-colors"
              aria-label="Remove photo"
            >
              <span className="text-[8px]" aria-hidden="true">↩</span>
            </button>
          )}
        </div>
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
