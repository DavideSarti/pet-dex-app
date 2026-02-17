import { createGoogleGenerativeAI } from "@ai-sdk/google"
import {
  consumeStream,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai"

export const maxDuration = 30

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
})

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  if (!apiKey) {
    return new Response(
      "GOOGLE_GENERATIVE_AI_API_KEY is missing or empty. Add your key to .env.local then restart the dev server.",
      { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    )
  }

  const {
    messages,
    animalsData,
  }: { messages: UIMessage[]; animalsData?: Record<string, unknown>[] } =
    await req.json()

  let animalsContext = ""
  if (Array.isArray(animalsData) && animalsData.length > 0) {
    animalsContext = `
CURRENT PET COLLECTION (${animalsData.length} animals):
${animalsData
  .map((a, i) => {
    const lines = [`--- ANIMAL #${i + 1} ---`]
    lines.push(`  Name: ${a.name}`)
    lines.push(`  Species: ${a.species}`)
    if (a.breed) lines.push(`  Breed: ${a.breed}`)
    if (a.morph) lines.push(`  Morph: ${a.morph}`)
    lines.push(`  Sex: ${a.sex}`)
    lines.push(`  Born: ${a.born}`)
    lines.push(`  Weight: ${a.weight}${a.species === "DOG" ? "kg" : "g"}`)
    if (a.lastFeed) lines.push(`  Last Fed: ${a.lastFeed}`)
    if (a.lastShed) lines.push(`  Last Shed: ${a.lastShed}`)
    if (a.stage) lines.push(`  Stage: ${a.stage}`)
    if (a.substrate) lines.push(`  Substrate: ${a.substrate}`)
    if (a.lastVetCheckup) lines.push(`  Last Vet Checkup: ${a.lastVetCheckup}`)
    if (a.nextVaccination) lines.push(`  Next Vaccination: ${a.nextVaccination}`)
    if (Array.isArray(a.healthLog) && (a.healthLog as Array<{ text: string }>).length > 0) {
      lines.push(`  Health Log:`)
      ;(a.healthLog as Array<{ text: string }>).forEach((e) => lines.push(`    > ${e.text}`))
    }
    if (Array.isArray(a.prescriptions) && (a.prescriptions as Array<{ medName: string; completed: boolean }>).length > 0) {
      lines.push(`  Active Prescriptions:`)
      ;(a.prescriptions as Array<{ medName: string; completed: boolean; dosesGiven: string[]; totalDays: number }>).forEach((rx) => {
        const status = rx.completed ? "COMPLETE" : `${rx.dosesGiven.length}/${rx.totalDays} doses`
        lines.push(`    > ${rx.medName}: ${status}`)
      })
    }
    return lines.join("\n")
  })
  .join("\n\n")}
`
  }

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: `You are PET-AI, an expert veterinary assistant for exotic pets and dogs. You speak in a concise, retro 8-bit style — short sentences, helpful and direct. You have deep knowledge about:

- Leopard gecko husbandry (temperature, humidity, substrate, hides, feeding, shedding, morphs)
- Rhino beetle care (substrate, stages, feeding, temperature)
- Dog care (health, vaccinations, feeding, weight management, breeds)
- Common health issues for all these species
- Weight and growth charts
- Medications and prescriptions

You have access to the user's COMPLETE pet collection data. When the user asks questions like "which animal weighs the most?", "who was last fed?", "show me all health issues", "how many geckos do I have?", etc. — you can search through ALL the data and give precise answers.

When answering questions, ALWAYS reference specific animal names and data. For example, if asked "are my pets healthy?", check weights, feeding dates, health logs, and prescriptions for EACH animal and give a summary.

Keep answers SHORT (2-5 sentences max) unless the user asks for detail. Use CAPS for emphasis like a retro game. Never use markdown formatting — plain text only.

${animalsContext}`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
