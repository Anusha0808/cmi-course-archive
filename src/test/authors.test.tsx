import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Route } from '@/routes/authors.index';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('@tanstack/react-query', () => ({
  useSuspenseQuery: () => ({ data: [
    { id: 'contributor', display_name: 'Contributor', bio: '', noteCount: 1 },
    { id: 'noncontributor', display_name: 'Noncontributor', bio: '', noteCount: 0 },
  ] }),
}));
vi.mock('@/lib/auth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/lib/directory.functions', () => ({ getAuthors: vi.fn() }));
afterEach(cleanup);

it('lists only authors with at least one published contribution, including during search', () => {
  const AuthorsPage = (Route as unknown as { component: React.ComponentType }).component;
  render(<AuthorsPage />);
  expect(screen.getByRole('heading', { name: 'Contributor' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Noncontributor' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search authors' }), { target: { value: 'Noncontributor' } });
  expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
});