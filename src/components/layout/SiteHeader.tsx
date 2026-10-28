import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import type { Lang } from '../../utils/landingLang';

// Shared site header, used by the landing page and the /fees sub-landing
// so both carry the same mobile menu behavior: full nav from xl, a
// hamburger below xl, and a collapsible menu that closes when a link is
// pressed. The two pages keep their own header chrome via variant
// (landing: fixed bar + V3 badge + Launch App; /fees: static bar) but the
// menu implementation itself exists exactly once. One accent everywhere:
// the language toggle, the V3 badge, and the Launch App button share it.
export type SiteNavLink = { href: string; label: string };

export function SiteHeader({
  nav,
  lang,
  setLang,
  menuId,
  variant,
  launchLabel,
  launchHref,
  langGroupAria = 'Language',
  menuToggleAria = 'Toggle navigation menu',
}: {
  nav: SiteNavLink[];
  lang: Lang;
  setLang: (l: Lang) => void;
  menuId: string;
  variant: 'landing' | 'fees';
  /** Landing only: label and target of the Launch App button. */
  launchLabel?: string;
  launchHref?: string;
  /** Screen-reader labels for the language group and the mobile menu
   * toggle. English defaults keep older callers working; Landing and
   * /fees pass their session language so the labels are never
   * English-only on an Indonesian page. */
  langGroupAria?: string;
  menuToggleAria?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerClass =
    variant === 'landing' ? 'fixed inset-x-0 top-0 z-40 border-b border-line bg-ink px-4' : 'border-b border-line px-4 py-4';
  const containerClass = 'mx-auto flex max-w-6xl items-center gap-3 py-2.5';
  const wordmarkClass =
    variant === 'landing'
      ? 'hidden text-[17px] font-medium tracking-tight text-white sm:inline'
      : 'text-[17px] font-medium tracking-tight text-white';
  const toggleActive = 'bg-[#7DB4FF] text-[#060b1d]';
  return (
    <header className={headerClass}>
      <div className={containerClass}>
        <a href="/" className="flex shrink-0 items-center gap-2.5">
          <img src="/logo.png" alt="NodeScope logo" className="h-7 w-7 rounded-lg" />
          <span className={wordmarkClass}>
            NodeScope
          </span>
        </a>
        {variant === 'landing' ? (
          <nav className="mx-auto hidden items-center gap-7 text-sm text-slate-400 xl:flex">
            {nav.map(({ href, label }) => (
              <a key={href} href={href} className="shrink-0 whitespace-nowrap transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </nav>
        ) : (
          <nav className="mx-auto hidden items-center gap-5 text-sm text-slate-400 xl:flex">
            {nav.map(({ href, label }) => (
              <a key={href} href={href} className="shrink-0 whitespace-nowrap transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </nav>
        )}
        <span className="flex shrink-0 items-center gap-1 rounded-lg border border-line p-1" role="group" aria-label={langGroupAria}>
          {(['en', 'id'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              // The accessible name contains the visible label verbatim
              // ("EN (English)"): a bare "English" fails axe's
              // label-content-name-mismatch for the visible "EN".
              aria-label={l === 'en' ? 'EN (English)' : 'ID (Bahasa Indonesia)'}
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className={`rounded-lg px-2.5 py-1 font-data text-xs transition-colors ${lang === l ? toggleActive : 'text-slate-400 hover:text-white'}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </span>
        {variant === 'landing' && (
          <span className="hidden items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs text-slate-300 xl:flex">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            V3 Testnet
          </span>
        )}
        {variant === 'landing' && launchLabel && launchHref && (
          <a href={launchHref} className="ml-auto inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-[#7DB4FF] px-4 py-2 text-sm font-medium text-[#060b1d] transition hover:brightness-110 md:ml-0">
            {launchLabel}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
        <button
          type="button"
          aria-label={menuToggleAria}
          aria-expanded={mobileMenuOpen}
          aria-controls={menuId}
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-slate-300 transition-colors hover:text-white xl:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div id={menuId} className="border-b border-line bg-ink px-4 py-3 xl:hidden">
          <nav className="mx-auto grid max-w-6xl gap-1">
            {nav.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
