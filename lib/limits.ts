// Rate-limit numbers live in configuration so they can be tuned without a code
// change. All are "per window"; windows are fixed (per minute / per day).

function num(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const LIMITS = {
  aiPerMinute: num("RATE_LIMIT_AI_PER_MINUTE", 5),
  aiPerDay: num("RATE_LIMIT_AI_PER_DAY", 50),
  formPerMinute: num("RATE_LIMIT_FORM_PER_MINUTE", 10),
  loginPerMinute: num("RATE_LIMIT_LOGIN_PER_MINUTE", 8),
  checkPerMinute: num("RATE_LIMIT_CHECK_PER_MINUTE", 20),
};

export const MINUTE = 60;
export const DAY = 60 * 60 * 24;
