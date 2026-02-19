"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface GeckoSpriteProps {
  customPhoto?: string
  onPhotoChange?: (dataUrl: string | undefined) => void
}

export function GeckoSprite({ customPhoto, onPhotoChange }: GeckoSpriteProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX = 200
        let w = img.width
        let h = img.height
        if (w > MAX || h > MAX) {
          const scale = MAX / Math.max(w, h)
          w = Math.round(w * scale)
          h = Math.round(h * scale)
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          let quality = 0.7
          let dataUrl = canvas.toDataURL("image/jpeg", quality)
          while (dataUrl.length > 150_000 && quality > 0.3) {
            quality -= 0.1
            dataUrl = canvas.toDataURL("image/jpeg", quality)
          }
          onPhotoChange?.(dataUrl)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col items-center gap-1.5 -mb-1">
      {/* Pixel frame with overlaid buttons */}
      <div className="relative">
        <div className="pixel-border bg-gb-darkest p-[3px]">
          <div className="relative w-[176px] h-[149px] bg-gb-dark flex items-center justify-center overflow-hidden">
            {customPhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={customPhoto} alt="Custom animal photo" className="w-full h-full object-cover" />
            ) : (
              <Image
                src="/images/gecko-normal.png"
                alt="Pixel art of a leopard gecko"
                width={176}
                height={149}
                className="object-contain"
                style={{ imageRendering: "pixelated" }}
                priority
                unoptimized
              />
            )}
            <div className="scanlines absolute inset-0 pointer-events-none" aria-hidden="true" />
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
        <div className="absolute -right-8 top-0 flex flex-col gap-1">
          {/* Photo upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-6 h-6 rounded border border-gb-dark hover:border-gb-light bg-gb-darkest/80 hover:bg-gb-dark/50 text-gb-dark hover:text-gb-light transition-colors"
            aria-label="Upload photo"
          >
            <span className="text-[11px]" aria-hidden="true">📷</span>
          </button>

          {/* Remove photo button (only when custom photo is set) */}
          {customPhoto && (
            <button
              type="button"
              onClick={() => onPhotoChange?.(undefined)}
              className="flex items-center justify-center w-6 h-6 rounded border border-gb-dark hover:border-gb-light bg-gb-darkest/80 hover:bg-gb-dark/50 text-gb-dark hover:text-gb-light transition-colors"
              aria-label="Remove photo"
            >
              <span className="text-[14px]" aria-hidden="true">↩</span>
            </button>
          )}
        </div>
      </div>

      {/* Species label + info button */}
      <div className="flex items-center gap-1.5 text-[7px] text-gb-dark">
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
          className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gb-dark hover:border-gb-light text-gb-dark hover:text-gb-light text-[6px] font-bold leading-none transition-colors"
          aria-label="Species information"
        >
          i
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        className="w-[200px] bg-gb-darkest border-gb-dark p-2.5 rounded"
      >
        <div className="text-[8px] text-gb-light mb-2 border-b border-gb-dark pb-1 tracking-wider text-center">
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

        <div className="text-[6px] text-gb-light leading-relaxed space-y-1.5 mb-2">
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

        <div className="border-t border-gb-dark pt-1.5 text-center">
          <a
            href="https://en.wikipedia.org/wiki/Leopard_gecko"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[6px] text-gb-light hover:text-gb-lightest underline tracking-wider"
          >
            {">> WIKIPEDIA: LEOPARD GECKO <<"}
          </a>
        </div>
      </PopoverContent>
    </Popover>
  )
}
