"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"

interface ModalBackdropProps {
  children: ReactNode
  onClose?: () => void
  className?: string
}

export function ModalBackdrop({ children, onClose, className = "" }: ModalBackdropProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<Element | null>(null)

  useEffect(() => {
    previousFocus.current = document.activeElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key !== "Tab" || !backdropRef.current) return
      const focusable = backdropRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    const timer = requestAnimationFrame(() => {
      if (backdropRef.current) {
        const first = backdropRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        first?.focus()
      }
    })

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      cancelAnimationFrame(timer)
      if (previousFocus.current instanceof HTMLElement) {
        previousFocus.current.focus()
      }
    }
  }, [onClose])

  return createPortal(
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      className={"fixed inset-0 z-50 flex items-center justify-center " + className}
    >
      {onClose && (
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>,
    document.body
  )
}
