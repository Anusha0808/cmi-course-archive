export const COURSE_SUBJECTS = ["Mathematics", "Computer Science", "Data Science", "Physics", "Humanities & Languages"] as const;
export const COURSES_PER_PAGE = 12;
export const DEFAULT_NOTES_ONLY = true;

type BrowsableCourse = { id: string; code: string; name: string; subject: string };

export function filterCourses<T extends BrowsableCourse>(courses: T[], subject: string, search: string, notesOnly: boolean, counts: Record<string, number>) {
  const term = search.trim().toLowerCase();
  return courses.filter((course) => course.code !== "MISC"
    && (subject === "all" || course.subject === subject)
    && (!term || `${course.name} ${course.code}`.toLowerCase().includes(term))
    && (!notesOnly || (counts[course.id] ?? 0) > 0))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export function coursePage<T>(courses: T[], requestedPage: number) {
  const pages = Math.max(1, Math.ceil(courses.length / COURSES_PER_PAGE));
  const page = Math.min(Math.max(1, requestedPage), pages);
  return { page, pages, items: courses.slice((page - 1) * COURSES_PER_PAGE, page * COURSES_PER_PAGE) };
}