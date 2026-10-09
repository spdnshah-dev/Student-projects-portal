import { randomUUID } from "crypto";
import type { EmbeddingSourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/gemini";
import { CATEGORY_LABELS, COURSE_COMPLETED_LABELS, DOMAIN_LABELS } from "@/lib/constants";

/**
 * The vector pipeline. When a profile or project is approved its text is split
 * into chunks and embedded into pgvector; when it's taken down the vectors are
 * removed. Retrieval returns the closest chunks for a question.
 *
 * All student-entered text here is DATA for retrieval — it is never treated as
 * instructions (see lib/assistant.ts for how the prompt keeps them separate).
 */

const CHUNK_TARGET = 700; // characters

function chunk(text: string): string[] {
  const clean = text.replace(/\s+\n/g, "\n").trim();
  if (!clean) return [];
  const paras = clean.split(/\n{2,}/).flatMap((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let buf = "";
  for (const para of paras) {
    if ((buf + "\n\n" + para).length > CHUNK_TARGET && buf) {
      out.push(buf.trim());
      buf = "";
    }
    if (para.length > CHUNK_TARGET) {
      // hard-split an over-long paragraph
      for (let i = 0; i < para.length; i += CHUNK_TARGET) {
        out.push(para.slice(i, i + CHUNK_TARGET));
      }
    } else {
      buf = buf ? `${buf}\n\n${para}` : para;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

async function replaceSource(
  type: EmbeddingSourceType,
  id: string,
  chunks: string[],
): Promise<void> {
  await prisma.$executeRaw`DELETE FROM embeddings WHERE source_type = ${type}::"EmbeddingSourceType" AND source_id = ${id}`;
  for (const text of chunks) {
    if (!text.trim()) continue;
    const vec = await embedText(text);
    const literal = `[${vec.join(",")}]`;
    await prisma.$executeRaw`
      INSERT INTO embeddings (id, source_type, source_id, chunk_text, embedding, created_at)
      VALUES (${randomUUID()}, ${type}::"EmbeddingSourceType", ${id}, ${text}, ${literal}::vector, now())`;
  }
}

export async function removeSource(
  type: EmbeddingSourceType,
  id: string,
): Promise<void> {
  await prisma.$executeRaw`DELETE FROM embeddings WHERE source_type = ${type}::"EmbeddingSourceType" AND source_id = ${id}`;
}

export async function reindexProfile(profileId: string): Promise<void> {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: profileId },
    include: { user: true, certificates: true },
  });
  if (!profile) return;
  const name = profile.user.name ?? "A Learnbay student";
  const parts: string[] = [];
  parts.push(`Student: ${name}.`);
  if (profile.headline) parts.push(profile.headline);
  if (profile.yearsExperience != null)
    parts.push(`${profile.yearsExperience} years of experience.`);
  if (profile.domain) parts.push(`Works in ${DOMAIN_LABELS[profile.domain]}.`);
  if (profile.courseCompleted)
    parts.push(`Completed the ${COURSE_COMPLETED_LABELS[profile.courseCompleted]} course at Learnbay.`);
  if (profile.about) parts.push(profile.about);
  if (profile.certificates.length) {
    parts.push(
      "Certificates: " +
        profile.certificates
          .map((c) => (c.issuer ? `${c.name} (${c.issuer})` : c.name))
          .join(", ") +
        ".",
    );
  }
  await replaceSource("PROFILE", profileId, chunk(parts.join("\n\n")));
}

export async function reindexProject(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { profile: { include: { user: true } } },
  });
  if (!project) return;
  const name = project.profile.user.name ?? "A Learnbay student";
  const parts: string[] = [
    `Project: ${project.title}, by ${name}.`,
    `Category: ${CATEGORY_LABELS[project.category]}. Domain: ${DOMAIN_LABELS[project.domain]}.`,
    project.description,
  ];
  if (project.toolsText.trim()) parts.push(`Tools and frameworks: ${project.toolsText}.`);
  await replaceSource("PROJECT", projectId, chunk(parts.join("\n\n")));
}

/** Re-embed every currently public profile and project (initial build / repair). */
export async function rebuildAllEmbeddings(): Promise<{
  profiles: number;
  projects: number;
}> {
  const profiles = await prisma.studentProfile.findMany({
    where: { state: "PUBLISHED", approvedVersionId: { not: null } },
    select: { id: true },
  });
  for (const p of profiles) await reindexProfile(p.id);

  const projects = await prisma.project.findMany({
    where: { state: "PUBLISHED", approvedVersionId: { not: null } },
    select: { id: true },
  });
  for (const p of projects) await reindexProject(p.id);

  return { profiles: profiles.length, projects: projects.length };
}

export type RetrievedChunk = {
  sourceType: EmbeddingSourceType;
  sourceId: string;
  chunkText: string;
  score: number;
};

/** Nearest chunks to a query vector (cosine). Caller filters to public sources. */
export async function retrieve(
  queryVec: number[],
  k: number,
): Promise<RetrievedChunk[]> {
  const literal = `[${queryVec.join(",")}]`;
  const rows = await prisma.$queryRaw<
    { source_type: EmbeddingSourceType; source_id: string; chunk_text: string; score: number }[]
  >`
    SELECT source_type, source_id, chunk_text, 1 - (embedding <=> ${literal}::vector) AS score
    FROM embeddings
    ORDER BY embedding <=> ${literal}::vector
    LIMIT ${k}`;
  return rows.map((r) => ({
    sourceType: r.source_type,
    sourceId: r.source_id,
    chunkText: r.chunk_text,
    score: Number(r.score),
  }));
}
