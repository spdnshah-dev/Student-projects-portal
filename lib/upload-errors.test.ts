import { test } from "node:test";
import assert from "node:assert/strict";
import { friendlyUploadError } from "./upload-errors";

test("upload errors are translated to plain English without internal detail", () => {
  const cases: Array<[unknown, RegExp]> = [
    [new Error("Body exceeded 12mb limit"), /too large/i],
    [new Error("Upload rejected by malware scanner"), /safety scan/i],
    [new Error("fetch failed: ECONNRESET"), /connection dropped|took too long/i],
    [new Error("Vercel Blob: This store does not exist"), /storage isn't available/i],
    [new Error("Input buffer contains unsupported image format"), /couldn't read that image/i],
    [new Error("TypeError: x is not a function"), /Something went wrong/i],
    [undefined, /Something went wrong/i],
  ];
  for (const [input, expected] of cases) {
    const msg = friendlyUploadError(input);
    assert.match(msg, expected);
    // Never leak the raw internal message or stack-like detail.
    assert.doesNotMatch(msg, /store does not exist|ECONNRESET|TypeError|Body exceeded|buffer/i);
  }
});
