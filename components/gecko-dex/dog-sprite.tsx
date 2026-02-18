"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DogSpriteProps {
  customPhoto?: string
  onPhotoChange?: (dataUrl: string | undefined) => void
}

export function DogSprite({ customPhoto, onPhotoChange }: DogSpriteProps) {
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

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Pixel frame with overlaid buttons */}
      <div className="relative">
        <div className="pixel-border bg-gb-darkest p-[3px]">
          <div className="relative w-[100px] h-[83px] bg-gb-dark flex items-center justify-center overflow-hidden">
            {customPhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={customPhoto} alt="Custom dog photo" className="w-full h-full object-cover" />
            ) : (
              <Image
                src="/images/dog-sprite.png"
                alt="Pixel art of an Alaskan Malamute"
                width={100}
                height={83}
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
      <div className="flex items-center gap-1.5 text-[6px] text-gb-dark">
        <span aria-hidden="true">{"*"}</span>
        <span>DOG</span>
        <span aria-hidden="true">{"*"}</span>
        <DogSpeciesInfo />
      </div>
    </div>
  )
}

function DogSpeciesInfo() {
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
          CANIS LUPUS FAMILIARIS
        </div>

        <div className="text-[5px] text-gb-light leading-relaxed space-y-1.5 mb-2">
          <p>
            The domestic dog (Canis lupus familiaris) is the most widely
            abundant terrestrial carnivore. Descended from wolves, dogs were
            the first species to be domesticated by humans over 15,000 years ago.
          </p>
          <p>
            Dogs have been selectively bred over millennia for various
            behaviors, capabilities, and physical attributes. Today there are
            over 340 recognized breeds varying greatly in size, shape, and
            temperament.
          </p>
          <p>
            They are highly social animals known for their loyalty, trainability,
            and ability to form deep bonds with humans. Dogs communicate through
            vocalizations, body language, and facial expressions.
          </p>
          <p>
            Average lifespan varies by breed: small breeds often live 12-16
            years, medium breeds 10-14 years, and large/giant breeds 8-12
            years. Regular vet checkups, vaccinations, and proper nutrition
            are key to a healthy life.
          </p>
        </div>

        <div className="border-t border-gb-dark pt-1.5 text-center">
          <a
            href="https://en.wikipedia.org/wiki/Dog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[5px] text-gb-light hover:text-gb-lightest underline tracking-wider"
          >
            {">> WIKIPEDIA: DOMESTIC DOG <<"}
          </a>
        </div>
      </PopoverContent>
    </Popover>
  )
}
