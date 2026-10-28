import { useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { feesCopy } from '../utils/feesLang';
import { landingCopy, readStoredLang, storeLang, type Lang } from '../utils/landingLang';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { DeployCostCalculator } from '../components/fees/DeployCostCalculator';

// /fees: the Fees sub-landing. Same design system, fonts, and footer as the
// main landing, with its own centered hero layout. Amber appears only where
// it encodes the storage-deposit series (chart bar, legend, deposit figures);
// page chrome is neutral with the single accent. All numbers on this page
// come from one documented measured run (26 Oct 2026 ~13:13 UTC); the live
// re-measurement lives in Fee Lab, linked below. Nothing here polls, signs,
// or opens a connection.
function AnimatedBars({ t }: { t: (typeof feesCopy)['en'] }) {
  // Bars render at their final widths on first paint: no entrance motion.
  // Scaled to the larger all-in total (124.098 tPOT). The native fee slice
  // (0.154 tPOT) is visually negligible at true scale, so it gets the same
  // 0.4% minimum the Fee Lab breakdown bars use; the values beside the
  // bars are exact, the widths are illustrative.
  const evmW = 100;
  const nativeFeeW = 0.4;
  const nativeDepW = 98.3;
  return (
    <div className="mx-auto mt-10 w-full max-w-2xl space-y-5" role="img" aria-label={t.barAria}>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-slate-400">{t.evmBarLabel}</span>
          <span className="font-data text-sm text-slate-100">124.098 <span className="text-slate-400">tPOT</span></span>
        </div>
        <div className="mt-2 flex h-5 w-full overflow-hidden rounded-md bg-white/[0.04]">
          <div className="h-full bg-[#7DB4FF]" style={{ width: `${evmW}%` }} />
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-slate-400">{t.nativeBarLabel}</span>
          <span className="font-data text-sm text-slate-100">122.191 <span className="text-slate-400">tPOT</span></span>
        </div>
        <div className="mt-2 flex h-5 w-full overflow-hidden rounded-md bg-white/[0.04]">
          <div className="h-full bg-emerald-400" style={{ width: `${nativeFeeW}%` }} title={`${t.nativeFeeSegment}: 0.154 tPOT`} />
          <div className="h-full bg-amber-400" style={{ width: `${nativeDepW}%` }} title={`${t.nativeDepositSegment}: 122.037 tPOT`} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-400" />{t.nativeFeeSegment}: 0.154 tPOT</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-400" />{t.nativeDepositSegment}: 122.037 tPOT</span>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400">{t.barCaption}</p>
    </div>
  );
}

export function FeesPage() {
  const [lang, setLangState] = useState<Lang>(() => readStoredLang());
  const setLang = (l: Lang) => {
    setLangState(l);
    storeLang(l);
  };
  const t = feesCopy[lang];
  const footerCopy = landingCopy[lang];
  return (
    <div className="landing-root min-h-screen bg-ink font-sans text-slate-200 antialiased">
      <SiteHeader
        nav={t.nav}
        lang={lang}
        setLang={setLang}
        menuId="fees-mobile-menu"
        variant="fees"
        langGroupAria={t.langGroupAria}
        menuToggleAria={t.menuToggleAria}
      />

      <main>
      {/* Hero: centered single column. */}
      <section className="relative overflow-hidden px-4 pb-16 pt-20 md:pt-28">
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs text-slate-300">
            {t.heroKicker}
          </p>
          <h1 className="mt-7 text-[clamp(2.75rem,6vw,5rem)] font-medium leading-[1.02] tracking-tight text-white">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">
            {t.heroSub}
          </p>
          <p className="mx-auto mt-6 max-w-2xl rounded-lg border border-line px-5 py-4 text-left text-[15px] leading-relaxed text-slate-200">
            {t.heroAnswer}
          </p>
          <AnimatedBars t={t} />
        </div>
      </section>

      <section className="cv-auto border-t border-line px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-white">{t.howTitle}</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {t.howSteps.map((s) => (
              <div key={s.title} className="py-6">
                <h3 className="text-lg font-medium text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cv-auto border-t border-line px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-white">{t.opsTitle}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.ops.map((o) => (
              <div key={o.title} className="rounded-2xl border border-line bg-panel p-5">
                <h3 className="text-[15px] font-semibold text-white">{o.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{o.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cv-auto border-t border-line px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-white">{t.findingsTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">{t.findingsIntro}</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-slate-400">
                  {t.findingsHead.map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.findingsRows.map((r) => (
                  <tr key={r.op} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-slate-200">{r.op}</td>
                    <td className="px-4 py-3 font-data tabular-nums text-slate-100">{r.evm}</td>
                    <td className="px-4 py-3 font-data tabular-nums text-slate-100">{r.nativeFee}</td>
                    <td className="px-4 py-3 font-data tabular-nums text-amber-300">{r.deposit}</td>
                    <td className="px-4 py-3 font-data tabular-nums text-white">{r.allIn}</td>
                    <td className="px-4 py-3 font-data tabular-nums text-slate-400">{r.feeOnly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-6 grid max-w-4xl gap-2.5 text-sm leading-relaxed text-slate-400">
            {t.findingsNotes.map((n) => (
              <li key={n} className="flex gap-2.5"><span aria-hidden="true" className="text-slate-500">▸</span><span>{n}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cv-auto border-t border-line px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-white">{t.calc.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">{t.calc.intro}</p>
          <div className="mt-8 rounded-2xl border border-line bg-panel p-5 md:p-6">
            <DeployCostCalculator lang={lang} />
          </div>
        </div>
      </section>

      <section className="cv-auto border-t border-line px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-white">{t.limitsTitle}</h2>
          <ul className="mt-6 grid max-w-4xl gap-2.5 text-sm leading-relaxed text-slate-400">
            {t.limits.map((l) => (
              <li key={l} className="flex gap-2.5"><span aria-hidden="true" className="text-slate-500">▸</span><span>{l}</span></li>
            ))}
          </ul>
          <div className="mt-12 rounded-lg border border-line p-6 text-center md:p-8">
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-white">{t.ctaTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">{t.ctaBody}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a href="/app/fee-lab" className="inline-flex items-center gap-2 rounded-lg bg-[#7DB4FF] px-6 py-3 text-[15px] font-medium text-[#060b1d] transition hover:brightness-110">
                {t.ctaLab}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/" className="inline-flex items-center gap-1.5 px-2 py-3 text-[15px] font-medium text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white">
                {t.ctaLanding}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      </main>
      <SiteFooter t={footerCopy} />
    </div>
  );
}
