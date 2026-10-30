import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Search, ChevronRight } from "lucide-react";
import type { Course } from "@/lib/resources";
import { COURSE_SUBJECTS, coursePage, filterCourses } from "@/lib/course-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CourseBrowser({ courses, counts, loading, error, retry }: { courses: Course[]; counts: Record<string, number>; loading: boolean; error: boolean; retry: () => void }) {
  const [subject, setSubject] = useState("all");
  const [search, setSearch] = useState("");
  const [notesOnly, setNotesOnly] = useState(false);
  const [requestedPage, setPage] = useState(1);
  const visible = filterCourses(courses, subject, search, notesOnly, counts);
  const { page, pages, items } = coursePage(visible, requestedPage);

  return <section aria-label="Course catalogue" className="mb-10">
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
      <h2 className="text-2xl font-bold text-primary">Courses</h2>
      <a href="https://www.cmi.ac.in/teaching/courses.php#bsc" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground underline underline-offset-4">CMI course catalogue ↗</a>
    </div>
    <Tabs value={subject} onValueChange={value => { setSubject(value); setPage(1); }}>
      <TabsList aria-label="Course subjects" className="mb-5 flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
        {["all", ...COURSE_SUBJECTS].map(value => <TabsTrigger key={value} value={value} className="min-h-10 whitespace-normal border border-border px-3 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none">
          {value === "all" ? "All subjects" : value}<span className="ml-2 font-mono text-xs opacity-70">{courses.filter(c => c.code !== "MISC" && (value === "all" || c.subject === value)).length}</span>
        </TabsTrigger>)}
      </TabsList>
    </Tabs>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div className="relative w-full sm:max-w-md">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input aria-label="Search courses" placeholder="Search by course name or short form" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="h-10 bg-card pl-9" />
      </div>
      <label className="flex items-center gap-2 text-sm" htmlFor="courses-with-notes"><Switch id="courses-with-notes" checked={notesOnly} onCheckedChange={value => { setNotesOnly(value); setPage(1); }} />With notes only</label>
    </div>
    {loading ? <p className="py-8 text-muted-foreground">Loading courses…</p> : error ? <div className="py-8"><p className="mb-3 text-muted-foreground">Could not load courses.</p><Button variant="outline" onClick={retry}>Try again</Button></div> : <>
      <div className="mb-2 flex justify-between gap-4 text-sm text-muted-foreground"><span>{visible.length} {visible.length === 1 ? "course" : "courses"}</span><span>Approved notes</span></div>
      <div className="border-t border-border">
        {items.map(course => <Link key={course.id} to="/courses/$code" params={{ code: course.code }} className="group grid grid-cols-[minmax(0,1fr)_3rem_1rem] items-center gap-3 border-b border-border py-3 transition-colors hover:bg-muted/50 sm:grid-cols-[7rem_minmax(0,1fr)_3rem_1rem]">
          <span className="font-mono text-xs text-muted-foreground sm:col-auto">{course.code}</span>
          <span className="col-start-1 row-start-2 min-w-0 sm:col-start-2 sm:row-start-1"><span className="block font-semibold text-primary group-hover:underline underline-offset-4">{course.name}</span>{subject === "all" && <span className="text-xs text-muted-foreground">{course.subject}</span>}</span>
          <span className="col-start-2 row-span-2 row-start-1 text-right font-mono text-sm text-muted-foreground sm:col-start-3 sm:row-span-1">{counts[course.id] ?? 0}</span>
          <ChevronRight aria-hidden="true" className="col-start-3 row-span-2 row-start-1 h-4 w-4 text-muted-foreground sm:col-start-4 sm:row-span-1" />
        </Link>)}
      </div>
      {!items.length && <p className="py-8 text-muted-foreground">No courses match these filters.</p>}
      {pages > 1 && <div className="mt-4 flex items-center justify-between"><Button variant="outline" size="icon" aria-label="Previous course page" disabled={page === 1} onClick={() => setPage(page - 1)}><ArrowLeft /></Button><span className="text-sm text-muted-foreground">Page {page} of {pages}</span><Button variant="outline" size="icon" aria-label="Next course page" disabled={page === pages} onClick={() => setPage(page + 1)}><ArrowRight /></Button></div>}
    </>}
  </section>;
}