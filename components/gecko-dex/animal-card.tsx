"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import type { AnimalProfile } from "./types"
import { RecoloredGeckoImage, DEFAULT_COLORS } from "./gecko-sprite"
import { RecoloredBeetleImage, DEFAULT_BEETLE_COLORS } from "./beetle-sprite"

interface AnimalCardProps {
  animal: AnimalProfile
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function AnimalCard({ animal, onSelect, onDelete }: AnimalCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const isBeetle = animal.species === "RHINO BEETLE"

  const hasCustomGeckoColors = !isBeetle && animal.colors && (
    animal.colors.skin !== DEFAULT_COLORS.skin ||
    animal.colors.dots !== DEFAULT_COLORS.dots ||
    animal.colors.belly !== DEFAULT_COLORS.belly ||
    animal.colors.eyes !== DEFAULT_COLORS.eyes
  )

  const hasCustomBeetleColors = isBeetle && animal.beetleColors &&
    animal.beetleColors.body !== DEFAULT_BEETLE_COLORS.body

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(animal.id)}
        className="relative pixel-border bg-gb-darkest p-2 flex flex-col items-center gap-1.5 transition-colors hover:bg-gb-dark/20 group text-left w-full"
      >
        {/* Delete button */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            setShowConfirm(true)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation()
              setShowConfirm(true)
            }
          }}
          className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[7px] text-gb-dark hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 z-10"
          aria-label={`Delete ${animal.name}`}
        >
          X
        </span>

        {/* Dex number */}
        <div className="text-[5px] text-gb-dark tracking-wider w-full text-left">
          #{String(animal.dexNumber).padStart(3, "0")}
        </div>

        {/* Sprite image */}
        <div className="relative w-full aspect-square bg-gb-dark/30 flex items-center justify-center overflow-hidden">
          {hasCustomGeckoColors && animal.colors ? (
            <RecoloredGeckoImage
              colors={animal.colors}
              className="w-full h-full object-contain"
            />
          ) : hasCustomBeetleColors && animal.beetleColors ? (
            <RecoloredBeetleImage
              colors={animal.beetleColors}
              className="w-full h-full object-contain"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={animal.image}
              alt={animal.name}
              className="w-full h-full object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          )}
          {/* Stage label for beetles */}
          {isBeetle && animal.stage && (
            <span className="absolute bottom-[1px] right-[2px] text-[4px] font-bold tracking-wider text-gb-lightest bg-gb-darkest/70 px-[2px] py-[1px] leading-none">
              {animal.stage}
            </span>
          )}
        </div>

        {/* Name */}
        <div className="text-[7px] text-gb-lightest tracking-wider text-center truncate w-full">
          {animal.name}
        </div>

        {/* Species */}
        <div className="text-[5px] text-gb-dark tracking-wider text-center truncate w-full">
          {animal.species}
        </div>
      </button>

      {/* Delete confirmation — portaled to body to escape stacking contexts */}
      {showConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-[260px] pixel-border bg-gb-darkest p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[7px] text-gb-lightest text-center tracking-wider">
              {"== DELETE? =="}
            </div>
            <div className="text-[6px] text-gb-light text-center leading-relaxed">
              Remove <span className="text-gb-lightest">{animal.name}</span> from your collection?
              <br />
              <span className="text-gb-dark">This cannot be undone.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 text-[7px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-1.5 transition-colors tracking-wider"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  onDelete(animal.id)
                }}
                className="flex-1 text-[7px] text-red-300 bg-red-950/50 hover:bg-red-900/60 border border-red-800 py-1.5 transition-colors tracking-wider font-bold"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
