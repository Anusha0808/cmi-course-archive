import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebsitesPage } from '@/routes/fellow-websites';

const state = vi.hoisted(() => ({
  rows: [{ id: 'first', owner_id: 'member', title: 'First site', url: 'https://first.example/', description: '', profiles: { display_name: 'Member' } }],
  insert: vi.fn(async () => ({ error: null })),
  update: vi.fn(),
  eq: vi.fn(),
}));
vi.mock('@tanstack/react-router', () => ({ createFileRoute: () => (options: unknown) => options, Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock('@tanstack/react-query', () => ({ useSuspenseQuery: () => ({ data: state.rows }), useQueryClient: () => ({ invalidateQueries: async () => {} }) }));
vi.mock('@/lib/auth', () => ({ useAuth: () => ({ user: { id: 'member' }, isAdmin: false }) }));
vi.mock('@/lib/directory.functions', () => ({ getWebsites: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ insert: state.insert, update: state.update }) } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Multiple member websites', () => {
  it('inserts additional listings without replacing the member’s first website', async () => {
    render(<WebsitesPage />);
    for (const [title, url] of [['Second site', 'second.example'], ['Third site', 'third.example']]) {
      fireEvent.click(screen.getByRole('button', { name: 'Add a website' }));
      fireEvent.change(screen.getByLabelText('Website name'), { target: { value: title } });
      fireEvent.change(screen.getByLabelText('Website address'), { target: { value: url } });
      fireEvent.click(screen.getByRole('button', { name: 'Add website' }));
      await waitFor(() => expect(screen.queryByLabelText('Website name')).not.toBeInTheDocument());
    }
    expect(state.insert).toHaveBeenNthCalledWith(1, { owner_id: 'member', title: 'Second site', url: 'https://second.example/', description: '' });
    expect(state.insert).toHaveBeenNthCalledWith(2, { owner_id: 'member', title: 'Third site', url: 'https://third.example/', description: '' });
    expect(state.update).not.toHaveBeenCalled();
  });

  it('updates only the selected listing owned by the signed-in member', async () => {
    state.eq.mockReturnValueOnce({ eq: state.eq }).mockResolvedValueOnce({ error: null });
    state.update.mockReturnValue({ eq: state.eq });
    render(<WebsitesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit First site' }));
    fireEvent.change(screen.getByLabelText('Website name'), { target: { value: 'Updated first site' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save website' }));
    await waitFor(() => expect(state.eq).toHaveBeenCalledWith('owner_id', 'member'));
    expect(state.eq).toHaveBeenCalledWith('id', 'first');
    expect(state.update).toHaveBeenCalledWith({ owner_id: 'member', title: 'Updated first site', url: 'https://first.example/', description: '' });
    expect(state.insert).not.toHaveBeenCalled();
  });
});