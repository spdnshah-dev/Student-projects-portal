import type { ItemState } from "@prisma/client";

/**
 * The shared lifecycle for projects and profiles, as a pure transition table.
 *
 *   DRAFT ──submit──▶ IN_REVIEW ──approve──▶ PUBLISHED
 *                      │  ▲                     │  ▲
 *               send back│  │resubmit    student edits│  │approve (replaces old)
 *                      ▼  │                     ▼  │
 *                 CHANGES_NEEDED        CHANGES_IN_REVIEW
 *                                              │ (send back ▶ CHANGES_NEEDED)
 *   PUBLISHED ──take down / disabled──▶ UNPUBLISHED ──restore──▶ PUBLISHED
 *
 * No prisma imports here on purpose — this file is pure and unit-tested.
 */

export type LifecycleEvent =
  | "SUBMIT" // student submits a draft / resubmits a sent-back item
  | "EDIT_PUBLISHED" // student edits a live item (old version stays public)
  | "APPROVE" // admin approves the pending version
  | "SEND_BACK" // admin sends it back with a note
  | "TAKE_DOWN" // admin unpublishes a live item
  | "RESTORE"; // admin republishes an unpublished item

type Rule = { from: readonly ItemState[]; to: ItemState };

export const TRANSITIONS: Record<LifecycleEvent, Rule> = {
  SUBMIT: { from: ["DRAFT", "CHANGES_NEEDED"], to: "IN_REVIEW" },
  EDIT_PUBLISHED: { from: ["PUBLISHED"], to: "CHANGES_IN_REVIEW" },
  APPROVE: { from: ["IN_REVIEW", "CHANGES_IN_REVIEW"], to: "PUBLISHED" },
  SEND_BACK: { from: ["IN_REVIEW", "CHANGES_IN_REVIEW"], to: "CHANGES_NEEDED" },
  TAKE_DOWN: { from: ["PUBLISHED"], to: "UNPUBLISHED" },
  RESTORE: { from: ["UNPUBLISHED"], to: "PUBLISHED" },
};

export class LifecycleError extends Error {
  constructor(event: LifecycleEvent, from: ItemState) {
    super(`Cannot ${event} from state ${from}.`);
    this.name = "LifecycleError";
  }
}

export function canApply(event: LifecycleEvent, from: ItemState): boolean {
  return TRANSITIONS[event].from.includes(from);
}

/** The resulting state for an event, or throw LifecycleError if not allowed. */
export function nextState(event: LifecycleEvent, from: ItemState): ItemState {
  if (!canApply(event, from)) throw new LifecycleError(event, from);
  return TRANSITIONS[event].to;
}

/** Which states the public may ever see (only the published one). */
export const PUBLIC_STATES: readonly ItemState[] = ["PUBLISHED"];

/** States hidden from the public (everything but PUBLISHED). */
export function isHiddenState(state: ItemState): boolean {
  return !PUBLIC_STATES.includes(state);
}
