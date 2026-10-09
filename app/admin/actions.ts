"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import {
  approveProfile,
  approveProject,
  sendBackProfile,
  sendBackProject,
  takeDownProject,
} from "@/lib/lifecycle";
import { LifecycleError } from "@/lib/lifecycle-rules";

export type ActionResult = { ok: true } | { error: string };

function fail(e: unknown): ActionResult {
  if (e instanceof LifecycleError) return { error: e.message };
  return { error: "Something went wrong. Please refresh and try again." };
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/queue");
  revalidatePath("/admin/profiles");
}

export async function approveProjectAction(id: string): Promise<ActionResult> {
  const admin = await requireRole(ADMIN_ROLES);
  try {
    await approveProject(id, admin.id);
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function sendBackProjectAction(
  id: string,
  note: string,
): Promise<ActionResult> {
  const admin = await requireRole(ADMIN_ROLES);
  if (!note.trim()) return { error: "Write a note telling the student what to fix." };
  try {
    await sendBackProject(id, admin.id, note.trim());
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function takeDownProjectAction(
  id: string,
  note?: string,
): Promise<ActionResult> {
  const admin = await requireRole(ADMIN_ROLES);
  try {
    await takeDownProject(id, admin.id, note?.trim() || undefined);
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function approveProfileAction(id: string): Promise<ActionResult> {
  const admin = await requireRole(ADMIN_ROLES);
  try {
    await approveProfile(id, admin.id);
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function sendBackProfileAction(
  id: string,
  note: string,
): Promise<ActionResult> {
  const admin = await requireRole(ADMIN_ROLES);
  if (!note.trim()) return { error: "Write a note telling the student what to fix." };
  try {
    await sendBackProfile(id, admin.id, note.trim());
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
