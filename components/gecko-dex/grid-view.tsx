"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { AnimalProfile } from "./types"
import { AnimalCard } from "./animal-card"
import { SpeciesPicker } from "./species-picker"

interface GridViewProps {
  animals: AnimalProfile[]
  onSelect: (id: string) => void
  onAdd: (species: string) => void
  onDelete: (id: string) => void
  onReorder: (animals: AnimalProfile[]) => void
  onChangePin?: () => void
}

export function GridView({ animals, onSelect, onAdd, onDelete, onReorder, onChangePin }: GridViewProps) {
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragOrigin = useRef<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const lastSwapIdx = useRef<number | null>(null)

  const LONG_PRESS_MS = 400

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (e.button !== 0) return
      const origin = { x: e.clientX, y: e.clientY }
      dragOrigin.current = origin
      isDragging.current = false

      longPressTimer.current = setTimeout(() => {
        isDragging.current = true
        setDragId(id)
        setDragOffset({ x: 0, y: 0 })
        lastSwapIdx.current = null
        if (navigator.vibrate) navigator.vibrate(30)
      }, LONG_PRESS_MS)
    },
    []
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragOrigin.current) return

      if (!isDragging.current) {
        const dx = e.clientX - dragOrigin.current.x
        const dy = e.clientY - dragOrigin.current.y
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          clearLongPress()
        }
        return
      }

      setDragOffset({
        x: e.clientX - dragOrigin.current.x,
        y: e.clientY - dragOrigin.current.y,
      })

      // Hit-test and live-swap
      const elUnder = document.elementFromPoint(e.clientX, e.clientY)
      if (elUnder) {
        const cardEl = (elUnder as HTMLElement).closest("[data-card-idx]") as HTMLElement | null
        if (cardEl) {
          const targetIdx = parseInt(cardEl.dataset.cardIdx ?? "", 10)
          if (!isNaN(targetIdx) && targetIdx !== lastSwapIdx.current) {
            // Live swap: move the dragged item to the target position immediately
            const fromIdx = animals.findIndex((a) => a.id === dragId)
            if (fromIdx !== -1 && fromIdx !== targetIdx) {
              const reordered = [...animals]
              const [moved] = reordered.splice(fromIdx, 1)
              reordered.splice(targetIdx, 0, moved)
              onReorder(reordered)
            }
            lastSwapIdx.current = targetIdx
          }
        }
      }
    },
    [clearLongPress, dragId, animals, onReorder]
  )

  const handlePointerUp = useCallback(() => {
    clearLongPress()
    isDragging.current = false
    dragOrigin.current = null
    lastSwapIdx.current = null
    setDragId(null)
    setDragOffset({ x: 0, y: 0 })
  }, [clearLongPress])

  useEffect(() => {
    return () => clearLongPress()
  }, [clearLongPress])

  const handleAddClick = useCallback(() => {
    setShowSpeciesPicker(true)
  }, [])

  const handleSpeciesSelect = useCallback(
    (species: string) => {
      setShowSpeciesPicker(false)
      onAdd(species)
    },
    [onAdd]
  )

  return (
    <div className="h-dvh bg-gb-darkest flex items-center justify-center p-2 sm:p-4">
      <div
        className="w-full max-w-[480px] h-full max-h-dvh flex flex-col"
        style={{
          background:
            "linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 50%, #2a2a2a 100%)",
          borderRadius: "16px",
          padding: "12px",
          boxShadow:
            "6px 6px 0px 0px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Top shell detail */}
        <div className="flex items-center gap-2 px-2 mb-2">
          <div
            className="w-3 h-3 rounded-full bg-gb-light"
            style={{
              boxShadow:
                "0 0 8px rgba(139,172,15,0.6), inset 0 -1px 2px rgba(0,0,0,0.3)",
            }}
            aria-hidden="true"
          />
          <span className="text-[5px] text-neutral-500 tracking-[0.2em]">
            PET-DEX v1.0
          </span>
        </div>

        {/* Screen bezel */}
        <div
          className="relative flex-1 min-h-0 flex flex-col"
          style={{
            background: "#1a1a1a",
            borderRadius: "4px",
            padding: "8px",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {/* Inner screen - fills available space, scrollable */}
          <div
            className="relative flex-1 min-h-0"
            style={{
              background: "#0f380f",
              border: "3px solid #0a2a0a",
              boxShadow:
                "inset 0 0 20px rgba(15,56,15,0.8), 0 0 4px rgba(139,172,15,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Scanline overlay */}
            <div
              className="scanlines absolute inset-0 z-10 pointer-events-none"
              aria-hidden="true"
            />

            {/* Screen content - scrollable */}
            <div className="relative p-3 flex flex-col gap-2.5 animate-flicker h-full overflow-y-auto screen-zoom">
              {/* Title bar */}
              <header className="text-center">
                <div className="text-[6px] text-gb-dark">
                  {"+--------------------------+"}
                </div>
                <h1 className="text-[9px] text-gb-lightest tracking-[0.15em] py-0.5">
                  PET-DEX
                </h1>
                <div className="text-[6px] text-gb-dark">
                  {"+--------------------------+"}
                </div>
              </header>

              {/* Info line */}
              <div className="text-[6px] text-gb-light text-center tracking-wider">
                {animals.length === 0
                  ? "NO ANIMALS YET - TAP + TO ADD"
                  : `${animals.length} ANIMAL${animals.length > 1 ? "S" : ""} REGISTERED`}
              </div>

              {/* Grid of cards */}
              <div
                className="grid grid-cols-3 gap-2"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {animals.map((animal, idx) => {
                  const isBeingDragged = dragId === animal.id

                  return (
                    <div
                      key={animal.id}
                      data-card-idx={idx}
                      onPointerDown={(e) => handlePointerDown(e, animal.id)}
                      className="relative select-none touch-none"
                      style={{
                        zIndex: isBeingDragged ? 50 : 1,
                        pointerEvents: isBeingDragged ? "none" : "auto",
                        transform: isBeingDragged
                          ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.1)`
                          : "none",
                        transition: isBeingDragged
                          ? "transform 0s, box-shadow 0.2s"
                          : "transform 0.2s ease, box-shadow 0.2s",
                        boxShadow: isBeingDragged
                          ? "0 8px 24px rgba(0,0,0,0.5), 0 0 0 2px rgba(139,172,15,0.4)"
                          : "none",
                        borderRadius: "2px",
                      }}
                    >
                      <AnimalCard
                        animal={animal}
                        onSelect={dragId ? () => {} : onSelect}
                        onDelete={onDelete}
                      />
                    </div>
                  )
                })}

                {/* Add button card */}
                <button
                  type="button"
                  onClick={handleAddClick}
                  className="aspect-square flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gb-dark hover:border-gb-light bg-gb-dark/10 hover:bg-gb-dark/20 transition-colors group"
                >
                  <span className="text-[16px] text-gb-dark group-hover:text-gb-light transition-colors leading-none">
                    +
                  </span>
                  <span className="text-[5px] text-gb-dark group-hover:text-gb-light transition-colors tracking-wider">
                    ADD NEW
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom shell detail */}
        <div className="flex items-center justify-between px-3 mt-3 mb-1">
          <span className="text-[5px] text-neutral-600 tracking-[0.15em]">
            PET-DEX
          </span>
          <div className="flex items-center gap-2">
            {onChangePin && (
              <button
                onClick={onChangePin}
                className="text-[5px] text-neutral-600 hover:text-neutral-400 tracking-[0.1em] transition-colors"
              >
                CHANGE PIN
              </button>
            )}
            <div className="flex gap-[3px]" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] h-3 rounded-full"
                  style={{ background: "#2a2a2a" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Species picker modal (rendered outside the shell so it floats above) */}
      {showSpeciesPicker && (
        <SpeciesPicker
          onSelect={handleSpeciesSelect}
          onCancel={() => setShowSpeciesPicker(false)}
        />
      )}
    </div>
  )
}
