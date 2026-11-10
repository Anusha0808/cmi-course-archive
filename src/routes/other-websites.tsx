// Legacy address: /other-websites now lives at /fellow-websites.
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/other-websites')({
  beforeLoad: () => { throw redirect({ to: '/fellow-websites', replace: true }); },
});
