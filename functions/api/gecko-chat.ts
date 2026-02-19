interface Env {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
}

function buildSystemPrompt(animalsData?: Record<string, unknown>[]): string {
  let animalsContext = "";
  if (Array.isArray(animalsData) && animalsData.length > 0) {
    animalsContext = `\nCURRENT PET COLLECTION (${animalsData.length} animals):\n${animalsData
      .map((a, i) => {
        const lines = [`--- ANIMAL #${i + 1} ---`];
        lines.push(`  Name: ${a.name}`);
        lines.push(`  Species: ${a.species}`);
        if (a.morph) lines.push(`  Morph: ${a.morph}`);
        lines.push(`  Sex: ${a.sex}`);
        lines.push(`  Born: ${a.born}`);
        lines.push(`  Weight: ${a.weight}g`);
        if (a.lastFeed) lines.push(`  Last Fed: ${a.lastFeed}`);
        if (a.lastShed) lines.push(`  Last Shed: ${a.lastShed}`);
        if (a.lastWaterChange) lines.push(`  Last Water Change: ${a.lastWaterChange}`);
        if (a.stage) lines.push(`  Stage: ${a.stage}`);
        if (a.substrate) lines.push(`  Substrate: ${a.substrate}`);
        if (Array.isArray(a.healthLog) && (a.healthLog as Array<{ text: string }>).length > 0) {
          lines.push(`  Health Log:`);
          (a.healthLog as Array<{ text: string }>).forEach((e: { text: string }) => lines.push(`    > ${e.text}`));
        }
        return lines.join("\n");
      })
      .join("\n\n")}\n`;
  }

  return `You are HERP-AI, a friendly and knowledgeable veterinary assistant for exotic pets. You speak in a concise, warm style. You have deep knowledge about leopard geckos and rhino beetles. Keep answers SHORT (2-5 sentences max). Write in normal case (not all caps). Be friendly. Never use markdown formatting.

Important care facts you must know:
- Leopard geckos NEED a shallow water dish in their enclosure at all times. Fresh, clean water should be available daily. The water bowl should be changed regularly (every 1-2 days) to prevent bacteria buildup. This app tracks water changes for this reason.
- Leopard geckos also benefit from a moist hide to aid shedding.

${animalsContext}`;
}

const MAX_BODY_SIZE = 100_000;
const MAX_MESSAGES = 50;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) {
    return new Response("GOOGLE_GENERATIVE_AI_API_KEY is missing. Set it in Cloudflare Pages environment variables.", {
      status: 401,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const rawBody = await context.request.text();
  if (rawBody.length > MAX_BODY_SIZE) {
    return new Response("Request too large.", { status: 413 });
  }

  const body = JSON.parse(rawBody) as {
    messages: Array<{ role: string; content: string }>;
    animalsData?: Record<string, unknown>[];
  };

  if (Array.isArray(body.messages) && body.messages.length > MAX_MESSAGES) {
    body.messages = body.messages.slice(-MAX_MESSAGES);
  }

  const systemPrompt = buildSystemPrompt(body.animalsData);

  const geminiContents = body.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}&alt=sse`;

  const geminiRes = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
    }),
  });

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    return new Response(`Gemini API error: ${errText}`, { status: geminiRes.status });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const streamPromise = (async () => {
    const reader = geminiRes.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          } catch {}
        }
      }
    } finally {
      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close();
    }
  })();

  context.waitUntil(streamPromise);

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
