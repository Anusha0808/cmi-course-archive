import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowUpRight, UserRound } from 'lucide-react';
import { getAuthors } from '@/lib/directory.functions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

const authorsQuery = { queryKey: ['authors'], queryFn: () => getAuthors() };
export const Route = createFileRoute('/authors/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(authorsQuery),
  head: () => ({ meta: [
    { title: 'Authors — CMI Notes Archive' },
    { name: 'description', content: 'Meet the CMI contributors and browse their published course notes and peer resources.' },
    { property: 'og:title', content: 'Authors — CMI Notes Archive' },
    { property: 'og:description', content: 'CMI contributors, their profiles and published notes.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  errorComponent: () => <p className="mx-auto max-w-6xl px-5 py-12">Could not load authors. <Link to="/" className="underline">Back to archive</Link></p>,
  component: AuthorsPage,
});

function AuthorsPage() {
  const { data } = useSuspenseQuery(authorsQuery);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const authors = data.filter(a => `${a.display_name} ${a.bio}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="mx-auto max-w-6xl px-5 py-12">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div><h1 className="text-4xl font-bold text-primary">Authors</h1><p className="mt-3 text-muted-foreground">The people behind the notes.</p></div>
      {user && <Button asChild variant="outline"><Link to="/authors/$id" params={{ id: user.id }}><UserRound />My profile</Link></Button>}
    </header>
    <Input aria-label="Search authors" placeholder="Search authors…" value={search} onChange={e => setSearch(e.target.value)} className="mb-8 max-w-md" />
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{authors.map(a => <Link key={a.id} to="/authors/$id" params={{ id: a.id }} className="group flex min-w-0 flex-col rounded-lg border border-border bg-card p-6 shadow-card transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="mb-5 flex items-start justify-between gap-3"><UserRound className="size-8 text-muted-foreground" /><ArrowUpRight className="size-5 text-primary" /></div>
      <h2 className="break-words text-xl font-bold text-primary">{a.display_name}</h2>
      {a.bio && <p className="mt-2 line-clamp-3 break-words text-sm text-muted-foreground">{a.bio}</p>}
      <p className="mt-auto pt-5 text-sm text-muted-foreground">{a.noteCount} published {a.noteCount === 1 ? 'note' : 'notes'}</p>
    </Link>)}</div>
    {!authors.length && <p className="text-muted-foreground">No authors found.</p>}
  </main>;
}