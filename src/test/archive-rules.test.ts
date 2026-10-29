import { describe, expect, it } from "vitest";
import { emailAllowed, verifiedModerator, parseTags } from "@/lib/archive-rules";

describe("Archive account rules", () => {
  it("accepts the exact CMI domain", () => {
    expect(emailAllowed("student@cmi.ac.in")).toBe(true);
    expect(emailAllowed("student@students.cmi.ac.in")).toBe(false);
    expect(emailAllowed("student@cmi.ac.in.evil.com")).toBe(false);
    expect(emailAllowed("student@gmail.com")).toBe(false);
  });
  it("allows only the designated Gmail exception", () => {
    expect(emailAllowed("anuzrella@gmail.com")).toBe(true);
    expect(emailAllowed("other@gmail.com")).toBe(false);
  });
  it("requires verified ownership for moderator access", () => {
    expect(verifiedModerator("anuzrella@gmail.com", false)).toBe(false);
    expect(verifiedModerator("anuzrella@gmail.com", true)).toBe(true);
    expect(verifiedModerator("student@cmi.ac.in", true)).toBe(false);
  });
  it("normalizes and deduplicates miscellaneous tags", () => {
    expect(parseTags(" Algebra, algebra, study group, ")).toEqual(["algebra", "study group"]);
  });
});