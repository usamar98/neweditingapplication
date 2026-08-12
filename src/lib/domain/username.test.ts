import { describe, expect, it } from "vitest";
import { isValidUsername, normalizeUsername } from "./username";

describe("username rules", () => {
  it("normalizes surrounding whitespace and uppercase characters", () => {
    expect(normalizeUsername("  Ada_Creates  ")).toBe("ada_creates");
  });

  it.each(["ada", "ada_creates", "creator_2026", "abc123"])("accepts %s", (username) => {
    expect(isValidUsername(username)).toBe(true);
  });

  it.each(["ab", "contains-dash", "contains space", "a".repeat(31), ""])("rejects %s", (username) => {
    expect(isValidUsername(username)).toBe(false);
  });
});
