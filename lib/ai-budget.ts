/**
 * Monthly AI spend cap — the safety valve. When the month's assistant usage
 * reaches the cap, the assistant says it is temporarily unavailable rather than
 * overspending. Real cost tracking is wired in the rate-limits milestone; for
 * now this reads a simple monthly message count against a generous ceiling so
 * the hook and the "temporarily unavailable" path already exist.
 */
import { prisma } from "@/lib/prisma";

export async function withinMonthlyCap(): Promise<boolean> {
  // A rough proxy until real spend tracking lands: assistant messages this
  // month vs. a high ceiling derived from the configured USD cap.
  const capUsd = Number(process.env.AI_MONTHLY_SPEND_CAP_USD ?? 200);
  const approxMessagesPerUsd = 400; // placeholder ratio, tuned in config later
  const ceiling = Math.max(1000, Math.floor(capUsd * approxMessagesPerUsd));

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const used = await prisma.aiMessage.count({
    where: { role: "ASSISTANT", createdAt: { gte: startOfMonth } },
  });
  return used < ceiling;
}
