import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminPage } from '@/routes/admin';

const MEMBER = {
  id: '11111111-1111-1111-1111-111111111111',
  display_name: 'Anusha Gupta',
  bio: 'Runs the archive',
  email: 'anuzrella@gmail.com',
  joined_at: '2026-01-05T10:00:00.000Z',
  upload_count: 3,
  is_moderator: true,
};
const PLAIN = {
  id: '22222222-2222-2222-2222-222222222222',
  display_name: 'Soham Saha',
  bio: '',
  email: 'soham@cmi.ac.in',
  joined_at: '2026-02-09T08:30:00.000Z',
  upload_count: 25,
  is_moderator: false,
};

const state = vi.hoisted(() => ({
  auth: { user: null as unknown, isAdmin: false, loading: false },
  rows: [] as unknown[],
  rpc: vi.fn(),
  options: [] as { queryKey: string[]; enabled?: boolean }[],
  promises: {} as Record<string, Promise<unknown>>,
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: string[]; enabled?: boolean; queryFn?: () => Promise<unknown> }) => {
    state.options.push(options);
    const key = String(options.queryKey[0]);
    if (options.enabled === false) return { data: undefined, error: null, isLoading: false };
    if (options.queryFn) state.promises[key] = options.queryFn();
    if (key === 'members') return { data: state.rows, error: null, isLoading: false };
    return { data: [], error: null, isLoading: false };
  },
  useQueryClient: () => ({ invalidateQueries: async () => {} }),
}));

vi.mock('@/lib/auth', () => ({ useAuth: () => state.auth }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: state.rpc,
    from: () => ({ select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/ResourceCard', () => ({ ResourceCard: () => null }));
vi.mock('@/components/UpdateReview', () => ({ UpdateReview: () => null }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  state.rows = [];
  state.options = [];
  state.promises = {};
  state.auth = { user: null, isAdmin: false, loading: false };
});

describe('Moderator member directory', () => {
  it('never asks the database for the account list unless the visitor is a moderator', async () => {
    render(<AdminPage />);
    expect(await screen.findByText('Only moderators can view this page.')).toBeInTheDocument();
    const members = state.options.find((o) => o.queryKey[0] === 'members');
    expect(members?.enabled).toBe(false);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('lists every account with email, upload count and moderator flag for moderators', async () => {
    state.auth = { user: { id: MEMBER.id }, isAdmin: true, loading: false };
    state.rows = [MEMBER, PLAIN];
    state.rpc.mockResolvedValue({ data: [MEMBER, PLAIN], error: null });

    render(<AdminPage />);
    expect(screen.getByText('anuzrella@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('soham@cmi.ac.in')).toBeInTheDocument();
    expect(screen.getByText('3 uploads')).toBeInTheDocument();
    expect(screen.getByText('25 uploads')).toBeInTheDocument();
    expect(screen.getByText('Moderator')).toBeInTheDocument();
    expect(screen.getByText(new Date(MEMBER.joined_at).toLocaleDateString())).toBeInTheDocument();

    await state.promises["members"];
    expect(state.rpc).toHaveBeenCalledWith('moderator_member_directory');
  });
});
