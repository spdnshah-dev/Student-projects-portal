/**
 * Minimal Gemini REST client (no SDK dependency). Used for embeddings (the
 * assistant's search vectors) and for writing answers. The API key is read from
 * the environment and must never be exposed to the browser.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("The assistant is not configured (GEMINI_API_KEY is unset).");
    this.name = "AiNotConfiguredError";
  }
}

export function aiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function key(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new AiNotConfiguredError();
  return k;
}

function embeddingModel(): string {
  return process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
}
function chatModel(): string {
  return process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash";
}

/** Embed one piece of text → a 768-dim vector (text-embedding-004). */
export async function embedText(text: string): Promise<number[]> {
  const model = embeddingModel();
  const res = await fetch(
    `${BASE}/models/${model}:embedContent?key=${key()}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text: text.slice(0, 8000) }] },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini embed failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!values || values.length === 0) throw new Error("Gemini embed: empty result");
  return values;
}

export type ChatTurn = { role: "user" | "model"; text: string };

/**
 * Generate an answer. `system` holds the instructions and the retrieved
 * reference material (kept separate from the user's turns). Returns plain text.
 */
export async function generateAnswer(
  system: string,
  turns: ChatTurn[],
): Promise<string> {
  const model = chatModel();
  const res = await fetch(
    `${BASE}/models/${model}:generateContent?key=${key()}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({
          role: t.role,
          parts: [{ text: t.text }],
        })),
        generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini generate failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";
  return text.trim();
}
