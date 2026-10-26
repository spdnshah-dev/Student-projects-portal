import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canRevealContact,
  linkedInLookupStatus,
  stripPrivateContact,
} from "./contact-privacy";

const URL = "https://www.linkedin.com/in/riya-sharma";

const profile = {
  id: "p1",
  headline: "Data Scientist",
  linkedinUrl: URL,
  user: { name: "Riya Sharma", email: "riya@example.com" },
};

test("only a signed-in recruiter may see private contact details", () => {
  assert.equal(canRevealContact(null), false); // logged-out visitor
  assert.equal(canRevealContact(undefined), false);
  assert.equal(canRevealContact({ role: "STUDENT" }), false);
  assert.equal(canRevealContact({ role: "ADMIN" }), false);
  assert.equal(canRevealContact({ role: "SUPER_ADMIN" }), false);
  assert.equal(canRevealContact({ role: "RECRUITER" }), true);
});

test("student payload contains no linkedinUrl or email for a non-recruiter", () => {
  for (const viewer of [null, { role: "STUDENT" as const }, { role: "ADMIN" as const }]) {
    const out = stripPrivateContact(profile, viewer);
    assert.equal("linkedinUrl" in out, false, "linkedinUrl must be absent");
    assert.equal(out.user && "email" in out.user, false, "email must be absent");
    assert.equal(JSON.stringify(out).includes(URL), false);
    assert.equal(JSON.stringify(out).includes("riya@example.com"), false);
    // Non-private fields survive untouched.
    assert.equal(out.headline, "Data Scientist");
    assert.equal(out.user?.name, "Riya Sharma");
  }
});

test("student payload keeps linkedinUrl for a recruiter", () => {
  const out = stripPrivateContact(profile, { role: "RECRUITER" });
  assert.equal(out.linkedinUrl, URL);
});

test("linkedin endpoint: 404 for anonymous, student and admin; 200 for recruiter", () => {
  assert.equal(linkedInLookupStatus(null, URL), 404); // anonymous visitor
  assert.equal(linkedInLookupStatus({ role: "STUDENT" }, URL), 404);
  assert.equal(linkedInLookupStatus({ role: "ADMIN" }, URL), 404);
  assert.equal(linkedInLookupStatus({ role: "SUPER_ADMIN" }, URL), 404);
  assert.equal(linkedInLookupStatus({ role: "RECRUITER" }, URL), 200);
});

test("linkedin endpoint: 404 even for a recruiter when the student has no URL", () => {
  assert.equal(linkedInLookupStatus({ role: "RECRUITER" }, null), 404);
  assert.equal(linkedInLookupStatus({ role: "RECRUITER" }, ""), 404);
  assert.equal(linkedInLookupStatus({ role: "RECRUITER" }, "   "), 404);
});
