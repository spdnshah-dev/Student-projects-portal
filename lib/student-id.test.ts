import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COURSE_ABBREVIATIONS,
  formatStudentId,
  parseBatchDate,
  publicStudentLabel,
} from "./student-id";

test("student id format is ABBR-DDMMYYYY-NNN", () => {
  const batch = parseBatchDate("2026-01-05");
  assert.ok(batch);
  // The spec's own example: 2nd student in Gen AI & Agentic AI, batch 05 Jan 2026.
  assert.equal(formatStudentId("GEN_AI_AND_AGENTIC_AI", batch, 2), "GAAI-05012026-002");
  assert.equal(formatStudentId("DATA_SCIENCE", batch, 1), "DS-05012026-001");
  assert.equal(formatStudentId("CLOUD_AND_DEVOPS", batch, 123), "CD-05012026-123");
  assert.equal(formatStudentId("APPLIED_AI_PRACTITIONER", batch, 1000), "AAP-05012026-1000");
});

test("every course has the agreed abbreviation", () => {
  assert.deepEqual(COURSE_ABBREVIATIONS, {
    DATA_SCIENCE: "DS",
    BUSINESS_ANALYTICS_AND_DATA_ANALYTICS: "BADA",
    GEN_AI_AND_AGENTIC_AI: "GAAI",
    SOFTWARE_ENGINEERING: "SDE",
    FORWARD_DEPLOYED_ENGINEERING: "FDE",
    CLOUD_AND_DEVOPS: "CD",
    APPLIED_AI_PRACTITIONER: "AAP",
  });
});

test("batch dates parse as plain calendar days and reject bad input", () => {
  assert.equal(parseBatchDate("2026-12-31")?.toISOString(), "2026-12-31T00:00:00.000Z");
  assert.equal(parseBatchDate("2026-02-30"), null);
  assert.equal(parseBatchDate("05/01/2026"), null);
  assert.equal(parseBatchDate(""), null);
});

test("the counter must be a positive integer", () => {
  const batch = parseBatchDate("2026-01-05")!;
  assert.throws(() => formatStudentId("DATA_SCIENCE", batch, 0));
  assert.throws(() => formatStudentId("DATA_SCIENCE", batch, 1.5));
});

test("public label is the student id, never a name", () => {
  assert.equal(publicStudentLabel("GAAI-05012026-002"), "GAAI-05012026-002");
  assert.equal(publicStudentLabel(null), "Student");
  assert.equal(publicStudentLabel(""), "Student");
});
