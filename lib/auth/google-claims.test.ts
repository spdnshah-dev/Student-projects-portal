import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeJwtPayload, validateGoogleClaims } from "./google-claims";

const CLIENT = "123-abc.apps.googleusercontent.com";
const NOW = 1_800_000_000_000;
const good = {
  iss: "https://accounts.google.com",
  aud: CLIENT,
  exp: NOW / 1000 + 300,
  nonce: "n0nce",
  sub: "1029384756",
  email: "Student@Gmail.com",
  email_verified: true,
  name: "A Student",
};
const expected = { clientId: CLIENT, nonce: "n0nce", now: NOW };

test("a valid Google id token yields the lower-cased email and sub", () => {
  const r = validateGoogleClaims(good, expected);
  assert.ok(r.ok);
  assert.equal(r.identity.email, "student@gmail.com");
  assert.equal(r.identity.sub, "1029384756");
});

test("tokens for another app, another issuer, expired, or wrong nonce are rejected", () => {
  assert.deepEqual(validateGoogleClaims({ ...good, aud: "other" }, expected), { ok: false, reason: "audience" });
  assert.deepEqual(validateGoogleClaims({ ...good, iss: "https://evil.example" }, expected), { ok: false, reason: "issuer" });
  assert.deepEqual(validateGoogleClaims({ ...good, exp: NOW / 1000 - 1 }, expected), { ok: false, reason: "expired" });
  assert.deepEqual(validateGoogleClaims({ ...good, nonce: "other" }, expected), { ok: false, reason: "nonce" });
});

test("an unverified email is never trusted", () => {
  assert.deepEqual(validateGoogleClaims({ ...good, email_verified: false }, expected), { ok: false, reason: "unverified_email" });
  assert.deepEqual(validateGoogleClaims({ ...good, email_verified: "true" }, expected), { ok: false, reason: "unverified_email" });
  const { email_verified: _v, ...missing } = good;
  void _v;
  assert.deepEqual(validateGoogleClaims(missing, expected), { ok: false, reason: "unverified_email" });
});

test("jwt payload decoding tolerates garbage", () => {
  const payload = Buffer.from(JSON.stringify(good)).toString("base64url");
  assert.deepEqual(decodeJwtPayload(`h.${payload}.s`), good);
  assert.equal(decodeJwtPayload("not-a-jwt"), null);
  assert.equal(decodeJwtPayload("a.!!!.c"), null);
  assert.deepEqual(validateGoogleClaims(null, expected), { ok: false, reason: "malformed" });
});
