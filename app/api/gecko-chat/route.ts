import { createOpenAI } from "@ai-sdk/openai"
import {
  consumeStream,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai"

export const maxDuration = 30

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" })

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return new Response(
      "OPENAI_API_KEY is missing or empty. Add your key to .env.local (one line: OPENAI_API_KEY=sk-proj-your-key) then restart the dev server.",
      { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    )
  }

  const { messages, geckoData }: { messages: UIMessage[]; geckoData?: Record<string, unknown> } =
    await req.json()

  const geckoContext = geckoData
    ? `
CURRENT GECKO DATA:
- Name: ${geckoData.name}
- Morph: ${geckoData.morph}
- Born: ${geckoData.born}
- Current Weight: ${geckoData.weight}g
- Last Feed: ${geckoData.lastFeed}
- Last Shed: ${geckoData.lastShed}
- Health Log:
${Array.isArray(geckoData.healthLog) ? (geckoData.healthLog as Array<{ text: string }>).map((e) => `  > ${e.text}`).join("\n") : "No records"}
`
    : ""

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are GECKO-AI, an expert veterinary assistant specializing in leopard geckos. You speak in a concise, retro 8-bit style — short sentences, helpful and direct. You have deep knowledge about:

- Leopard gecko husbandry (temperature, humidity, substrate, hides)
- Feeding (mealworms, crickets, dubia roaches, supplements, calcium, D3)
- Shedding cycles and problems (stuck shed, humidity tips)
- Common health issues (metabolic bone disease, impaction, respiratory infections, parasites, eye problems)
- Weight and growth charts for leopard geckos by age
- Morph genetics and characteristics

You also have access to the user's specific gecko data and health history. When answering questions, reference this specific data when relevant. For example, if asked "is my gecko healthy?", check the weight against typical ranges for the gecko's age, review the health log for concerns, etc.

Keep answers SHORT (2-4 sentences max) unless the user asks for detail. Use CAPS for emphasis like a retro game. Never use markdown formatting — plain text only.

${geckoContext}`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
