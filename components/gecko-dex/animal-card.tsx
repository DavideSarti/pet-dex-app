"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import type { AnimalProfile } from "./types"

interface AnimalCardProps {
  animal: AnimalProfile
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function AnimalCard({ animal, onSelect, onDelete }: AnimalCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const isBeetle = animal.species === "RHINO BEETLE"
  const hasCustomPhoto = animal.customPhoto && animal.customPhoto.length > 0

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(animal.id)}
        className="relative pixel-border bg-gb-darkest p-2.5 flex flex-col items-center gap-2 transition-colors hover:bg-gb-dark/20 text-left w-full"
      >
        {/* Delete button - always visible */}
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
          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center text-[9px] text-gb-dark hover:text-red-400 transition-colors z-10"
          aria-label={`Delete ${animal.name}`}
        >
          X
        </span>

        {/* Dex number */}
        <div className="text-[7px] text-gb-dark tracking-wider w-full text-left">
          #{String(animal.dexNumber).padStart(3, "0")}
        </div>

        {/* Sprite image */}
        <div className="relative w-full aspect-square bg-gb-darkest flex items-center justify-center overflow-hidden">
          {hasCustomPhoto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={animal.customPhoto}
              alt={animal.name}
              className="w-full h-full object-cover"
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
            <span className="absolute bottom-[2px] right-[3px] text-[6px] font-bold tracking-wider text-gb-lightest bg-gb-darkest/70 px-[3px] py-[1px] leading-none">
              {animal.stage}
            </span>
          )}
        </div>

        {/* Name */}
        <div className="text-[9px] text-gb-lightest tracking-wider text-center truncate w-full">
          {animal.name}
        </div>

        {/* Species */}
        <div className="text-[7px] text-gb-dark tracking-wider text-center truncate w-full">
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
            className="w-full max-w-[300px] pixel-border bg-gb-darkest p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] text-gb-lightest text-center tracking-wider">
              {"== DELETE? =="}
            </div>
            <div className="text-[8px] text-gb-light text-center leading-relaxed">
              Remove <span className="text-gb-lightest">{animal.name}</span> from your collection?
              <br />
              <span className="text-gb-dark">This cannot be undone.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 text-[9px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light py-2 transition-colors tracking-wider"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  onDelete(animal.id)
                }}
                className="flex-1 text-[9px] text-red-300 bg-red-950/50 hover:bg-red-900/60 border border-red-800 py-2 transition-colors tracking-wider font-bold"
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
