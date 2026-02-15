"use client"

import { useState, useCallback } from "react"
import type { AnimalProfile } from "./types"
import { GridView } from "./grid-view"
import { PokedexShell } from "./pokedex-shell"

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
  image: "/images/gecko-sprite.png",
}

let nextId = 2
let nextDexNumber = 2

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
    image: "/images/gecko-sprite.png",
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

export function GeckoDexApp() {
  const [animals, setAnimals] = useState<AnimalProfile[]>([DEFAULT_ANIMAL])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedAnimal = selectedId
    ? animals.find((a) => a.id === selectedId) ?? null
    : null

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedId(null)
  }, [])

  const handleAdd = useCallback((species: string) => {
    const id = String(nextId++)
    const dexNumber = nextDexNumber++
    const newAnimal =
      species === "RHINO BEETLE"
        ? makeBeetleDefaults(id, dexNumber)
        : makeGeckoDefaults(id, dexNumber)
    setAnimals((prev) => [...prev, newAnimal])
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      setAnimals((prev) => prev.filter((a) => a.id !== id))
      if (selectedId === id) setSelectedId(null)
    },
    [selectedId]
  )

  const handleUpdate = useCallback((updated: AnimalProfile) => {
    setAnimals((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    )
  }, [])

  const handleReorder = useCallback((reordered: AnimalProfile[]) => {
    setAnimals(reordered)
  }, [])

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
    />
  )
}
