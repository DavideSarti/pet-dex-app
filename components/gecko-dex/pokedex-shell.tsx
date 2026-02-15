"use client"

import { useState, useCallback, useRef } from "react"
import { toDDMM } from "@/lib/utils"
import type { AnimalProfile, HealthLogEntry, GeckoColors, BeetleColors, Prescription, BeetleStage, WeightEntry } from "./types"
import { GeckoSprite, DEFAULT_COLORS } from "./gecko-sprite"
import { BeetleSprite, DEFAULT_BEETLE_COLORS } from "./beetle-sprite"
import { BasicInfo } from "./basic-info"
import { StatsGrid } from "./stats-grid"
import { BeetleStats } from "./beetle-stats"
import { HealthLog } from "./health-log"
import { SelectBar } from "./select-bar"
import { FeedModal, type FeedRow } from "./feed-modal"
import { WeightModal } from "./weight-modal"
import { ShedModal } from "./shed-modal"
import { SubstrateModal } from "./substrate-modal"
import { MedsModal } from "./meds-modal"
type ModalType = "feed" | "weight" | "shed" | "meds" | "substrate" | null

const GECKO_TABS = ["FEED", "WEIGHT", "SHED", "MEDS"]
const BEETLE_TABS = ["FEED", "WEIGHT", "SUBSTRATE", "MEDS"]

interface PokedexShellProps {
  animal: AnimalProfile
  onUpdate: (updated: AnimalProfile) => void
  onBack: () => void
}

export function PokedexShell({ animal, onUpdate, onBack }: PokedexShellProps) {
  const isBeetle = animal.species === "RHINO BEETLE"

  const [healthLog, setHealthLog] = useState<HealthLogEntry[]>(animal.healthLog)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [weight, setWeight] = useState(animal.weight)
  const [lastFeed, setLastFeed] = useState(animal.lastFeed)
  const [lastShed, setLastShed] = useState(animal.lastShed)
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  // Editable profile fields
  const [geckoName, setGeckoName] = useState(animal.name)
  const [geckoSex, setGeckoSex] = useState(animal.sex)
  const [geckoMorph, setGeckoMorph] = useState(animal.morph)
  const [geckoBorn, setGeckoBorn] = useState(animal.born)
  const [geckoColors, setGeckoColors] = useState<GeckoColors>(animal.colors ?? { ...DEFAULT_COLORS })
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(animal.prescriptions ?? [])
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(animal.weightHistory ?? [])

  // Beetle-specific state
  const [beetleColors, setBeetleColors] = useState<BeetleColors>(animal.beetleColors ?? { ...DEFAULT_BEETLE_COLORS })
  const [beetleStage, setBeetleStage] = useState<BeetleStage>(animal.stage ?? "LARVA")
  const [subspecies, setSubspecies] = useState(animal.subspecies ?? "")
  const [substrate, setSubstrate] = useState(animal.substrate ?? "OAK FLAKE SOIL")
  const [lastSubstrateChange, setLastSubstrateChange] = useState(animal.lastSubstrateChange ?? new Date().toISOString().slice(0, 10))

  // Refs to track latest values so handlers can read them without nesting setState
  const healthLogRef = useRef(healthLog)
  healthLogRef.current = healthLog
  const prescriptionsRef = useRef(prescriptions)
  prescriptionsRef.current = prescriptions
  const weightHistoryRef = useRef(weightHistory)
  weightHistoryRef.current = weightHistory

  const showAction = useCallback((msg: string) => {
    setLastAction(msg)
    setTimeout(() => setLastAction(null), 2000)
  }, [])

  const getDateStr = () => toDDMM(new Date())
  const getTodayISO = () => new Date().toISOString().slice(0, 10)

  // Push current state up to parent
  const pushUpdate = useCallback(
    (overrides: Partial<AnimalProfile>) => {
      onUpdate({
        ...animal,
        name: geckoName,
        sex: geckoSex,
        morph: geckoMorph,
        born: geckoBorn,
        weight,
        lastFeed,
        lastShed,
        healthLog,
        prescriptions,
        weightHistory,
        colors: geckoColors,
        // beetle fields
        beetleColors,
        stage: beetleStage,
        subspecies,
        substrate,
        lastSubstrateChange,
        ...overrides,
      })
    },
    [animal, onUpdate, geckoName, geckoSex, geckoMorph, geckoBorn, weight, lastFeed, lastShed, healthLog, prescriptions, weightHistory, geckoColors, beetleColors, beetleStage, subspecies, substrate, lastSubstrateChange]
  )

  // --- Profile updates ---
  const handleProfileUpdate = useCallback(
    (field: "name" | "sex" | "morph" | "born" | "stage", value: string) => {
      if (field === "name") {
        setGeckoName(value)
        pushUpdate({ name: value })
      } else if (field === "sex") {
        const sexVal = value as import("./types").AnimalSex
        setGeckoSex(sexVal)
        pushUpdate({ sex: sexVal })
      } else if (field === "morph") {
        setGeckoMorph(value)
        pushUpdate({ morph: value })
      } else if (field === "born") {
        setGeckoBorn(value)
        pushUpdate({ born: value })
      } else if (field === "stage") {
        const stageVal = value as BeetleStage
        setBeetleStage(stageVal)
        pushUpdate({ stage: stageVal })
      }
      showAction(`${field.toUpperCase()} UPDATED!`)
    },
    [showAction, pushUpdate]
  )

  // --- Gecko Colors ---
  const handleColorsChange = useCallback(
    (newColors: GeckoColors) => {
      setGeckoColors(newColors)
      pushUpdate({ colors: newColors })
    },
    [pushUpdate]
  )

  // --- Beetle Colors ---
  const handleBeetleColorsChange = useCallback(
    (newColors: BeetleColors) => {
      setBeetleColors(newColors)
      pushUpdate({ beetleColors: newColors })
    },
    [pushUpdate]
  )

  // --- Subspecies ---
  const handleSubspeciesChange = useCallback(
    (value: string) => {
      setSubspecies(value)
      pushUpdate({ subspecies: value })
    },
    [pushUpdate]
  )

  // --- Feed ---
  const openFeed = useCallback(() => setActiveModal("feed"), [])

  const handleFeedConfirm = useCallback(
    (rows: FeedRow[], integrators: string[]) => {
      const iso = getTodayISO()
      const dateStr = getDateStr()
      const summary = rows.map((r) => `${r.qty} ${r.feeder}`).join(", ")
      const integratorStr = integrators.length > 0 ? ` [${integrators.join(", ")}]` : ""
      const newEntry: HealthLogEntry = {
        id: String(Date.now()),
        type: "feeding",
        text: `FEED: ${dateStr} - ${summary}${integratorStr}`,
      }
      const updatedLog = [...healthLogRef.current, newEntry]
      setLastFeed(iso)
      setHealthLog(updatedLog)
      pushUpdate({ lastFeed: iso, healthLog: updatedLog })
      showAction(`FED ${summary}!`)
      setActiveModal(null)
    },
    [showAction, pushUpdate]
  )

  // --- Weight ---
  const openWeight = useCallback(() => setActiveModal("weight"), [])

  const handleWeightConfirm = useCallback(
    (newWeight: string) => {
      const newEntry: HealthLogEntry = {
        id: String(Date.now()),
        type: "vet",
        text: `WEIGHT: ${newWeight}g LOGGED`,
      }
      const updatedLog = [...healthLogRef.current, newEntry]
      const weightEntry: WeightEntry = { date: getTodayISO(), value: parseFloat(newWeight) || 0 }
      const updatedHistory = [...weightHistoryRef.current, weightEntry]
      setWeight(newWeight)
      setHealthLog(updatedLog)
      setWeightHistory(updatedHistory)
      pushUpdate({ weight: newWeight, healthLog: updatedLog, weightHistory: updatedHistory })
      showAction(`WEIGHT: ${newWeight}g`)
      setActiveModal(null)
    },
    [showAction, pushUpdate]
  )

  // --- Shed (gecko only) ---
  const openShed = useCallback(() => setActiveModal("shed"), [])

  const handleShedConfirm = useCallback(
    (quality: string) => {
      const iso = getTodayISO()
      const dateStr = getDateStr()
      const newEntry: HealthLogEntry = {
        id: String(Date.now()),
        type: "shed",
        text: `SHED: ${dateStr} - ${quality}`,
      }
      const updatedLog = [...healthLogRef.current, newEntry]
      setLastShed(iso)
      setHealthLog(updatedLog)
      pushUpdate({ lastShed: iso, healthLog: updatedLog })
      showAction(`SHED: ${quality}!`)
      setActiveModal(null)
    },
    [showAction, pushUpdate]
  )

  // --- Substrate (beetle only) ---
  const openSubstrate = useCallback(() => setActiveModal("substrate"), [])

  const handleSubstrateConfirm = useCallback(
    (substrateType: string) => {
      const iso = getTodayISO()
      const dateStr = getDateStr()
      const newEntry: HealthLogEntry = {
        id: String(Date.now()),
        type: "substrate",
        text: `SUBSTRATE: ${dateStr} - ${substrateType}`,
      }
      const updatedLog = [...healthLogRef.current, newEntry]
      setSubstrate(substrateType)
      setLastSubstrateChange(iso)
      setHealthLog(updatedLog)
      pushUpdate({ substrate: substrateType, lastSubstrateChange: iso, healthLog: updatedLog })
      showAction(`SUBSTRATE: ${substrateType}!`)
      setActiveModal(null)
    },
    [showAction, pushUpdate]
  )

  // --- Meds ---
  const openMeds = useCallback(() => setActiveModal("meds"), [])

  const handleAddPrescription = useCallback(
    (medName: string, totalDays: number, dosesPerDay: number, notes: string) => {
      const rx: Prescription = {
        id: String(Date.now()),
        medName,
        totalDays,
        dosesPerDay,
        dosesGiven: [],
        startDate: getTodayISO(),
        notes,
        completed: false,
      }
      const dateStr = getDateStr()
      const perDayStr = dosesPerDay > 1 ? ` ${dosesPerDay}x/day` : ""
      const newEntry: HealthLogEntry = {
        id: String(Date.now()) + "-rx",
        type: "meds",
        text: `MEDS: ${dateStr} - NEW RX: ${medName} x${totalDays}d${perDayStr}${notes ? ` (${notes})` : ""}`,
      }
      const updatedRx = [...prescriptionsRef.current, rx]
      const updatedLog = [...healthLogRef.current, newEntry]
      setPrescriptions(updatedRx)
      setHealthLog(updatedLog)
      pushUpdate({ prescriptions: updatedRx, healthLog: updatedLog })
      showAction(`RX: ${medName} x${totalDays}d!`)
    },
    [showAction, pushUpdate]
  )

  const handleLogDose = useCallback(
    (rxId: string) => {
      const todayISO = getTodayISO()
      const dateStr = getDateStr()
      const updatedRx = prescriptionsRef.current.map((rx) => {
        if (rx.id !== rxId) return rx
        const newDoses = [...rx.dosesGiven, todayISO]
        const totalDoses = rx.totalDays * (rx.dosesPerDay || 1)
        const completed = newDoses.length >= totalDoses
        return { ...rx, dosesGiven: newDoses, completed }
      })
      const rx = updatedRx.find((r) => r.id === rxId)
      if (rx) {
        const doseNum = rx.dosesGiven.length
        const totalDoses = rx.totalDays * (rx.dosesPerDay || 1)
        const newEntry: HealthLogEntry = {
          id: String(Date.now()),
          type: "meds",
          text: `MEDS: ${dateStr} - ${rx.medName} DOSE ${doseNum}/${totalDoses}${rx.completed ? " ✓ COMPLETE" : ""}`,
        }
        const updatedLog = [...healthLogRef.current, newEntry]
        setPrescriptions(updatedRx)
        setHealthLog(updatedLog)
        pushUpdate({ prescriptions: updatedRx, healthLog: updatedLog })
        showAction(`${rx.medName}: DOSE ${doseNum}/${totalDoses}`)
      }
    },
    [showAction, pushUpdate]
  )

  const handleCompletePrescription = useCallback(
    (rxId: string) => {
      const dateStr = getDateStr()
      const updatedRx = prescriptionsRef.current.map((rx) =>
        rx.id === rxId ? { ...rx, completed: true } : rx
      )
      const rx = updatedRx.find((r) => r.id === rxId)
      if (rx) {
        const newEntry: HealthLogEntry = {
          id: String(Date.now()),
          type: "meds",
          text: `MEDS: ${dateStr} - ${rx.medName} ENDED (${rx.dosesGiven.length}/${rx.totalDays} doses)`,
        }
        const updatedLog = [...healthLogRef.current, newEntry]
        setPrescriptions(updatedRx)
        setHealthLog(updatedLog)
        pushUpdate({ prescriptions: updatedRx, healthLog: updatedLog })
        showAction(`${rx.medName}: ENDED`)
      }
    },
    [showAction, pushUpdate]
  )

  const closeModal = useCallback(() => setActiveModal(null), [])

  // --- Tab select ---
  const handleTabSelect = useCallback(
    (tab: string) => {
      if (tab === "FEED") openFeed()
      else if (tab === "WEIGHT") openWeight()
      else if (tab === "SHED") openShed()
      else if (tab === "SUBSTRATE") openSubstrate()
      else if (tab === "MEDS") openMeds()
    },
    [openFeed, openWeight, openShed, openSubstrate, openMeds]
  )

  const titleLabel = "PET-DEX"

  return (
    <div className="h-dvh bg-gb-darkest flex items-center justify-center p-2 sm:p-4">
      {/* Outer GameBoy shell */}
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
            {titleLabel} v1.0
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
          {/* Inner screen with green glow - fills available space, scrollable */}
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
              {/* Title bar with back button */}
              <header className="text-center relative">
                <button
                  type="button"
                  onClick={onBack}
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-[7px] text-gb-dark hover:text-gb-light transition-colors tracking-wider"
                  aria-label="Back to list"
                >
                  {"< BACK"}
                </button>
                <div className="text-[6px] text-gb-dark">
                  {"+--------------------------+"}
                </div>
                <h1 className="text-[9px] text-gb-lightest tracking-[0.15em] py-0.5">
                  {titleLabel}
                </h1>
                <div className="text-[6px] text-gb-dark">
                  {"+--------------------------+"}
                </div>
              </header>

              {/* Sprite frame - species-specific */}
              {isBeetle ? (
                <BeetleSprite
                  colors={beetleColors}
                  onColorsChange={handleBeetleColorsChange}
                  stage={beetleStage}
                  subspecies={subspecies}
                  onSubspeciesChange={handleSubspeciesChange}
                />
              ) : (
                <GeckoSprite colors={geckoColors} onColorsChange={handleColorsChange} />
              )}

              {/* Profile info - now editable */}
              <BasicInfo
                name={geckoName}
                sex={geckoSex}
                morph={geckoMorph}
                born={geckoBorn}
                species={animal.species}
                stage={beetleStage}
                onUpdate={handleProfileUpdate}
              />

              {/* Stats - species-specific */}
              {isBeetle ? (
                <BeetleStats
                  weight={`${weight}g`}
                  lastFeedIso={lastFeed}
                  stage={beetleStage}
                  substrate={substrate}
                  lastSubstrateChangeIso={lastSubstrateChange}
                  weightHistory={weightHistory}
                />
              ) : (
                <StatsGrid
                  weight={`${weight}g`}
                  lastFeedIso={lastFeed}
                  lastShedIso={lastShed}
                  weightHistory={weightHistory}
                />
              )}

              {/* Health Log */}
              <HealthLog entries={healthLog} species={animal.species} />

              {/* Action feedback toast */}
              {lastAction && (
                <div
                  className="text-center text-[7px] text-gb-darkest bg-gb-light py-1 px-2"
                  role="status"
                  aria-live="polite"
                >
                  {">> "}
                  {lastAction}
                  {" <<"}
                </div>
              )}

              {/* Tab buttons - species-specific */}
              <SelectBar
                tabs={isBeetle ? BEETLE_TABS : GECKO_TABS}
                onSelect={handleTabSelect}
              />
            </div>

            {/* Modal overlays rendered inside the screen */}
            {activeModal === "feed" && (
              <FeedModal
                onConfirm={handleFeedConfirm}
                onCancel={closeModal}
              />
            )}
            {activeModal === "weight" && (
              <WeightModal
                currentWeight={weight}
                onConfirm={handleWeightConfirm}
                onCancel={closeModal}
              />
            )}
            {activeModal === "shed" && !isBeetle && (
              <ShedModal
                lastShed={lastShed}
                onConfirm={handleShedConfirm}
                onCancel={closeModal}
              />
            )}
            {activeModal === "substrate" && isBeetle && (
              <SubstrateModal
                currentSubstrate={substrate}
                lastChange={lastSubstrateChange}
                onConfirm={handleSubstrateConfirm}
                onCancel={closeModal}
              />
            )}
            {activeModal === "meds" && (
              <MedsModal
                prescriptions={prescriptions}
                onAddPrescription={handleAddPrescription}
                onLogDose={handleLogDose}
                onComplete={handleCompletePrescription}
                onClose={closeModal}
              />
            )}
          </div>
        </div>

        {/* Bottom shell detail */}
        <div className="flex items-center justify-between px-3 mt-3 mb-1">
          <span className="text-[5px] text-neutral-600 tracking-[0.15em]">
            PET-DEX
          </span>
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
  )
}
