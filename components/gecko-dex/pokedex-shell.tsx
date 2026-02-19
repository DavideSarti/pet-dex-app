"use client"

import { useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { toDDMM } from "@/lib/utils"
import type { AnimalProfile, HealthLogEntry, Prescription, BeetleStage, WeightEntry } from "./types"
import { GeckoSprite } from "./gecko-sprite"
import { BasicInfo } from "./basic-info"
import { StatsGrid } from "./stats-grid"
import { HealthLog } from "./health-log"
import { SelectBar } from "./select-bar"
import { FeedModal, type FeedRow } from "./feed-modal"
import { WeightModal } from "./weight-modal"
import { ShedModal } from "./shed-modal"
import { MedsModal } from "./meds-modal"

const BeetleSprite = dynamic(() => import("./beetle-sprite").then(m => ({ default: m.BeetleSprite })), { ssr: false })
const BeetleStats = dynamic(() => import("./beetle-stats").then(m => ({ default: m.BeetleStats })), { ssr: false })
const SubstrateModal = dynamic(() => import("./substrate-modal").then(m => ({ default: m.SubstrateModal })), { ssr: false })
type ModalType = "feed" | "weight" | "shed" | "meds" | "substrate" | null

const GECKO_TABS = ["FEED", "WATER", "WEIGHT", "SHED", "MEDS"]
const BEETLE_TABS = ["FEED", "WEIGHT", "SUBSTRATE", "MEDS"]

interface PokedexShellProps {
  animal: AnimalProfile
  onUpdate: (updated: AnimalProfile) => void
  onBack: () => void
  onOpenChat?: () => void
}

export function PokedexShell({ animal, onUpdate, onBack, onOpenChat }: PokedexShellProps) {
  const isBeetle = animal.species === "RHINO BEETLE"

  const [healthLog, setHealthLog] = useState<HealthLogEntry[]>(animal.healthLog)
  const [showLogs, setShowLogs] = useState(false)
  const [showSmartHome, setShowSmartHome] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [weight, setWeight] = useState(animal.weight)
  const [lastFeed, setLastFeed] = useState(animal.lastFeed)
  const [lastShed, setLastShed] = useState(animal.lastShed)
  const [lastWaterChange, setLastWaterChange] = useState(animal.lastWaterChange ?? new Date().toISOString().slice(0, 10))
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  // Editable profile fields
  const [geckoName, setGeckoName] = useState(animal.name)
  const [geckoSex, setGeckoSex] = useState(animal.sex)
  const [geckoMorph, setGeckoMorph] = useState(animal.morph)
  const [geckoBorn, setGeckoBorn] = useState(animal.born)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(animal.prescriptions ?? [])
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(animal.weightHistory ?? [])

  // Beetle-specific state
  const [beetleStage, setBeetleStage] = useState<BeetleStage>(animal.stage ?? "LARVA")
  const [subspecies, setSubspecies] = useState(animal.subspecies ?? "")
  const [customPhoto, setCustomPhoto] = useState<string | undefined>(animal.customPhoto)
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

  const MAX_LOGS_PER_DAY = 50
  const canAddLog = useCallback(() => {
    const today = getTodayISO()
    const todayCount = healthLogRef.current.filter((e) => e.id.length >= 13 && new Date(Number(e.id)).toISOString().slice(0, 10) === today).length
    if (todayCount >= MAX_LOGS_PER_DAY) {
      showAction("MAX 50 LOGS/DAY!")
      return false
    }
    return true
  }, [showAction])

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
        lastWaterChange,
        healthLog,
        prescriptions,
        weightHistory,
        customPhoto,
        // beetle fields
        stage: beetleStage,
        subspecies,
        substrate,
        lastSubstrateChange,
        ...overrides,
      })
    },
    [animal, onUpdate, geckoName, geckoSex, geckoMorph, geckoBorn, weight, lastFeed, lastShed, lastWaterChange, healthLog, prescriptions, weightHistory, customPhoto, beetleStage, subspecies, substrate, lastSubstrateChange]
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
    [showAction, pushUpdate, isBeetle]
  )

  // --- Custom Photo ---
  const handlePhotoChange = useCallback(
    (dataUrl: string | undefined) => {
      setCustomPhoto(dataUrl)
      pushUpdate({ customPhoto: dataUrl })
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
      if (!canAddLog()) { setActiveModal(null); return }
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
    [showAction, pushUpdate, canAddLog]
  )

  // --- Weight ---
  const openWeight = useCallback(() => setActiveModal("weight"), [])

  const handleWeightConfirm = useCallback(
    (newWeight: string) => {
      if (!canAddLog()) { setActiveModal(null); return }
      const unit = "g"
      const newEntry: HealthLogEntry = {
        id: String(Date.now()),
        type: "vet",
        text: `WEIGHT: ${newWeight}${unit} LOGGED`,
      }
      const updatedLog = [...healthLogRef.current, newEntry]
      const weightEntry: WeightEntry = { date: getTodayISO(), value: parseFloat(newWeight) || 0 }
      const updatedHistory = [...weightHistoryRef.current, weightEntry]
      setWeight(newWeight)
      setHealthLog(updatedLog)
      setWeightHistory(updatedHistory)
      pushUpdate({ weight: newWeight, healthLog: updatedLog, weightHistory: updatedHistory })
      showAction(`WEIGHT: ${newWeight}${unit}`)
      setActiveModal(null)
    },
    [showAction, pushUpdate, canAddLog]
  )

  // --- Shed (gecko only) ---
  const openShed = useCallback(() => setActiveModal("shed"), [])

  const handleShedConfirm = useCallback(
    (quality: string) => {
      if (!canAddLog()) { setActiveModal(null); return }
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
    [showAction, pushUpdate, canAddLog]
  )

  // --- Water Change (gecko) ---
  const handleWaterChange = useCallback(
    () => {
      if (!canAddLog()) return
      const iso = getTodayISO()
      const dateStr = getDateStr()
      const newEntry: HealthLogEntry = {
        id: String(Date.now()),
        type: "water",
        text: `WATER: ${dateStr} - CHANGED`,
      }
      const updatedLog = [...healthLogRef.current, newEntry]
      setLastWaterChange(iso)
      setHealthLog(updatedLog)
      pushUpdate({ lastWaterChange: iso, healthLog: updatedLog })
      showAction("WATER CHANGED!")
    },
    [showAction, pushUpdate, canAddLog]
  )

  // --- Substrate (beetle only) ---
  const openSubstrate = useCallback(() => setActiveModal("substrate"), [])

  const handleSubstrateConfirm = useCallback(
    (substrateType: string) => {
      if (!canAddLog()) { setActiveModal(null); return }
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
    [showAction, pushUpdate, canAddLog]
  )

  // --- Meds ---
  const openMeds = useCallback(() => setActiveModal("meds"), [])

  const handleAddPrescription = useCallback(
    (medName: string, totalDays: number, dosesPerDay: number, notes: string) => {
      if (!canAddLog()) return
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
    [showAction, pushUpdate, canAddLog]
  )

  const handleLogDose = useCallback(
    (rxId: string) => {
      if (!canAddLog()) return
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
    [showAction, pushUpdate, canAddLog]
  )

  const handleCompletePrescription = useCallback(
    (rxId: string) => {
      if (!canAddLog()) return
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
    [showAction, pushUpdate, canAddLog]
  )

  const closeModal = useCallback(() => setActiveModal(null), [])

  // --- Tab select ---
  const handleTabSelect = useCallback(
    (tab: string) => {
      if (tab === "FEED") openFeed()
      else if (tab === "WEIGHT") openWeight()
      else if (tab === "SHED") openShed()
      else if (tab === "WATER") handleWaterChange()
      else if (tab === "SUBSTRATE") openSubstrate()
      else if (tab === "MEDS") openMeds()
    },
    [openFeed, openWeight, openShed, handleWaterChange, openSubstrate, openMeds]
  )

  const titleLabel = "HERP-DEX"

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
            <div className="relative p-3 flex flex-col gap-2.5 animate-flicker h-full overflow-y-auto">
              {showLogs ? (
                <>
                  <header className="text-center relative">
                    <button
                      type="button"
                      onClick={() => setShowLogs(false)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-[8px] text-gb-dark hover:text-gb-light transition-colors tracking-wider"
                      aria-label="Back to profile"
                    >
                      {"< BACK"}
                    </button>
                    <div className="text-[7px] text-gb-dark">
                      {"+--------------------------+"}
                    </div>
                    <h1 className="text-[10px] text-gb-lightest tracking-[0.15em] py-0.5">
                      LOGS
                    </h1>
                    <div className="text-[7px] text-gb-dark">
                      {"+--------------------------+"}
                    </div>
                  </header>
                  <HealthLog entries={healthLog} species={animal.species} fullScreen />
                </>
              ) : (
              <>
              {/* Back button */}
              <button
                type="button"
                onClick={onBack}
                className="self-start text-[8px] text-gb-dark hover:text-gb-light transition-colors tracking-wider"
                aria-label="Back to list"
              >
                {"< BACK"}
              </button>

              {/* Sprite frame - species-specific */}
              {isBeetle ? (
                <BeetleSprite
                  stage={beetleStage}
                  subspecies={subspecies}
                  onSubspeciesChange={handleSubspeciesChange}
                  customPhoto={customPhoto}
                  onPhotoChange={handlePhotoChange}
                />
              ) : (
                <GeckoSprite
                  customPhoto={customPhoto}
                  onPhotoChange={handlePhotoChange}
                />
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
                  lastWaterChangeIso={lastWaterChange}
                  weightHistory={weightHistory}
                />
              )}

              {/* Action buttons - species-specific */}
              <SelectBar
                tabs={isBeetle ? BEETLE_TABS : GECKO_TABS}
                onSelect={handleTabSelect}
              />

              {/* Action feedback toast */}
              {lastAction && (
                <div
                  className="text-center text-[8px] text-gb-darkest bg-gb-light py-1 px-2"
                  role="status"
                  aria-live="polite"
                >
                  {">> "}
                  {lastAction}
                  {" <<"}
                </div>
              )}

              {/* Logs button */}
              <button
                type="button"
                onClick={() => setShowLogs(true)}
                className="w-full py-1.5 text-[7px] text-gb-darkest bg-gb-light hover:bg-gb-lightest border-2 border-gb-lightest tracking-wider text-center transition-colors font-bold"
              >
                LOGS
              </button>

              {/* Smart Terrarium button */}
              <button
                type="button"
                onClick={() => setShowSmartHome(true)}
                className="w-full py-1.5 text-[7px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light tracking-wider text-center transition-colors flex items-center justify-center gap-1"
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 1L1 7h2v6h4v-4h2v4h4V7h2L8 1z" />
                </svg>
                SMART TERRARIUM
              </button>
              </>
              )}
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
                unit="g"
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
            {showSmartHome && (
              <SmartHomePopup onClose={() => setShowSmartHome(false)} />
            )}
          </div>
        </div>

        {/* Bottom shell detail */}
        <div className="flex items-center px-3 mt-3 mb-1">
          <span className="text-[6px] text-neutral-600 tracking-[0.15em] flex-1">
            HERP-DEX
          </span>
          {onOpenChat && (
            <button
              type="button"
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
          <div className="flex gap-[3px] flex-1 justify-end" aria-hidden="true">
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

function SmartHomePopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="pixel-border bg-gb-darkest p-4 flex flex-col items-center gap-3 max-w-[220px]"
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" className="text-gb-light" aria-hidden="true">
          <path d="M8 1L1 7h2v6h4v-4h2v4h4V7h2L8 1z" />
        </svg>
        <div className="text-[8px] text-gb-lightest tracking-wider text-center">
          SMART TERRARIUM
        </div>
        <div className="text-[7px] text-gb-light text-center leading-relaxed">
          {"Feature's cooking, stay tuned!"}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[7px] text-gb-dark hover:text-gb-light border border-gb-dark hover:border-gb-light px-4 py-1 tracking-wider transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  )
}
