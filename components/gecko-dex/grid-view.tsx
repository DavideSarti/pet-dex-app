"use client"

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react"
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
  onOpenChat?: () => void
  onExport?: () => void
  onImport?: () => void
}

export function GridView({ animals, onSelect, onAdd, onDelete, onReorder, onChangePin, onOpenChat, onExport, onImport }: GridViewProps) {
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressOrigin = useRef<{ x: number; y: number } | null>(null)
  const grabDelta = useRef<{ x: number; y: number } | null>(null)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const lastSwapIdx = useRef<number | null>(null)
  const suppressClickUntil = useRef(0)
  const dragIdRef = useRef<string | null>(null)
  const lastSwapTime = useRef(0)
  const animalsRef = useRef(animals)
  animalsRef.current = animals
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const prevRects = useRef<Map<string, DOMRect>>(new Map())
  const [flipTick, setFlipTick] = useState(0)

  // After a reorder, animate non-dragged cards and fix dragged card position
  useLayoutEffect(() => {
    if (flipTick === 0) return
    const prev = prevRects.current
    if (prev.size === 0) return
    prevRects.current = new Map()

    const currentDragId = dragIdRef.current

    cardRefs.current.forEach((el, id) => {
      if (!el || id === currentDragId) return
      const oldRect = prev.get(id)
      if (!oldRect) return
      const newRect = el.getBoundingClientRect()
      const dx = oldRect.left - newRect.left
      const dy = oldRect.top - newRect.top
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return

      el.style.transition = "none"
      el.style.transform = `translate(${dx}px, ${dy}px)`

      requestAnimationFrame(() => {
        el.style.transition = "transform 250ms ease-out"
        el.style.transform = ""
      })
    })

    // Recompute dragged card offset so it stays exactly under the finger
    if (currentDragId && lastPointerRef.current && grabDelta.current) {
      const dragEl = cardRefs.current.get(currentDragId)
      if (dragEl) {
        const rect = dragEl.getBoundingClientRect()
        const baseLeft = rect.left - dragOffsetRef.current.x
        const baseTop = rect.top - dragOffsetRef.current.y
        const newOff = {
          x: lastPointerRef.current.x - grabDelta.current.x - baseLeft,
          y: lastPointerRef.current.y - grabDelta.current.y - baseTop,
        }
        dragOffsetRef.current = newOff
        setDragOffset(newOff)
      }
    }
  }, [flipTick])

  const LONG_PRESS_MS = 500

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const endDrag = useCallback(() => {
    isDragging.current = false
    pressOrigin.current = null
    grabDelta.current = null
    lastPointerRef.current = null
    dragOffsetRef.current = { x: 0, y: 0 }
    lastSwapIdx.current = null
    dragIdRef.current = null
    setDragId(null)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  const onWindowPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging.current || !grabDelta.current) return

      lastPointerRef.current = { x: e.clientX, y: e.clientY }

      const currentDragId = dragIdRef.current
      if (!currentDragId) return

      const dragEl = cardRefs.current.get(currentDragId)
      if (!dragEl) return

      // Card's layout position = getBoundingClientRect minus current transform
      const rect = dragEl.getBoundingClientRect()
      const baseLeft = rect.left - dragOffsetRef.current.x
      const baseTop = rect.top - dragOffsetRef.current.y

      // Offset needed so the card follows the pointer with the original grab point
      const newOff = {
        x: e.clientX - grabDelta.current.x - baseLeft,
        y: e.clientY - grabDelta.current.y - baseTop,
      }
      dragOffsetRef.current = newOff
      setDragOffset(newOff)

      // Dragged card's visual bounds (always pointer-anchored, independent of DOM)
      const dragVisual = {
        left: e.clientX - grabDelta.current.x,
        right: e.clientX - grabDelta.current.x + rect.width,
        top: e.clientY - grabDelta.current.y,
        bottom: e.clientY - grabDelta.current.y + rect.height,
      }

      // Find which non-dragged card the dragged card overlaps most with
      let bestIdx = -1
      let bestOverlap = 0
      cardRefs.current.forEach((el, id) => {
        if (id === currentDragId) return
        const idx = parseInt(el.dataset.cardIdx ?? "", 10)
        if (isNaN(idx)) return
        const r = el.getBoundingClientRect()
        const overlapX = Math.max(0, Math.min(dragVisual.right, r.right) - Math.max(dragVisual.left, r.left))
        const overlapY = Math.max(0, Math.min(dragVisual.bottom, r.bottom) - Math.max(dragVisual.top, r.top))
        const area = overlapX * overlapY
        if (area > bestOverlap) {
          bestOverlap = area
          bestIdx = idx
        }
      })

      // Only swap when the overlap is at least 40% of the target card's area
      if (bestIdx === -1) return
      const targetEl = Array.from(cardRefs.current.values()).find(
        (el) => parseInt(el.dataset.cardIdx ?? "", 10) === bestIdx
      )
      if (!targetEl) return
      const targetRect = targetEl.getBoundingClientRect()
      const targetArea = targetRect.width * targetRect.height
      if (bestOverlap < targetArea * 0.4) return

      if (bestIdx === lastSwapIdx.current) return
      const now = Date.now()
      if (now - lastSwapTime.current < 500) return
      lastSwapTime.current = now

      const currentAnimals = animalsRef.current
      const fromIdx = currentAnimals.findIndex((a) => a.id === currentDragId)
      const targetIdx = bestIdx
      if (fromIdx === -1 || fromIdx === targetIdx) return

      // Snapshot ALL card positions before reorder (for FLIP animation)
      const rects = new Map<string, DOMRect>()
      cardRefs.current.forEach((el, id) => {
        if (el) rects.set(id, el.getBoundingClientRect())
      })
      prevRects.current = rects

      const reordered = [...currentAnimals]
      const [moved] = reordered.splice(fromIdx, 1)
      reordered.splice(targetIdx, 0, moved)
      onReorder(reordered)
      setFlipTick((t) => t + 1)
      lastSwapIdx.current = targetIdx
    },
    [onReorder]
  )

  const onWindowPointerUp = useCallback(() => {
    if (isDragging.current) {
      suppressClickUntil.current = Date.now() + 300
    }
    endDrag()
    window.removeEventListener("pointermove", onWindowPointerMove)
    window.removeEventListener("pointerup", onWindowPointerUp)
  }, [endDrag, onWindowPointerMove])

  const startDrag = useCallback(
    (id: string) => {
      isDragging.current = true
      dragIdRef.current = id
      setDragId(id)
      setDragOffset({ x: 0, y: 0 })
      dragOffsetRef.current = { x: 0, y: 0 }
      lastSwapIdx.current = null
      if (navigator.vibrate) navigator.vibrate(30)

      window.addEventListener("pointermove", onWindowPointerMove)
      window.addEventListener("pointerup", onWindowPointerUp)
    },
    [onWindowPointerMove, onWindowPointerUp]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (e.button !== 0) return
      pressOrigin.current = { x: e.clientX, y: e.clientY }
      lastPointerRef.current = { x: e.clientX, y: e.clientY }
      isDragging.current = false

      const cardEl = e.currentTarget as HTMLElement
      const rect = cardEl.getBoundingClientRect()
      grabDelta.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }

      longPressTimer.current = setTimeout(() => {
        startDrag(id)
      }, LONG_PRESS_MS)
    },
    [startDrag]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging.current || !pressOrigin.current) return
      const dx = e.clientX - pressOrigin.current.x
      const dy = e.clientY - pressOrigin.current.y
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        clearLongPress()
        pressOrigin.current = null
      }
    },
    [clearLongPress]
  )

  const handlePointerUp = useCallback(() => {
    clearLongPress()
    pressOrigin.current = null
  }, [clearLongPress])

  const handleCardClick = useCallback(
    (id: string) => {
      if (Date.now() < suppressClickUntil.current) return
      onSelect(id)
    },
    [onSelect]
  )

  useEffect(() => {
    return () => {
      clearLongPress()
      window.removeEventListener("pointermove", onWindowPointerMove)
      window.removeEventListener("pointerup", onWindowPointerUp)
    }
  }, [clearLongPress, onWindowPointerMove, onWindowPointerUp])

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

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el)
    else cardRefs.current.delete(id)
  }, [])

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
          <span className="text-[6px] text-neutral-500 tracking-[0.2em]">
            HERP-DEX v1.0
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
            <div className="relative p-3 flex flex-col gap-2.5 animate-flicker h-full overflow-y-auto">
              {/* Title bar */}
              <header className="text-center">
                <div className="text-[7px] text-gb-dark">
                  {"+--------------------------+"}
                </div>
                <h1 className="text-[10px] text-gb-lightest tracking-[0.15em] py-0.5">
                  HERP-DEX
                </h1>
                <div className="text-[7px] text-gb-dark">
                  {"+--------------------------+"}
                </div>
              </header>

              {/* Info line */}
              <div className="text-[7px] text-gb-light text-center tracking-wider">
                {animals.length === 0
                  ? "NO ANIMALS YET - TAP + TO ADD"
                  : `${animals.length}/15 ANIMAL${animals.length > 1 ? "S" : ""} REGISTERED`}
              </div>

              {/* Grid of cards */}
              <div className="grid grid-cols-2 gap-3">
                {animals.map((animal, idx) => {
                  const isBeingDragged = dragId === animal.id

                  return (
                    <div
                      key={animal.id}
                      ref={(el) => setCardRef(animal.id, el)}
                      data-card-idx={idx}
                      onPointerDown={(e) => handlePointerDown(e, animal.id)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative select-none"
                      style={{
                        zIndex: isBeingDragged ? 50 : 1,
                        touchAction: "none",
                        WebkitTouchCallout: "none" as never,
                        pointerEvents: isBeingDragged ? "none" : "auto",
                        ...(isBeingDragged
                          ? {
                              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.05)`,
                              transition: "box-shadow 0.2s",
                              boxShadow:
                                "0 8px 24px rgba(0,0,0,0.5), 0 0 0 2px rgba(139,172,15,0.4)",
                              opacity: 0.9,
                            }
                          : {}),
                        borderRadius: "2px",
                      }}
                    >
                      <AnimalCard
                        animal={animal}
                        onSelect={handleCardClick}
                        onDelete={onDelete}
                      />
                    </div>
                  )
                })}

                {/* Add button card — hidden when at capacity */}
                {animals.length < 15 && (
                  <button
                    type="button"
                    onClick={handleAddClick}
                    className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gb-dark hover:border-gb-light bg-gb-dark/10 hover:bg-gb-dark/20 transition-colors group"
                  >
                    <span className="text-[22px] text-gb-dark group-hover:text-gb-light transition-colors leading-none">
                      +
                    </span>
                    <span className="text-[8px] text-gb-dark group-hover:text-gb-light transition-colors tracking-wider">
                      ADD NEW
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom shell detail */}
        <div className="flex items-center px-3 mt-3 mb-1">
          <div className="flex items-center gap-2 flex-1">
            {onExport && (
              <button
                onClick={onExport}
                className="text-[5px] text-neutral-600 hover:text-neutral-400 tracking-[0.1em] transition-colors"
                aria-label="Export data"
              >
                EXPORT
              </button>
            )}
            {onImport && (
              <button
                onClick={onImport}
                className="text-[5px] text-neutral-600 hover:text-neutral-400 tracking-[0.1em] transition-colors"
                aria-label="Import data"
              >
                IMPORT
              </button>
            )}
          </div>
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="flex items-center gap-1 text-[6px] text-neutral-500 hover:text-neutral-300 tracking-[0.1em] transition-colors"
              aria-label="Open AI assistant"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
                <rect x="0" y="1" width="7" height="5" rx="0" />
                <polygon points="1,6 3,6 1,8" />
              </svg>
              HERP-AI
            </button>
          )}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {onChangePin && (
              <button
                onClick={onChangePin}
                className="text-[6px] text-neutral-600 hover:text-neutral-400 tracking-[0.1em] transition-colors"
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
