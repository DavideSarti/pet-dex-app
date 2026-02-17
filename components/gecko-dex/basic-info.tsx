"use client"

import { useState, useRef, useEffect } from "react"
import type { AnimalSex, BeetleStage } from "./types"

type ProfileField = "name" | "sex" | "morph" | "born" | "stage"

interface BasicInfoProps {
  name: string
  sex: AnimalSex
  morph: string
  born: string
  species: string
  stage?: BeetleStage
  onUpdate: (field: ProfileField, value: string) => void
}

const SEX_OPTIONS: AnimalSex[] = ["MALE", "FEMALE", "?"]
const STAGE_OPTIONS: BeetleStage[] = ["EGG", "LARVA", "PUPA", "ADULT"]

export function BasicInfo({ name, sex, morph, born, species, stage, onUpdate }: BasicInfoProps) {
  const isBeetle = species === "RHINO BEETLE"
  const isDog = species === "DOG"

  return (
    <div className="pixel-border-inset bg-gb-darkest p-2.5">
      <div className="text-[6px] text-gb-dark mb-1.5 border-b border-gb-dark pb-1 tracking-wider">
        {"- PROFILE -"}
      </div>
      <div className="flex flex-col gap-1">
        <EditableRow label="NAME" value={name} field="name" onUpdate={onUpdate} />
        <SexRow value={sex} onUpdate={onUpdate} />
        {isBeetle ? (
          <StageRow value={stage ?? "LARVA"} onUpdate={onUpdate} />
        ) : isDog ? (
          <EditableRow label="BREED" value={morph} field="morph" onUpdate={onUpdate} />
        ) : (
          <EditableRow label="MORPH" value={morph} field="morph" onUpdate={onUpdate} />
        )}
        <EditableRow label="BORN" value={born} field="born" onUpdate={onUpdate} />
      </div>
    </div>
  )
}

function SexLabel({ v }: { v: AnimalSex }) {
  if (v === "MALE") return <><span className="text-[5px]">♂</span> MALE</>
  if (v === "FEMALE") return <><span className="text-[5px]">♀</span> FEMALE</>
  return <>?</>
}

function SexRow({
  value,
  onUpdate,
}: {
  value: AnimalSex
  onUpdate: (field: ProfileField, value: string) => void
}) {
  const [picking, setPicking] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setPicking(true)}
        className="flex text-[7px] leading-relaxed items-center w-full text-left hover:bg-gb-dark/20 transition-colors -mx-1 px-1 rounded"
      >
        <span className="text-gb-dark w-16 shrink-0">SEX:</span>
        <span className="text-gb-light truncate flex-1"><SexLabel v={value} /></span>
      </button>

      {picking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPicking(false)}
        >
          <div
            className="w-full max-w-[200px] pixel-border bg-gb-darkest p-3 flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[7px] text-gb-lightest text-center tracking-wider border-b border-gb-dark pb-1">
              SELECT SEX
            </div>
            {SEX_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onUpdate("sex", opt)
                  setPicking(false)
                }}
                className={`w-full text-[7px] py-1 border transition-colors tracking-wider ${
                  value === opt
                    ? "border-gb-light text-gb-light bg-gb-dark/50"
                    : "border-gb-dark text-gb-dark hover:text-gb-light hover:border-gb-light"
                }`}
              >
                <SexLabel v={opt} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function StageRow({
  value,
  onUpdate,
}: {
  value: BeetleStage
  onUpdate: (field: ProfileField, value: string) => void
}) {
  const [picking, setPicking] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setPicking(true)}
        className="flex text-[7px] leading-relaxed items-center w-full text-left hover:bg-gb-dark/20 transition-colors -mx-1 px-1 rounded"
      >
        <span className="text-gb-dark w-16 shrink-0">STAGE:</span>
        <span className="text-gb-light truncate flex-1">{value}</span>
      </button>

      {picking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPicking(false)}
        >
          <div
            className="w-full max-w-[200px] pixel-border bg-gb-darkest p-3 flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[7px] text-gb-lightest text-center tracking-wider border-b border-gb-dark pb-1">
              SELECT STAGE
            </div>
            {STAGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onUpdate("stage", opt)
                  setPicking(false)
                }}
                className={`w-full text-[7px] py-1 border transition-colors tracking-wider ${
                  value === opt
                    ? "border-gb-light text-gb-light bg-gb-dark/50"
                    : "border-gb-dark text-gb-dark hover:text-gb-light hover:border-gb-light"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-[7px] leading-relaxed items-center -mx-1 px-1">
      <span className="text-gb-dark w-16 shrink-0">{label}:</span>
      <span className="text-gb-light truncate flex-1">{value}</span>
    </div>
  )
}

function EditableRow({
  label,
  value,
  field,
  onUpdate,
}: {
  label: string
  value: string
  field: ProfileField
  onUpdate: (field: ProfileField, value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    setDraft(value)
  }, [value])

  const save = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) {
      onUpdate(field, trimmed.toUpperCase())
    } else {
      setDraft(value)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex text-[7px] leading-relaxed items-center">
        <span className="text-gb-dark w-16 shrink-0">{label}:</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save()
            if (e.key === "Escape") { setDraft(value); setEditing(false) }
          }}
          className="flex-1 bg-gb-dark/40 text-gb-lightest border border-gb-light px-1 py-0 text-[7px] font-mono outline-none min-w-0"
          maxLength={20}
          aria-label={`Edit ${label.toLowerCase()}`}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex text-[7px] leading-relaxed items-center w-full text-left hover:bg-gb-dark/20 transition-colors -mx-1 px-1 rounded"
    >
      <span className="text-gb-dark w-16 shrink-0">{label}:</span>
      <span className="text-gb-light truncate flex-1">{value}</span>
    </button>
  )
}
