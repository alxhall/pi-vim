import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveWordTextObjectRange } from "../text-objects.js";

describe("resolveWordTextObjectRange", () => {
  it("resolves an inner word on the current line", () => {
    assert.deepEqual(resolveWordTextObjectRange("foo bar", 0, 1, "i"), {
      startAbs: 0,
      endAbs: 3,
    });
  });

  it("prefers trailing whitespace for aw", () => {
    assert.deepEqual(resolveWordTextObjectRange("foo bar", 10, 1, "a"), {
      startAbs: 10,
      endAbs: 14,
    });
  });

  it("includes leading whitespace for aw when no trailing whitespace exists", () => {
    assert.deepEqual(resolveWordTextObjectRange("foo bar", 0, 5, "a"), {
      startAbs: 3,
      endAbs: 7,
    });
  });

  it("chooses the next word from whitespace, or the previous word when there is no next word", () => {
    assert.deepEqual(resolveWordTextObjectRange("foo   bar", 0, 3, "i"), {
      startAbs: 6,
      endAbs: 9,
    });
    assert.deepEqual(resolveWordTextObjectRange("foo   ", 0, 4, "i"), {
      startAbs: 0,
      endAbs: 3,
    });
  });

  it("includes intervening whitespace for counted inner word objects", () => {
    assert.deepEqual(resolveWordTextObjectRange("foo bar baz", 0, 1, "i", 2), {
      startAbs: 0,
      endAbs: 7,
    });
  });

  it("uses contiguous non-whitespace runs for WORD semantics", () => {
    assert.deepEqual(resolveWordTextObjectRange("path/to-file", 0, 5, "i", 1, "WORD"), {
      startAbs: 0,
      endAbs: 12,
    });
  });

  it("does not cross newline boundaries", () => {
    assert.deepEqual(resolveWordTextObjectRange("foo\nbar", 0, 1, "i", 2), {
      startAbs: 0,
      endAbs: 3,
    });
  });

  it("returns null for empty or whitespace-only lines", () => {
    assert.equal(resolveWordTextObjectRange("", 0, 0, "i"), null);
    assert.equal(resolveWordTextObjectRange("   ", 0, 1, "a"), null);
  });
});
