import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { answerQuestion, getOrCreateSession } from "@/lib/assistant";

const COOKIE = "lb_ai";
const MAX_LEN = 1000;

// The public assistant. Read-only: it can only answer, never change data.
// Per-IP / per-minute / per-day rate limits are added in the rate-limits
// milestone; the monthly spend cap is already enforced in answerQuestion.
export async function POST(req: Request) {
  let message = "";
  try {
    const body = await req.json();
    message = String(body?.message ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Type a question first." }, { status: 400 });
  }
  if (message.length > MAX_LEN) message = message.slice(0, MAX_LEN);

  const store = await cookies();
  const session = await getOrCreateSession(store.get(COOKIE)?.value);

  const replies = await answerQuestion(session, message);

  const res = NextResponse.json({
    replies,
    visitorType: session.visitorType,
  });
  res.cookies.set(COOKIE, session.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
