import type { LandingCopy } from '../../utils/landingLang';

// Shared site footer, used by the landing page and the /fees sub-landing
// so both carry byte-identical footer content and links.
export function SiteFooter({ t }: { t: LandingCopy }) {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-deep px-4 pb-0 pt-12">
      <div className="relative mx-auto max-w-6xl">
        <p className="flex flex-wrap items-center gap-2.5 font-data text-xs text-slate-400">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          {t.footerLive}
        </p>
        <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-7 w-7 rounded-lg" />
              <span className="text-base font-medium text-white">NodeScope</span>
            </div>
            <p className="mt-3 max-w-xs text-[15px] leading-[1.85] text-slate-400">
              {t.footerDescription}
            </p>
            <p className="mt-4 text-xs text-slate-400">
              {t.footerDisclaimer}
            </p>
          </div>
          {t.footerColumns.map((col) => (
            <div key={col.header}>
              <p className="text-sm text-slate-400">{col.header}</p>
              <ul className="mt-3.5 space-y-2.5 text-sm">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className="inline-block text-slate-400 transition-colors hover:text-white"
                      >
                        {label}
                      </a>
                    ) : (
                      <span className="text-slate-400">{label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="relative">
        <p
          aria-hidden="true"
          className="pointer-events-none -mb-[0.28em] mt-8 select-none text-center text-[18vw] font-medium leading-none tracking-tight text-[#16203a]"
        >
          NODESCOPE
        </p>
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-6 text-xs text-slate-400">
        <span>{t.footerCopyright}</span>
        <span>{t.footerSchema}</span>
      </div>
    </footer>
  );
}
