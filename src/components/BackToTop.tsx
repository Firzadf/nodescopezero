import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Back-to-top button, shared by the landing page and the app. The button
 * stays hidden until the page has been scrolled past 600px, then fades
 * and scales in. Scrolling is smooth, except under prefers-reduced-motion
 * where it jumps instantly. Both pages scroll the window itself (the app
 * has no internal scroll container), so one implementation serves both.
 */
export function BackToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  const goTop = () => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={goTop}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[#7DB4FF]/40 bg-[#7DB4FF] text-[#060b1d] transition-colors duration-300 hover:brightness-105"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
