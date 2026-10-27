import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — CMI Notes Archive" },
      { name: "description", content: "How the CMI student notes archive works and how to contribute." },
      { property: "og:title", content: "About the CMI Notes Archive" },
      { property: "og:description", content: "A student-run archive of course notes at Chennai Mathematical Institute." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-2xl px-5 py-16 space-y-5">
        <h1 className="text-4xl font-bold text-primary">About the archive</h1>
        <p>The CMI Notes Archive is a student-run collection of typed course notes and study material from courses at Chennai Mathematical Institute.</p>
        <h2 className="pt-4 text-2xl font-bold text-primary">How it works</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Anyone can browse and download approved notes.</li>
          <li>Sign in to share PDFs, LaTeX or Typst sources (single file or .zip), or external links.</li>
          <li>Every submission is reviewed by a moderator before it appears.</li>
        </ul>
        <h2 className="pt-4 text-2xl font-bold text-primary">A note on accuracy</h2>
        <p className="text-muted-foreground">These are student notes, not official course material. They may contain errors — always cross-check with your lectures and textbooks.</p>
      </div>
    </div>
  );
}
