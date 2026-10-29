import { test } from "node:test";
import assert from "node:assert/strict";
import { PUBLIC_USER_SELECT } from "./public";

// Every public query loads the student's account through this one select, so
// the keys here are the complete list of account fields a visitor can ever see.
test("public queries expose only the Student ID from a student's account", () => {
  assert.deepEqual(Object.keys(PUBLIC_USER_SELECT), ["studentId"]);
  assert.equal("name" in PUBLIC_USER_SELECT, false);
  assert.equal("email" in PUBLIC_USER_SELECT, false);
});
