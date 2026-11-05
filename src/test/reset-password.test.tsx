import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ResetPasswordPage } from "@/routes/reset-password";

const { auth, listeners } = vi.hoisted(() => {
  const listeners = new Set<(event: string, session: unknown) => void>();
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: null } })),
    onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
      listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    }),
    updateUser: vi.fn(async () => ({ error: null })),
  };
  return { auth, listeners };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth },
}));

const recoverySession = {
  user: { id: "u1", email: "student@cmi.ac.in", app_metadata: { provider: "recovery" } },
};

const blank = () => null;
const root = createRootRoute({ component: () => <Outlet /> });
const tree = root.addChildren([
  createRoute({ getParentRoute: () => root, path: "/reset-password", component: ResetPasswordPage }),
  createRoute({ getParentRoute: () => root, path: "/auth", component: blank }),
  createRoute({ getParentRoute: () => root, path: "/upload", component: blank }),
  createRoute({ getParentRoute: () => root, path: "/", component: blank }),
]);

async function openPage() {
  const router = createRouter({
    routeTree: tree,
    history: createMemoryHistory({ initialEntries: ["/reset-password"] }),
  });
  render(<RouterProvider router={router} />);
  await waitFor(() => expect(listeners.size).toBeGreaterThan(0));
}

function fireRecovery() {
  for (const cb of [...listeners]) cb("PASSWORD_RECOVERY", recoverySession);
}

describe("Password reset page", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("refuses to show a password form without a recovery link", async () => {
    await openPage();

    await waitFor(() => expect(screen.getByText(/reset link is expired/i)).toBeInTheDocument());
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("sets the new password from a recovery session, without the old password", async () => {
    await openPage();
    fireRecovery();

    await waitFor(() => expect(screen.getByLabelText("New password")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "brand-new-1" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "typo-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
    expect(auth.updateUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "brand-new-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save new password" }));

    await waitFor(() => expect(auth.updateUser).toHaveBeenCalledWith({ password: "brand-new-1" }));
    await waitFor(() => expect(screen.getByText(/password is set/i)).toBeInTheDocument());
  });
});
