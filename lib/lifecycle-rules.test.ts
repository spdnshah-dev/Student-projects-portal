import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LifecycleError,
  canApply,
  isHiddenState,
  nextState,
} from "./lifecycle-rules";

test("submit moves a draft or sent-back item into review", () => {
  assert.equal(nextState("SUBMIT", "DRAFT"), "IN_REVIEW");
  assert.equal(nextState("SUBMIT", "CHANGES_NEEDED"), "IN_REVIEW");
});

test("approve publishes from either review state", () => {
  assert.equal(nextState("APPROVE", "IN_REVIEW"), "PUBLISHED");
  assert.equal(nextState("APPROVE", "CHANGES_IN_REVIEW"), "PUBLISHED");
});

test("send back goes to changes needed from either review state", () => {
  assert.equal(nextState("SEND_BACK", "IN_REVIEW"), "CHANGES_NEEDED");
  assert.equal(nextState("SEND_BACK", "CHANGES_IN_REVIEW"), "CHANGES_NEEDED");
});

test("editing a published item opens changes-in-review", () => {
  assert.equal(nextState("EDIT_PUBLISHED", "PUBLISHED"), "CHANGES_IN_REVIEW");
});

test("take down / restore toggle published and unpublished", () => {
  assert.equal(nextState("TAKE_DOWN", "PUBLISHED"), "UNPUBLISHED");
  assert.equal(nextState("RESTORE", "UNPUBLISHED"), "PUBLISHED");
});

test("illegal transitions are rejected", () => {
  assert.equal(canApply("APPROVE", "DRAFT"), false);
  assert.equal(canApply("SUBMIT", "PUBLISHED"), false);
  assert.equal(canApply("TAKE_DOWN", "DRAFT"), false);
  assert.throws(() => nextState("APPROVE", "DRAFT"), LifecycleError);
});

test("only PUBLISHED is visible to the public", () => {
  assert.equal(isHiddenState("PUBLISHED"), false);
  for (const s of [
    "DRAFT",
    "IN_REVIEW",
    "CHANGES_NEEDED",
    "CHANGES_IN_REVIEW",
    "UNPUBLISHED",
  ] as const) {
    assert.equal(isHiddenState(s), true);
  }
});
