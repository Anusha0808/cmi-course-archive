import { describe, expect, it } from "vitest";
import { coursePage, filterCourses } from "@/lib/course-browser";

const courses = [
  { id: "math", code: "ALG1", name: "Algebra I", subject: "Mathematics" },
  { id: "cs", code: "ALGO", name: "Design & Analysis of Algorithms", subject: "Computer Science" },
  { id: "ds", code: "FML", name: "Foundations of ML", subject: "Data Science" },
  { id: "misc", code: "MISC", name: "Miscellaneous", subject: "Miscellaneous" },
];

describe("Course browsing", () => {
  it("keeps Computer Science separate from Data Science", () => {
    expect(filterCourses(courses, "Computer Science", "", false, {}).map(c => c.code)).toEqual(["ALGO"]);
    expect(filterCourses(courses, "Data Science", "", false, {}).map(c => c.code)).toEqual(["FML"]);
  });
  it("excludes the reserved miscellaneous container", () => {
    expect(filterCourses(courses, "all", "", false, {}).map(c => c.code)).not.toContain("MISC");
  });
  it("searches names and short forms case-insensitively", () => {
    expect(filterCourses(courses, "all", " fml ", false, {}).map(c => c.id)).toEqual(["ds"]);
    expect(filterCourses(courses, "all", "algorithms", false, {}).map(c => c.id)).toEqual(["cs"]);
  });
  it("shows only courses with approved notes when requested", () => {
    expect(filterCourses(courses, "all", "", true, { math: 2, cs: 0 }).map(c => c.id)).toEqual(["math"]);
  });
  it("paginates and clamps the page after filtering", () => {
    const rows = Array.from({ length: 25 }, (_, i) => i);
    expect(coursePage(rows, 1).items).toEqual(rows.slice(0, 12));
    expect(coursePage(rows, 2).items).toEqual(rows.slice(12, 24));
    expect(coursePage(rows, 99)).toEqual({ page: 3, pages: 3, items: [24] });
    expect(coursePage([], 2)).toEqual({ page: 1, pages: 1, items: [] });
  });
});