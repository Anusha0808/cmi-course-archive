import { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const manual = useRef(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    let saved: string | null = null;
    try { saved = localStorage.getItem('archive-theme'); } catch { /* Storage may be unavailable. */ }
    manual.current = saved === 'dark' || saved === 'light';
    const apply = (value: boolean) => {
      document.documentElement.classList.toggle('dark', value);
      setDark(value);
    };
    apply(manual.current ? saved === 'dark' : media.matches);
    const changed = () => { if (!manual.current) apply(media.matches); };
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);

  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
  return <Button variant="ghost" size="icon" title={label} aria-label={label} aria-pressed={dark}
    onClick={() => {
      const next = !dark;
      manual.current = true;
      document.documentElement.classList.toggle('dark', next);
      setDark(next);
      try { localStorage.setItem('archive-theme', next ? 'dark' : 'light'); } catch { /* Keep the current appearance. */ }
    }}>{dark ? <Sun /> : <Moon />}</Button>;
}