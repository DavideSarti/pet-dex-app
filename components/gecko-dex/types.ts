export type HealthLogType = "feeding" | "meds" | "vet" | "shed" | "substrate" | "water"

export interface HealthLogEntry {
  id: string
  type: HealthLogType
  text: string
}

export interface BeetleColors {
  body: string    // single color; shading is preserved automatically
}

export interface Prescription {
  id: string
  medName: string        // e.g. "VIT-A DROPS"
  totalDays: number      // total days prescribed
  dosesPerDay: number    // how many doses per day (default 1)
  dosesGiven: string[]   // ISO dates of each dose logged (may have duplicates for multi-dose days)
  startDate: string      // ISO YYYY-MM-DD
  notes: string          // e.g. "2 drops daily"
  completed: boolean     // true when all doses done or manually ended
}

export interface WeightEntry {
  date: string   // ISO YYYY-MM-DD
  value: number  // grams
}

export type AnimalSex = "MALE" | "FEMALE" | "?"

export type BeetleStage = "EGG" | "LARVA" | "PUPA" | "ADULT"

export interface AnimalProfile {
  id: string
  dexNumber: number      // incremental: 1, 2, 3...
  name: string
  sex: AnimalSex
  species: string        // e.g. "LEOPARD GECKO", "RHINO BEETLE"
  morph: string          // gecko-specific
  born: string           // DD/MM/YY
  weight: string
  lastFeed: string       // ISO YYYY-MM-DD
  lastShed: string       // ISO YYYY-MM-DD (gecko-specific)
  lastWaterChange?: string // ISO YYYY-MM-DD (gecko-specific)
  healthLog: HealthLogEntry[]
  prescriptions: Prescription[]
  weightHistory: WeightEntry[]
  image: string          // path to sprite image
  customPhoto?: string   // base64 data URL from camera/gallery
  subspecies?: string    // e.g. "ALLOMYRINA DICHOTOMA"
  // Beetle-specific fields
  beetleColors?: BeetleColors
  stage?: BeetleStage
  substrate?: string           // e.g. "OAK FLAKE SOIL"
  lastSubstrateChange?: string // ISO YYYY-MM-DD
}
