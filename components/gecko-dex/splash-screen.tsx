"use client"

import { useState, useEffect } from "react"

interface SplashScreenProps {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [titleOn, setTitleOn] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const a = setTimeout(() => setTitleOn(true), 200)
    const c = setTimeout(() => setFadeOut(true), 1700)
    const d = setTimeout(onDone, 2100)
    return () => {
      clearTimeout(a)
      clearTimeout(c)
      clearTimeout(d)
    }
  }, [onDone])

  return (
    <div
      className={
        "fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-400 " +
        (fadeOut ? "opacity-0" : "opacity-100")
      }
      style={{ background: "#0f380f" }}
    >
      <div className="scanlines absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div
        className={
          "transition-all duration-700 " +
          (titleOn ? "opacity-100 scale-100" : "opacity-0 scale-90")
        }
      >
        <h1
          className="text-[22px] sm:text-[28px] text-gb-lightest tracking-[0.3em] text-center"
          style={{
            textShadow: "0 0 12px rgba(155,188,15,0.5), 0 0 24px rgba(155,188,15,0.2)",
          }}
        >
          HERP-DEX
        </h1>
      </div>
    </div>
  )
}