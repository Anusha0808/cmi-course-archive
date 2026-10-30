import { describe, expect, it } from "vitest";
import { ADDITIONAL_COURSES, COURSE_CORRECTIONS } from "@/lib/course-catalogue";

describe("Official CMI catalogue classification", () => {
  it("places the MSc Data Science analysis course in Data Science", () => {
    expect(COURSE_CORRECTIONS.find(c => c.code === "MMA")?.subject).toBe("Data Science");
  });
  it("places the MSc CS mathematical toolkit in Computer Science", () => {
    expect(COURSE_CORRECTIONS.find(c => c.code === "GMT1")?.subject).toBe("Computer Science");
  });
  it("places the MSc Data Science Python and SQL courses in Data Science", () => {
    expect(COURSE_CORRECTIONS.filter(c => ["PDSP", "RDBM"].includes(c.code)).map(c => c.subject)).toEqual(["Data Science", "Data Science"]);
  });
  it("includes the missing undergraduate second-semester core courses", () => {
    const names = ADDITIONAL_COURSES.map(c => c[1]);
    for (const name of ["Algebra II", "Calculus I", "Probability Theory", "Advanced Programming", "Discrete Mathematics", "Classical Mechanics II", "Electrodynamics I"]) expect(names).toContain(name);
  });
  it("keeps catalogue abbreviations unique and omits generic elective slots", () => {
    const codes = ADDITIONAL_COURSES.map(c => c[0]);
    expect(new Set(codes).size).toBe(codes.length);
    expect(ADDITIONAL_COURSES.some(c => /^Elective [IVX\d]+$/.test(c[1]))).toBe(false);
  });
});