import { test } from "node:test";
import assert from "node:assert/strict";
import { DENIAL_MESSAGES, isGmailAddress, studentSignInDecision } from "./student-gate";

const SUB = "1029384756";

test("a gmail that no admin added is refused and nothing is created", () => {
  assert.deepEqual(studentSignInDecision(null, SUB), { allow: false, reason: "not_registered" });
  assert.equal(
    DENIAL_MESSAGES.not_registered,
    "Your email isn't registered. Ask your Learnbay admin to add you.",
  );
});

test("staff emails cannot use Google sign-in", () => {
  for (const role of ["ADMIN", "SUPER_ADMIN"] as const) {
    assert.deepEqual(
      studentSignInDecision({ role, status: "ACTIVE", googleSub: null }, SUB),
      { allow: false, reason: "not_registered" },
    );
  }
});

test("a disabled student is refused with the disabled message", () => {
  assert.deepEqual(
    studentSignInDecision({ role: "STUDENT", status: "DISABLED", googleSub: SUB }, SUB),
    { allow: false, reason: "disabled" },
  );
});

test("first sign-in links the Google account; later sign-ins must use the same one", () => {
  assert.deepEqual(
    studentSignInDecision({ role: "STUDENT", status: "ACTIVE", googleSub: null }, SUB),
    { allow: true, linkSub: true },
  );
  assert.deepEqual(
    studentSignInDecision({ role: "STUDENT", status: "ACTIVE", googleSub: SUB }, SUB),
    { allow: true, linkSub: false },
  );
  assert.deepEqual(
    studentSignInDecision({ role: "STUDENT", status: "ACTIVE", googleSub: "other" }, SUB),
    { allow: false, reason: "mismatch" },
  );
});

test("only @gmail.com addresses can be added as students", () => {
  assert.equal(isGmailAddress("priya.sharma@gmail.com"), true);
  assert.equal(isGmailAddress("Priya@GMAIL.COM"), true);
  assert.equal(isGmailAddress("priya@learnbay.co"), false);
  assert.equal(isGmailAddress("priya@gmail.com.evil.io"), false);
  assert.equal(isGmailAddress("priya@googlemail.com"), false);
});
