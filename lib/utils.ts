import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS_ABBR = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."]

function ordinal(n: number): string {
  const s = n % 100
  if (s >= 11 && s <= 13) return "th"
  switch (n % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}

/** Format date as "15th Feb. 2026" (day + ordinal, abbreviated month, year) */
export function formatGeckoDate(d: Date): string {
  const day = d.getDate()
  const month = MONTHS_ABBR[d.getMonth()]
  const year = d.getFullYear()
  return `${day}${ordinal(day)} ${month} ${year}`
}

/** Format date as dd/mm */
export function toDDMM(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}`
}

/** Parse ISO date string (YYYY-MM-DD) to days ago from today (start of day) */
export function daysAgo(isoDate: string): number {
  const then = new Date(isoDate)
  const now = new Date()
  then.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - then.getTime()) / (24 * 60 * 60 * 1000))
}
