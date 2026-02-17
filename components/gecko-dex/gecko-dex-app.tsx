"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { AnimalProfile } from "./types"
import { GridView } from "./grid-view"
import { PokedexShell } from "./pokedex-shell"
import { PinScreen } from "./pin-screen"
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase"

const STORAGE_KEY = "pet-dex-animals"
const PIN_KEY = "pet-dex-pin"

const DEFAULT_ANIMAL: AnimalProfile = {
  id: "1",
  dexNumber: 1,
  name: "MANGO",
  sex: "?",
  species: "LEOPARD GECKO",
  morph: "TANGERINE",
  born: "15/03/23",
  weight: "62",
  lastFeed: "2026-02-12",
  lastShed: "2026-01-28",
  healthLog: [
    { id: "1", type: "vet", text: "VET: 01/15 - CHECKUP OK" },
    { id: "2", type: "meds", text: "MEDS: None" },
    { id: "3", type: "vet", text: "VET: 06/20 - SHED ISSUE" },
    { id: "4", type: "meds", text: "MEDS: VIT-A DROPS x7D" },
    { id: "5", type: "vet", text: "VET: 12/02 - ALL CLEAR" },
    { id: "6", type: "meds", text: "MEDS: None" },
  ],
  prescriptions: [],
  weightHistory: [],
    image: "/images/gecko-normal.png",
}

function loadAnimalsLocal(): AnimalProfile[] {
  if (typeof window === "undefined") return [DEFAULT_ANIMAL]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AnimalProfile[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return [DEFAULT_ANIMAL]
}

function loadPinLocal(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(PIN_KEY)
}

function makeGeckoDefaults(id: string, dexNumber: number): AnimalProfile {
  return {
    id,
    dexNumber,
    name: "NEW GECKO",
    sex: "?",
    species: "LEOPARD GECKO",
    morph: "NORMAL",
    born: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }),
    weight: "0",
    lastFeed: new Date().toISOString().slice(0, 10),
    lastShed: new Date().toISOString().slice(0, 10),
    healthLog: [],
    prescriptions: [],
    weightHistory: [],
    image: "/images/gecko-normal.png",
  }
}

function makeBeetleDefaults(id: string, dexNumber: number): AnimalProfile {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id,
    dexNumber,
    name: "NEW BEETLE",
    sex: "?",
    species: "RHINO BEETLE",
    morph: "",
    born: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }),
    weight: "0",
    lastFeed: today,
    lastShed: today,
    healthLog: [],
    prescriptions: [],
    weightHistory: [],
    image: "/images/beetle-sprite.png",
    stage: "LARVA",
    substrate: "OAK FLAKE SOIL",
    lastSubstrateChange: today,
  }
}

function makeDogDefaults(id: string, dexNumber: number): AnimalProfile {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id,
    dexNumber,
    name: "NEW DOG",
    sex: "?",
    species: "DOG",
    morph: "ALASKAN MALAMUTE",
    breed: "ALASKAN MALAMUTE",
    born: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }),
    weight: "0",
    lastFeed: today,
    lastShed: today,
    healthLog: [],
    prescriptions: [],
    weightHistory: [],
    image: "/images/dog-sprite.png",
    breed: "ALASKAN MALAMUTE",
    lastVetCheckup: "",
    nextVaccination: "",
  }
}

// ---- Cloud sync helpers ----

async function fetchCloudData(pin: string) {
  const sb = getSupabase()
  if (!sb) return null

  const { data, error } = await sb
    .from("pet_dex_data")
    .select("animals, counters")
    .eq("pin", pin)
    .maybeSingle()

  if (error) throw error
  return data
}

async function saveToCloud(
  pin: string,
  animals: AnimalProfile[]
) {
  const sb = getSupabase()
  if (!sb) return

  const { error } = await sb.from("pet_dex_data").upsert(
    {
      pin,
      animals: JSON.parse(JSON.stringify(animals)),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "pin" }
  )
  if (error) throw error
}

// ---- Main component ----

export function GeckoDexApp() {
  const cloudEnabled = isSupabaseConfigured()

  const [pin, setPin] = useState<string | null>(loadPinLocal)
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)
  const [ready, setReady] = useState(!cloudEnabled)

  const [animals, setAnimals] = useState<AnimalProfile[]>(loadAnimalsLocal)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pinRef = useRef(pin)
  pinRef.current = pin

  // If cloud is not configured, skip PIN and go straight to localStorage mode
  useEffect(() => {
    if (!cloudEnabled) {
      setReady(true)
      return
    }
    const savedPin = loadPinLocal()
    if (savedPin) {
      setPin(savedPin)
      handlePinSubmit(savedPin)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudEnabled])

  // Save animals to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(animals))
    } catch {}
  }, [animals])

  // Debounced cloud save (waits 500ms after last change)
  const scheduleCloudSave = useCallback(
    (updatedAnimals: AnimalProfile[]) => {
      if (!cloudEnabled || !pinRef.current) return
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(async () => {
        try {
          await saveToCloud(pinRef.current!, updatedAnimals)
        } catch (err) {
          console.error("Cloud save failed:", err)
        }
      }, 500)
    },
    [cloudEnabled]
  )

  // PIN submit handler
  async function handlePinSubmit(submittedPin: string) {
    setPinLoading(true)
    setPinError(null)
    try {
      const cloudData = await fetchCloudData(submittedPin)

      if (cloudData) {
        const cloudAnimals = cloudData.animals as AnimalProfile[]
        if (Array.isArray(cloudAnimals) && cloudAnimals.length > 0) {
          setAnimals(cloudAnimals)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudAnimals))
        }
      } else {
        // First time with this PIN: push current local data to cloud
        const localAnimals = loadAnimalsLocal()
        await saveToCloud(submittedPin, localAnimals)
      }

      setPin(submittedPin)
      pinRef.current = submittedPin
      localStorage.setItem(PIN_KEY, submittedPin)
      setReady(true)
    } catch (err) {
      console.error("Sync error:", err)
      setPinError("CONNECTION FAILED. CHECK YOUR INTERNET.")
    } finally {
      setPinLoading(false)
    }
  }

  // Change PIN (accessible from grid view)
  const handleChangePin = useCallback(() => {
    localStorage.removeItem(PIN_KEY)
    setPin(null)
    setReady(false)
  }, [])

  const selectedAnimal = selectedId
    ? animals.find((a) => a.id === selectedId) ?? null
    : null

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedId(null)
  }, [])

  const handleAdd = useCallback(
    (species: string) => {
      setAnimals((prev) => {
        // Compute next unique id (max existing + 1, always safe)
        const maxId = prev.reduce((max, a) => Math.max(max, parseInt(a.id, 10) || 0), 0)
        const id = String(maxId + 1)

        // Find the lowest available dex number
        const usedNumbers = new Set(prev.map((a) => a.dexNumber))
        let dexNumber = 1
        while (usedNumbers.has(dexNumber)) dexNumber++

        let newAnimal: AnimalProfile
        if (species === "RHINO BEETLE") {
          newAnimal = makeBeetleDefaults(id, dexNumber)
        } else if (species === "DOG") {
          newAnimal = makeDogDefaults(id, dexNumber)
        } else {
          newAnimal = makeGeckoDefaults(id, dexNumber)
        }
        const updated = [...prev, newAnimal]
        scheduleCloudSave(updated)
        return updated
      })
    },
    [scheduleCloudSave]
  )

  const handleDelete = useCallback(
    (id: string) => {
      setAnimals((prev) => {
        const updated = prev.filter((a) => a.id !== id)
        scheduleCloudSave(updated)
        return updated
      })
      if (selectedId === id) setSelectedId(null)
    },
    [selectedId, scheduleCloudSave]
  )

  const handleUpdate = useCallback(
    (updated: AnimalProfile) => {
      setAnimals((prev) => {
        const newList = prev.map((a) => (a.id === updated.id ? updated : a))
        scheduleCloudSave(newList)
        return newList
      })
    },
    [scheduleCloudSave]
  )

  const handleReorder = useCallback(
    (reordered: AnimalProfile[]) => {
      setAnimals(reordered)
      scheduleCloudSave(reordered)
    },
    [scheduleCloudSave]
  )

  // Show PIN screen if cloud is enabled but not yet authenticated
  if (cloudEnabled && !ready) {
    return (
      <PinScreen
        onSubmit={handlePinSubmit}
        loading={pinLoading}
        error={pinError}
      />
    )
  }

  if (selectedAnimal) {
    return (
      <PokedexShell
        key={selectedAnimal.id}
        animal={selectedAnimal}
        onUpdate={handleUpdate}
        onBack={handleBack}
      />
    )
  }

  return (
    <GridView
      animals={animals}
      onSelect={handleSelect}
      onAdd={handleAdd}
      onDelete={handleDelete}
      onReorder={handleReorder}
      onChangePin={cloudEnabled ? handleChangePin : undefined}
    />
  )
}
