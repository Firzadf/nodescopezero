import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Pause, Play, X } from 'lucide-react';
import { sendJsonRpcRequest } from '../services/rpcClient';
import { BackToTop } from '../components/BackToTop';
import { IntroSplash } from '../components/common/IntroSplash';
import { DEFAULT_PORTALDOT_V3_EVM_RPC } from '../types/endpoint';
import { landingCopy, readStoredLang, storeLang, type Lang } from '../utils/landingLang';
import { PillarCards } from '../components/landing/PillarCards';
import OrbitHero from '../components/landing/OrbitHero';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import {
  ANCHOR_TX,
  ANCHORED_REPORTS,
  ANCHORED_REPORT_HASH,
  PORTALDOT_CHAIN_ID,
  REGISTRY_CONTRACT,
} from '../utils/siteConstants';

const APP_URL = '/app';
const DEMO_URL = 'https://youtu.be/TyTudF3MUaI';
const DOCUMENTED_CHAIN_ID = 420420777;

/* ---------------------------------- hooks --------------------------------- */

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms`, transitionTimingFunction: 'var(--ease-out)' }}
      className={`reveal ${className} transition-transform transition-opacity duration-500 ${inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
    >
      {children}
    </div>
  );
}

/**
 * Motion video, deferred until scrolled into view. The 3.2 MB file and
 * its 74 KB poster used to download on first paint even though the
 * figure sits far below the fold, competing with the hero on slow
 * connections (Lighthouse flagged the video as the page's largest
 * payload, and the poster as an eager below-fold image). Now only a
 * same-aspect placeholder renders until viewport entry; the video
 * (with poster and src, autoplay) and the reduced-motion poster image
 * are mounted then. Where IntersectionObserver is missing (tests, old
 * browsers) everything renders on first paint, exactly like before.
 */
function MotionVideo({ caption }: { caption: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  return (
    <div ref={ref} className="w-full">
      {inView ? (
        <>
          <video
            className="motion-video aspect-[16/10] w-full"
            src="/motion/nodescope-flow.mp4"
            poster="/screenshots/01-endpoint-config.jpg"
            autoPlay
            muted
            loop
            playsInline
            aria-label={caption}
          />
          <img
            src="/screenshots/01-endpoint-config.jpg"
            alt={caption}
            className="motion-poster aspect-[16/10] w-full object-cover object-top"
          />
        </>
      ) : (
        <div
          className="aspect-[16/10] w-full bg-panel"
          aria-hidden="true"
          data-testid="motion-placeholder"
        />
      )}
    </div>
  );
}

/* -------------------------------- odometer -------------------------------- */

function Odometer({ value }: { value: string }) {
  return (
    <span className="odometer" aria-label={value}>
      {value.split('').map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="odometer-col" aria-hidden="true">
            <span className="odometer-strip" style={{ transform: `translateY(-${Number(ch)}em)` }}>
              {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden="true">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

/* ------------------------------ live readout ------------------------------ */

type ReadoutState =
  | { kind: 'probing' }
  | { kind: 'live'; block: number; chainOk: boolean; latencyMs: number | null; at: Date }
  | { kind: 'unreachable'; at: Date };

function LiveReadout({ lang }: { lang: Lang }) {
  const lr = landingCopy[lang];
  const [state, setState] = useState<ReadoutState>({ kind: 'probing' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [blockRes, chainRes] = await Promise.all([
        sendJsonRpcRequest(DEFAULT_PORTALDOT_V3_EVM_RPC, 'eth_blockNumber', [], 6000),
        sendJsonRpcRequest(DEFAULT_PORTALDOT_V3_EVM_RPC, 'eth_chainId', [], 6000),
      ]);
      if (cancelled) return;
      const raw = blockRes.response?.result;
      if (blockRes.success && typeof raw === 'string') {
        const chainRaw = chainRes.response?.result;
        setState({
          kind: 'live',
          block: parseInt(raw, 16),
          chainOk: chainRes.success && typeof chainRaw === 'string' && parseInt(chainRaw, 16) === DOCUMENTED_CHAIN_ID,
          latencyMs: blockRes.latency,
          at: new Date(),
        });
      } else {
        setState({ kind: 'unreachable', at: new Date() });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-panel/90 shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between border-b border-line bg-black/25 px-4 py-2.5">
        <span className="font-data text-[11px] text-slate-400">{lr.liveReadoutHeader}</span>
      </div>
      <div className="px-5 py-5">
        <p className="font-data text-[10px] uppercase tracking-[0.22em] text-slate-500">{lr.liveReadoutLatest}</p>
        <div className="mt-2 font-data text-[44px] font-semibold leading-none text-white md:text-[54px]">
          {state.kind === 'live' ? (
            <Odometer value={state.block.toLocaleString('en-US')} />
          ) : state.kind === 'probing' ? (
            <span className="text-slate-600">
              <Odometer value="0" />
            </span>
          ) : (
            <span className="text-slate-500">— — —</span>
          )}
        </div>
        <div className="mt-4 space-y-1.5 border-t border-line pt-3.5 font-data text-[11.5px] leading-relaxed">
          {state.kind === 'probing' && (
            <p key="probing" className="state-swap text-slate-400">
              STATUS <span className="text-slate-200">{lr.liveReadoutProbing}</span>
            </p>
          )}
          {state.kind === 'live' && (
            <div key="live" className="state-swap space-y-1.5">
              <p className="text-slate-400">
                CHAIN ID <span className="text-slate-100">0x190F1CA9</span>{' '}
                {state.chainOk ? (
                  <span className="text-emerald-400">{lr.liveReadoutMatch}</span>
                ) : (
                  <span className="text-amber-300">{lr.liveReadoutMismatch}</span>
                )}
              </p>
              <p className="text-slate-400">
                {lr.liveReadoutAnsweredIn} <span className="text-slate-100">{state.latencyMs !== null ? `${state.latencyMs} MS` : '—'}</span>
                {' · '}{lr.liveReadoutAt}{' '}
                <span className="text-slate-100">
                  {state.at.toLocaleTimeString('en-GB', { hour12: false })} WIB
                </span>
              </p>
              <p className="text-slate-500">{lr.liveReadoutFetchedOnce}</p>
            </div>
          )}
          {state.kind === 'unreachable' && (
            <div key="unreachable" className="state-swap space-y-1.5">
              <p className="text-amber-300">{lr.liveReadoutUnreachable}</p>
              <p className="text-slate-400">
                {lr.liveReadoutUnreachableBody}
                <span className="text-slate-100">{lr.liveReadoutLastObserved}</span>.
              </p>
            </div>
          )}
        </div>
      </div>
      <svg viewBox="0 0 600 40" className="h-9 w-full border-t border-line bg-black/20" aria-hidden="true">
        <path
          className="ecg-path"
          d="M0 20 H180 L192 20 L200 6 L210 34 L220 20 H330 L342 12 L352 28 L360 20 H600"
          fill="none"
          stroke="#0181FB"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ----------------------------- section heading ---------------------------- */

function SectionHeading({ title, right }: { title: string; right?: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
      <p className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-white">{title}</p>
      {right && <p className="text-sm text-slate-500">{right}</p>}
    </div>
  );
}

/* ------------------------------ step player ------------------------------- */

function CheckTranscript({ lang }: { lang: Lang }) {
  const ct = landingCopy[lang];
  const steps = [
    { method: 'eth_chainId', observed: '0x190f1ca9 — chain 420420777', latency: 562 },
    { method: 'eth_blockNumber', observed: 'block 147,638', latency: 258 },
    { method: 'web3_clientVersion', observed: ct.checkObservedClient, latency: 257 },
    { method: 'net_version', observed: '420420777', latency: 274 },
  ];
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setActive((a) => (a + 1) % steps.length), 1900);
    return () => clearInterval(t);
  }, [playing, steps.length]);

  const step = steps[active];

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line bg-black/25 px-4 py-2.5">
        <span className="font-data text-xs text-slate-400">{ct.transcriptHeader}</span>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? ct.transcriptPause : ct.transcriptPlay}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-slate-200 transition-colors hover:text-white"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="grid md:grid-cols-2">
        <ol className="divide-y divide-line border-b border-line md:border-b-0 md:border-r">
          {steps.map((s, i) => (
            <li key={s.method}>
              <button
                type="button"
                onClick={() => {
                  setActive(i);
                  setPlaying(false);
                }}
                className={`relative flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors duration-200 ${
                  i === active ? 'bg-white/[0.045]' : 'hover:bg-white/[0.02]'
                }`}
              >
                {i === active && (
                  <span className="absolute left-0 top-0 h-full w-[3px] bg-[#7DB4FF]" />
                )}
                <span className={`font-data text-sm ${i === active ? 'text-white' : 'text-slate-400'}`}>{s.method}</span>
                <span className={`ml-auto font-data text-xs ${i < active || !playing ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {i === active && playing ? ct.transcriptRunning : ct.transcriptPass}
                </span>
                {i === active && playing && (
                  <span
                    key={active}
                    aria-hidden="true"
                    className="step-progress absolute bottom-0 left-0 h-[2px] w-full bg-[#7DB4FF]"
                  />
                )}
              </button>
            </li>
          ))}
        </ol>
        <div className="px-5 py-5" key={active}>
          <div className="state-swap">
            <p className="text-xs text-slate-500">{ct.transcriptObserved}</p>
            <p className="mt-2 font-data text-lg leading-snug text-white">{step.observed}</p>
            <p className="mt-4 font-data text-[11.5px] text-slate-400">
              {ct.transcriptLatency} <span className="text-slate-100">{step.latency} MS</span> · {ct.transcriptOutcome}{' '}
              <span className="text-emerald-400">{ct.transcriptSuccess}</span>
            </p>
            <p className="mt-5 border-t border-line pt-3.5 text-[13px] leading-relaxed text-slate-500">
              {ct.transcriptNote}
              <span className="font-data text-slate-300">nodescope.health-snapshot.v1</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- flow visual ------------------------------ */

/**
 * One question, two answers. The console lane asks eth_blockNumber once and
 * keeps nothing; the NodeScope lane turns the same method into two kept
 * snapshots and a diff. All values are the real demo pair (22 Oct 2026).
 * Pure SVG/CSS — paths draw in when the visual scrolls into view.
 */
function FlowVisual({ lang }: { lang: Lang }) {
  const fv = landingCopy[lang];
  return (
    <div className="mt-12 overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line bg-black/25 px-4 py-2.5">
        <span className="font-data text-xs text-slate-400">{fv.flowHeader}</span>
        <span className="text-xs text-slate-500">{fv.flowRight}</span>
      </div>
      <div className="grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
        {/* Console lane: one call, one answer, nothing kept. */}
        <div className="px-5 py-5">
          <p className="text-xs text-slate-500">{fv.flowConsoleLane}</p>
          <svg viewBox="0 0 320 44" className="mt-4 w-full" aria-hidden="true">
            <path pathLength={100} d="M8 22 H104" fill="none" stroke="#64748b" strokeWidth="1.6" />
            <line x1="128" y1="22" x2="312" y2="22" stroke="#475569" strokeWidth="1.2" strokeDasharray="3 6" opacity="0.5" />
            <circle cx="116" cy="22" r="5" fill="#0a1226" stroke="#94a3b8" strokeWidth="1.6" />
          </svg>
          <p className="mt-3 font-data text-[12.5px] leading-relaxed text-slate-400">
            eth_blockNumber → <span className="text-slate-200">143,764</span>
            <span className="text-slate-600">{fv.flowConsoleBody}</span>
          </p>
        </div>
        {/* NodeScope lane: same call, kept twice, diffed, exported. */}
        <div className="px-5 py-5">
          <p className="text-xs text-slate-300">{fv.flowNodescopeLane}</p>
          <svg viewBox="0 0 320 44" className="mt-4 w-full" aria-hidden="true">
            <path pathLength={100} d="M8 22 H312" fill="none" stroke="#7DB4FF" strokeWidth="1.6" />
            <circle cx="8" cy="22" r="5" fill="#0a1226" stroke="#7DB4FF" strokeWidth="1.8" />
            <circle cx="140" cy="22" r="5" fill="#0a1226" stroke="#7DB4FF" strokeWidth="1.8" />
            <circle cx="238" cy="22" r="5" fill="#0a1226" stroke="#34d399" strokeWidth="1.8" />
            <circle cx="312" cy="22" r="5" fill="#0a1226" stroke="#e2e8f0" strokeWidth="1.8" />
          </svg>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-data text-[11px] text-slate-500">
            <span>A · <span className="text-slate-200">143,764</span></span>
            <span>B · <span className="text-slate-200">143,776</span></span>
            <span className="text-emerald-400">{fv.flowDelta}</span>
            <span className="text-slate-300">{fv.flowReportExported}</span>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
            {fv.flowNodescopeBody}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ evidence grid ----------------------------- */

/* ------------------------------ HUD hero arc ------------------------------ */

/**
 * Receipt HUD hero arc: one flat blue arc with a single dot travelling along
 * it. It is ambient decoration only, it carries no data, and it never implies
 * a live block height. The live number stays in the Live Readout card, which
 * is fetched once when the page loads.
 */
/* --------------------------- scroll progress ------------------------------ */

function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] bg-black/40">
      <div className="h-full bg-[#7DB4FF]" style={{ width: `${progress}%` }} />
    </div>
  );
}

/* ------------------------------ word fill --------------------------------- */

/**
 * Scroll-scrubbed word fill for the problem statement. Pure presentation:
 * the full sentence is also rendered sr-only, so the text itself never
 * changes, only how brightly each word is lit as the reader scrolls.
 */
function WordFill({ sentence }: { sentence: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  // Reduced-motion readers see the full sentence at once, decided at
  // first render instead of an effect that sets state after mount.
  const [progress, setProgress] = useState(() =>
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0,
  );
  useEffect(() => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Words finish lighting once the heading's center reaches mid-viewport:
      // a fixed 35%-of-viewport scroll window, so a tall heading no longer
      // needs to be scrolled far past before its last word clears.
      const center = rect.top + rect.height / 2;
      const p = (window.innerHeight * 0.85 - center) / (window.innerHeight * 0.35);
      setProgress(Math.min(1, Math.max(0, p)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const words = sentence.split(' ');
  return (
    <p ref={ref} aria-hidden="true" className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-[40px]">
      {words.map((w, i) => {
        const lit = progress * words.length > i;
        return (
          <span
            key={i}
            style={{ transition: 'color 0.3s ease, filter 0.3s ease', filter: lit ? 'blur(0px)' : 'blur(1.5px)' }}
            className={lit ? 'text-white' : 'text-slate-600'}
          >
            {w}{' '}
          </span>
        );
      })}
    </p>
  );
}


/* ------------------------------ typewriter -------------------------------- */
/**
 * Typewriter for the report JSON sample in How It Works only. Types once
 * when scrolled into view, then stops with the full text plus a replay
 * button. Reduced motion shows the full text immediately. The visible
 * block is aria-hidden; screen readers get the complete plain sample.
 */
const JSON_TOKENS: { t: string; c: string }[] = [
  { t: "{", c: "text-slate-500" },
  { t: "\n  ", c: "" },
  { t: '"schema"', c: "text-slate-100" },
  { t: ": ", c: "text-slate-500" },
  { t: '"nodescope.diagnostic-report.v1"', c: "text-sky-300/90" },
  { t: ",", c: "text-slate-500" },
  { t: "\n  ", c: "" },
  { t: '"endpoint"', c: "text-slate-100" },
  { t: ": ", c: "text-slate-500" },
  { t: '"https://test-evm-rpc-v3.portaldot.dev"', c: "text-sky-300/90" },
  { t: ",", c: "text-slate-500" },
  { t: "\n  ", c: "" },
  { t: '"chainId"', c: "text-slate-100" },
  { t: ": ", c: "text-slate-500" },
  { t: '"0x190f1ca9 (420420777)"', c: "text-sky-300/90" },
  { t: ",", c: "text-slate-500" },
  { t: "\n  ", c: "" },
  { t: '"summary"', c: "text-slate-100" },
  { t: ": ", c: "text-slate-500" },
  { t: '{ "total":', c: "text-slate-500" },
  { t: " 13", c: "text-amber-200/90" },
  { t: ', "success":', c: "text-slate-500" },
  { t: " 13", c: "text-amber-200/90" },
  { t: ', "errors":', c: "text-slate-500" },
  { t: " 0 ", c: "text-amber-200/90" },
  { t: "}", c: "text-slate-500" },
  { t: ",", c: "text-slate-500" },
  { t: "\n  ", c: "" },
  { t: '"findings"', c: "text-slate-100" },
  { t: ": ", c: "text-slate-500" },
  { t: '[{ "ruleId":', c: "text-slate-500" },
  { t: ' "chain-id-verified"', c: "text-sky-300/90" },
  { t: ', "severity":', c: "text-slate-500" },
  { t: ' "info" ', c: "text-sky-300/90" },
  { t: "}]", c: "text-slate-500" },
  { t: "\n", c: "" },
  { t: "}", c: "text-slate-500" },
];
const JSON_TOTAL = JSON_TOKENS.reduce((a, tok) => a + tok.t.length, 0);
const JSON_PLAIN = JSON_TOKENS.map((tok) => tok.t).join("");

function TypewriterJson({ replayLabel }: { replayLabel: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  // Reduced-motion readers see the full JSON at once, decided at first
  // render instead of an effect that sets state after mount.
  const [count, setCount] = useState(() =>
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? JSON_TOTAL : 0,
  );
  const [run, setRun] = useState(0);
  const done = count >= JSON_TOTAL;
  useEffect(() => {
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    if (!inView || done) return;
    const id = window.setInterval(() => {
      setCount((c) => {
        const n = Math.min(JSON_TOTAL, c + 2);
        if (n >= JSON_TOTAL) window.clearInterval(id);
        return n;
      });
    }, 24);
    return () => window.clearInterval(id);
  }, [inView, run, done]);
  let remaining = count;
  const parts = [];
  for (let i = 0; i < JSON_TOKENS.length && remaining > 0; i++) {
    const tok = JSON_TOKENS[i];
    const take = tok.t.slice(0, remaining);
    parts.push(
      <span key={i} className={tok.c}>
        {take}
      </span>,
    );
    remaining -= take.length;
  }
  return (
    <div ref={ref}>
      <pre aria-hidden="true" className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-slate-400">
        <code>
          {parts}
          {inView && !done ? <span className="animate-pulse text-sky-300">▍</span> : null}
        </code>
      </pre>
      <pre className="sr-only">{JSON_PLAIN}</pre>
      {done ? (
        <div className="flex justify-end border-t border-line px-4 py-2.5">
          <button
            type="button"
            onClick={() => {
              setCount(0);
              setRun((r) => r + 1);
            }}
            className="font-data text-[11px] uppercase tracking-[0.16em] text-sky-300 hover:text-sky-200"
          >
            ↻ {replayLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ packet flow -------------------------------- */

/**
 * Packet flow: three dots travelling from YOU to NODE to RECEIPT along one
 * line, labelled with real method names. Pure decoration: it carries no live
 * data, no block height, and no result, and the caption says so.
 */
export function Landing() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [lang, setLangState] = useState<Lang>(() => readStoredLang());
  const setLang = (l: Lang) => {
    setLangState(l);
    storeLang(l);
  };
  const t = landingCopy[lang];
  const [showcaseTab, setShowcaseTab] = useState<'health' | 'fees'>('health');
  const [hash, setHash] = useState('');

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  return (
    <div className="landing-root min-h-screen bg-ink font-sans text-slate-200 antialiased selection:bg-[#8C1DEF]/40 selection:text-white">
      <IntroSplash scope="landing" />
      {/* Scroll progress lives here, as a direct child of the root: every
          section below is position:relative + z-index:1, which traps any
          fixed element rendered inside it — that is how the bar used to
          disappear behind later sections while scrolling. At z-[100] it
          stays above the nav (z-40), modals (z-50), and every section. */}
      <ScrollProgress />
      {/* -------------------------------- nav ------------------------------- */}
      <SiteHeader
        nav={t.nav}
        lang={lang}
        setLang={setLang}
        menuId="landing-mobile-menu"
        variant="landing"
        launchLabel={t.launchApp}
        launchHref={APP_URL}
        langGroupAria={t.langGroupAria}
        menuToggleAria={t.menuToggleAria}
      />

      <main>
      {/* -------------------------------- hero ------------------------------ */}
      <section className="relative overflow-hidden px-4 pb-24 pt-32 md:pt-40">
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h1 className="text-[clamp(2.75rem,6vw,5rem)] font-medium leading-[1.02] tracking-tight text-white">
              {t.heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">
              {t.heroSentence}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <a href={APP_URL} className="inline-flex items-center gap-2 rounded-lg bg-[#7DB4FF] px-6 py-3.5 text-[15px] font-medium text-[#060b1d] transition hover:brightness-110">
                {t.launchApp}
                <ArrowRight className="h-4.5 w-4.5" />
              </a>
              <a href={DEMO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-3.5 text-[15px] font-medium text-slate-300 transition-colors hover:text-white">
                {t.watchDemo}
                <ArrowUpRight className="h-4.5 w-4.5" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="/judges" className="rounded-lg border border-line px-3 py-2 font-data text-xs text-slate-300 transition-colors hover:text-white">
                Registry {REGISTRY_CONTRACT.slice(0, 6)}…{REGISTRY_CONTRACT.slice(-4)}
              </a>
              <a href={`/verify?hash=${ANCHORED_REPORTS[2].hash}&contract=${REGISTRY_CONTRACT}&tx=${ANCHORED_REPORTS[2].tx}`} className="rounded-lg border border-line px-3 py-2 font-data text-xs text-slate-300 transition-colors hover:text-white">
                {ANCHORED_REPORTS[2].hash.slice(0, 10)}…{ANCHORED_REPORTS[2].hash.slice(-6)}
              </a>
              <a href="/app/fee-lab" className="rounded-lg border border-line px-3 py-2 font-data text-xs text-slate-300 transition-colors hover:text-white">
                124.098 / 122.191 tPOT
              </a>
            </div>
          </div>
          <div className="lg:col-span-7 lg:-mr-16">
            <OrbitHero />
          </div>
        </div>
      </section>

      {/* ---------------------------- showcase ------------------------------ */}
      <section className="border-b border-line px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-white">
            {t.showcaseTitle}
          </h2>
          <div className="mt-8 flex gap-6 border-b border-line" role="tablist" aria-label="Product showcase">
            <button
              type="button"
              role="tab"
              aria-selected={showcaseTab === 'health'}
              onClick={() => setShowcaseTab('health')}
              className={showcaseTab === 'health' ? 'border-b-2 border-[#7DB4FF] pb-2 text-white' : 'pb-2 text-slate-400 transition-colors hover:text-white'}
            >
              Health
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={showcaseTab === 'fees'}
              onClick={() => setShowcaseTab('fees')}
              className={showcaseTab === 'fees' ? 'border-b-2 border-[#7DB4FF] pb-2 text-white' : 'pb-2 text-slate-400 transition-colors hover:text-white'}
            >
              Fees
            </button>
          </div>
          <div className="mt-8" role="tabpanel">
            {showcaseTab === 'health' ? (
              <LiveReadout lang={lang} />
            ) : (
              <div className="max-w-2xl">
                <p className="text-base leading-relaxed text-slate-400">{t.feeBlockBody}</p>
                <p className="mt-4 font-data text-sm text-slate-200">{t.feeBlockEvm}</p>
                <p className="mt-1 font-data text-sm text-slate-200">{t.feeBlockNative}</p>
                <a href="/app/fee-lab" className="mt-6 inline-block text-[15px] font-medium text-[#7DB4FF] transition-colors hover:text-white">
                  {t.feeBlockCta}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------ pillars ------------------------------- */}
      <section className="cv-auto border-b border-line px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-white">{t.pillarSectionTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">{t.pillarSectionIntro}</p>
          <div className="mt-8">
            <PillarCards health={t.pillarHealth} fees={t.pillarFees} />
          </div>
        </div>
      </section>

      {/* --------------------------- announcement banner ----------------------- */}
      <div className="border-y border-line bg-black/30 px-4 py-3">
        <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center font-data text-xs text-slate-400">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          {t.banner}
        </p>
      </div>

      {/* ------------------------------- stats ------------------------------ */}
      <section className="cv-auto border-y border-line bg-deep/60 px-4 py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          {t.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <p className="font-data text-3xl font-medium text-white md:text-4xl">{s.value}</p>
              <p className="mt-2 font-data text-[11px] text-slate-300">{s.label}</p>
              <p className="mt-1.5 max-w-[26ch] text-xs leading-relaxed text-slate-500">{s.sub}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------ problem ----------------------------- */}
      <section id="problem" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.problemTitle} right={t.problemRight} />
            <div className="grid gap-10 md:grid-cols-2">
              <h2 className="sr-only">{t.problemStatement}</h2>
              <WordFill sentence={t.problemStatement} />
              <div className="space-y-4 text-base leading-[1.85] text-slate-400">
                <p>
                  {t.problemPara1a}<span className="text-slate-200">{t.problemPara1Emphasis}</span>{t.problemPara1b}
                </p>
                <p>
                  {t.problemPara2}
                </p>
                <div className="space-y-2.5 pt-2 font-data text-[13px]">
                  <p className="flex gap-3"><span className="shrink-0 text-slate-600">{t.consoleLabel}</span> <span>{t.consoleQuote}</span></p>
                  <p className="flex gap-3"><span className="shrink-0 font-semibold text-slate-100">{t.nodescopeLabel}</span> <span className="text-slate-200">{t.nodescopeQuote}</span></p>
                </div>
              </div>
            </div>
            <div className="mt-10">
              <h3 className="text-lg font-medium text-white">{t.whyTitle}</h3>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {t.whyItems.map((item) => (
                  <li key={item} className="py-3 text-[15px] leading-[1.85] text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <FlowVisual lang={lang} />
          </Reveal>
        </div>
      </section>

      {/* -------------------------------- how ------------------------------- */}
      <section id="how" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.howTitle} right={t.howRight} />
            <div className="overflow-hidden rounded-lg border border-line">
              {t.howSteps.map((s) => (
                <div key={s.title} className="grid gap-2 border-b border-line px-6 py-6 last:border-b-0 md:grid-cols-12">
                  <h3 className="text-lg font-medium text-white md:col-span-4">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400 md:col-span-8">{s.body}</p>
                </div>
              ))}
              <div className="px-6 py-5">
                <p className="text-sm leading-relaxed text-slate-400">{t.howAnchorLine}</p>
                <a href={`/verify?hash=${ANCHORED_REPORTS[2].hash}&contract=${REGISTRY_CONTRACT}&tx=${ANCHORED_REPORTS[2].tx}`} className="mt-2 inline-block font-data text-sm text-[#7DB4FF] transition-colors hover:text-white">
                  {ANCHORED_REPORTS[2].hash.slice(0, 10)}…{ANCHORED_REPORTS[2].hash.slice(-6)} →
                </a>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-medium text-white">{t.archTitle}</h3>
                <span className="text-sm text-slate-500">{t.archRight}</span>
              </div>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {t.archNodes.map((node) => (
                  <li key={node} className="py-3 text-sm leading-relaxed text-slate-300">
                    {node}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
              <div className="flex items-center justify-between border-b border-line bg-black/25 px-4 py-2.5">
                <span className="font-data text-xs text-slate-400">{t.reportSampleLabel}</span>
                <span className="text-xs text-slate-500">{t.reportSampleRight}</span>
              </div>
              <TypewriterJson replayLabel={t.typeReplay} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------ tutorial ------------------------------ */}
      <section id="tutorial" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.tutorialTitle} right={t.tutorialRight} />
            <p className="max-w-3xl text-[15px] leading-[1.85] text-slate-400">
              {t.tutorialIntro}
            </p>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {t.tutorialSteps.map((s) => (
                <li key={s.n} className="grid gap-2 py-6 md:grid-cols-12">
                  <h3 className="text-lg font-medium text-white md:col-span-4">{s.title}</h3>
                  <p className="text-[15px] leading-[1.85] text-slate-400 md:col-span-8">{s.body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <p className="text-lg font-medium text-white">{t.tutorialCtaTitle}</p>
              <p className="mt-2 text-[15px] leading-[1.85] text-slate-400">
                {t.tutorialCtaBody}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={APP_URL} className="inline-flex items-center gap-2 rounded-lg bg-[#7DB4FF] px-5 py-3 text-sm font-medium text-[#060b1d] transition hover:brightness-110">
                  {t.tutorialCtaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="/verify" className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-3 text-sm font-medium text-slate-200 transition-colors hover:text-white">
                  {t.tutorialCtaSecondary}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------- instrument ---------------------------- */}
      <section id="instrument" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.instrumentTitle} right={t.instrumentRight} />
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <CheckTranscript lang={lang} />
              {/* snapshot diff artifact */}
              <div className="overflow-hidden rounded-lg border border-line bg-panel">
                <div className="flex items-center justify-between border-b border-line bg-black/25 px-4 py-2.5">
                  <span className="font-data text-xs text-slate-400">{t.diffHeader}</span>
                  <span className="text-xs text-slate-500">{t.diffRight}</span>
                </div>
                <div className="px-5 py-5 font-data text-[12.5px] leading-[1.9]">
                  <p><span className="mr-4 text-slate-600">01</span><span className="text-slate-500"># nodescope.health-snapshot.v1 — diff A → B</span></p>
                  <p><span className="mr-4 text-slate-600">02</span><span className="text-slate-400">A · block 143,764 · 15:48:05 WIB</span></p>
                  <p><span className="mr-4 text-slate-600">03</span><span className="text-slate-400">B · block 143,776 · 15:49:21 WIB</span></p>
                  <p><span className="mr-4 text-slate-600">04</span><span className="text-slate-500">eth_chainId&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0x190f1ca9 → 0x190f1ca9&nbsp;&nbsp;<span className="text-slate-500">{t.diffUnchanged}</span></span></p>
                  <p className="-mx-5 bg-red-400/[0.06] px-5"><span className="mr-4 text-slate-600">05</span><span className="text-red-300">− eth_blockNumber&nbsp;&nbsp;&nbsp;143,764</span></p>
                  <p className="-mx-5 bg-emerald-400/[0.07] px-5"><span className="mr-4 text-slate-600">06</span><span className="text-emerald-300">+ eth_blockNumber&nbsp;&nbsp;&nbsp;143,776&nbsp;&nbsp;Δ +12</span></p>
                  <p><span className="mr-4 text-slate-600">07</span><span className="text-slate-500">net_version&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;420420777 → 420420777&nbsp;&nbsp;{t.diffUnchanged}</span></p>
                  <p><span className="mr-4 text-slate-600">08</span><span className="text-slate-500">findings&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{t.diffFindings}</span></p>
                </div>
                <p className="border-t border-line px-5 py-3 text-xs text-slate-500">
                  {t.diffFooter}
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-6 hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line text-sm text-slate-500">
                    <th className="px-5 py-3.5 font-medium">{t.capabilityHeaders[0]}</th>
                    <th className="hidden px-5 py-3.5 font-medium md:table-cell">{t.capabilityHeaders[1]}</th>
                    <th className="px-5 py-3.5 font-medium">{t.capabilityHeaders[2]}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm">
                  {t.capabilities.map((r) => (
                    <tr key={r.cap}>
                      <td className="px-5 py-4 font-data text-[13px] font-medium text-white">
                        {r.cap}
                      </td>
                      <td className="hidden max-w-md px-5 py-4 leading-relaxed text-slate-400 md:table-cell">{r.what}</td>
                      <td className="px-5 py-4 text-sm text-slate-400">{r.proof}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 divide-y divide-line border-y border-line md:hidden">
              {t.capabilities.map((r) => (
                <div key={r.cap} className="py-4">
                  <p className="font-data text-[13px] font-medium text-white">
                    {r.cap}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{r.what}</p>
                  <p className="mt-2 text-sm text-slate-400">{r.proof}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------- evidence ----------------------------- */}
      <section id="evidence" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.evidenceTitle} right={t.evidenceRight} />
            <p className="max-w-3xl text-sm leading-relaxed text-slate-400">{t.evidenceRangeLine}</p>
            <div className="mt-6 hidden md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-sm text-slate-500">
                    <th className="px-5 py-3.5 font-medium">{t.evidenceHeaders[0]}</th>
                    <th className="px-5 py-3.5 font-medium">{t.evidenceHeaders[1]}</th>
                    <th className="hidden px-5 py-3.5 font-medium md:table-cell">{t.evidenceHeaders[2]}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-data text-[13px]">
                  {t.evidenceRows.map((r) => (
                    <tr key={r.block}>
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {r.block}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {r.label}
                        {'delta' in r && r.delta ? (
                          <span className="ml-2 text-slate-400">
                            Δ {r.delta}
                          </span>
                        ) : null}
                      </td>
                      <td className="hidden px-5 py-3.5 text-slate-500 md:table-cell">{r.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 divide-y divide-line border-y border-line md:hidden">
              {t.evidenceRows.map((r) => (
                <div key={r.block} className="py-4 font-data text-[13px]">
                  <p className="font-semibold text-white">{r.block}</p>
                  <p className="mt-1 text-slate-300">
                    {r.label}
                    {'delta' in r && r.delta ? (
                      <span className="ml-2 text-slate-400">
                        Δ {r.delta}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-slate-500">{r.when}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {t.evidenceFootnote}
            </p>
            <figure className="mt-8 overflow-hidden rounded-lg border border-line">
              <MotionVideo caption={t.motionCaption} />
              <figcaption className="px-5 py-3.5">
                <p className="text-sm text-slate-300">{t.motionCaption}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{t.motionNote}</p>
              </figcaption>
            </figure>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {t.screenshots.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className={`overflow-hidden rounded-lg border border-line text-left transition-colors hover:border-slate-500/40 ${i === 0 ? 'col-span-2 lg:col-span-1' : ''}`}
                >
                  <span className="block">
                    <span className="flex items-center gap-1.5 border-b border-line bg-black/30 px-4 py-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#7DB4FF]" />
                      <span className="ml-2 text-xs text-slate-500">{t.galleryLabel}</span>
                    </span>
                    <span className="block overflow-hidden">
                      <img src={s.src} alt={s.caption} className="aspect-[16/10] w-full object-cover object-top" loading="lazy" />
                    </span>
                    <span className="flex items-center justify-between px-4 py-3 text-xs text-slate-400">
                      {s.caption}
                      <span aria-hidden="true">↗</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------- on-chain evidence --------------------------- */}
      <section id="onchain" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.onchainTitle} right={t.onchainRight} />
            <p className="max-w-3xl text-[15px] leading-[1.85] text-slate-400">{t.onchainIntro}</p>
            <div className="mt-6 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              <div className="border-t border-line pt-6">
                <p className="text-sm font-medium text-[#7DB4FF]">Registry</p>
                <p className="mt-2 break-all font-data text-sm text-slate-200">{REGISTRY_CONTRACT}</p>
                <p className="mt-2 text-xs text-slate-500">Portaldot V3 testnet · chain {PORTALDOT_CHAIN_ID}</p>
              </div>
              {ANCHORED_REPORTS.map((r) => (
                <div key={r.hash} className="border-t border-line pt-6">
                  <p className="text-sm font-medium text-white">{r.label}</p>
                  <p className="mt-2 break-all font-data text-sm text-slate-200">{r.hash}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Block {r.block} ·{' '}
                    <a href={`/verify?hash=${r.hash}&contract=${REGISTRY_CONTRACT}&tx=${r.tx}`} className="text-[#7DB4FF] transition-colors hover:text-white">
                      Verify →
                    </a>
                  </p>
                  <p className="mt-1 break-all font-data text-xs text-slate-500"><span className="text-slate-600">tx </span><span>{r.tx}</span></p>
                </div>
              ))}
              <div className="border-t border-line pt-6">
                <p className="text-sm font-medium text-white">Fees</p>
                <p className="mt-2 font-data text-sm text-slate-200">{t.feeBlockEvm}</p>
                <p className="mt-1 font-data text-sm text-slate-200">{t.feeBlockNative}</p>
                <p className="mt-2 text-xs text-slate-500">
                  <a href="/app/fee-lab" className="text-[#7DB4FF] transition-colors hover:text-white">
                    {t.feeBlockCta} →
                  </a>
                </p>
              </div>
            </div>
            <div className="mt-12">
              <h3 className="text-lg font-medium text-white">{t.onchainCheckTitle}</h3>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {t.onchainCheckSteps.map((s) => (
                  <li key={s} className="py-3 text-[15px] leading-[1.85] text-slate-400">
                    {s}
                  </li>
                ))}
              </ul>
              <a
                href={`/verify?hash=${ANCHORED_REPORT_HASH}&contract=${REGISTRY_CONTRACT}&tx=${ANCHOR_TX}`}
                className="mt-4 inline-block rounded-lg bg-[#7DB4FF] px-4 py-2.5 text-sm font-medium text-[#060b1d] transition hover:brightness-110"
              >
                Verify this anchor on /verify
              </a>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">{t.onchainVerifyNote}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------ who uses ------------------------------ */}
      <section id="who" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.whoTitle} right={t.whoRight} />
            <ul className="divide-y divide-line border-y border-line">
              {t.whoItems.map((item) => (
                <li key={item.title} className="grid gap-2 py-6 md:grid-cols-12">
                  <h3 className="text-lg font-medium text-white md:col-span-4">{item.title}</h3>
                  <p className="text-[15px] leading-[1.85] text-slate-400 md:col-span-8">{item.body}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------- V3 references ------------------------------ */}
      <section id="v3" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.v3Title} right={t.v3Right} />
            <p className="mt-3 max-w-3xl text-[15px] leading-[1.85] text-slate-400">
              {t.v3Intro}
            </p>
            <div className="mt-6 divide-y divide-line border-y border-line">
              {t.v3Cards.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="block py-6">
                  <p className="flex items-center justify-between text-sm text-slate-400">
                    {link.label}
                    <span aria-hidden="true">↗</span>
                  </p>
                  <p className="mt-2 break-all font-data text-xs text-slate-300">{link.href}</p>
                  <p className="mt-1.5 text-xs text-slate-500">{link.note}</p>
                </a>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {t.v3Footnote}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------- roadmap ------------------------------ */}
      <section id="roadmap" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.roadmapTitle} right={t.roadmapRight} />
            <div className="divide-y divide-line border-y border-line">
              {t.roadmapItems.map((r) => (
                <div key={r.title} className="py-6">
                  <span className="text-sm text-emerald-400">
                    {t.roadmapShipped}
                  </span>
                  <h3 className="mt-2 text-lg font-medium text-white">{r.title}</h3>
                  <p className="mt-2 text-[15px] leading-[1.85] text-slate-400">{r.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <p className="text-sm text-amber-300">{t.roadmapNextLabel}</p>
              <div className="mt-2 divide-y divide-line border-y border-line">
                {t.roadmapNextItems.map((r) => (
                  <div key={r.title} className="py-6">
                    <h3 className="text-base font-medium text-white">{r.title}</h3>
                    <p className="mt-1 text-[15px] leading-[1.85] text-slate-400">{r.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-500">
              {t.roadmapFootnote}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------- pricing ------------------------------ */}
      <section id="pricing" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.pricingTitle} />
            <div className="divide-y divide-line border-y border-line">
              <div className="grid gap-2 py-6 md:grid-cols-12">
                <h3 className="text-lg font-medium text-white md:col-span-4">{t.pricingFreeName}</h3>
                <p className="text-[15px] leading-[1.85] text-slate-400 md:col-span-8">{t.pricingFreeBody}</p>
              </div>
              <div className="grid gap-2 py-6 md:grid-cols-12">
                <h3 className="text-lg font-medium text-white md:col-span-4">{t.pricingPaidName}</h3>
                <p className="text-[15px] leading-[1.85] text-slate-400 md:col-span-8">{t.pricingPaidBody}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------- judge quickstart ------------------------ */}
      <section id="judge" className="cv-auto scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading title={t.judgeTitle} right={t.judgeRight} />
            <p className="max-w-3xl text-[15px] leading-[1.85] text-slate-400">
              {t.judgeIntro}
            </p>
            <div className="mt-6 overflow-hidden rounded-lg border border-line">
              {t.judgeSteps.map((s) => (
                <div key={s.title} className="grid gap-2 border-b border-line px-6 py-6 last:border-b-0 md:grid-cols-12">
                  <h3 className="text-lg font-medium text-white md:col-span-4">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400 md:col-span-8">{s.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {t.judgeFootnote}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------- CTA -------------------------------- */}
      <section className="cv-auto px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-tight tracking-tight text-white">
            {t.ctaTitleA}{t.ctaTitleB}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
            {t.ctaBody}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = hash.trim();
              if (!v) return;
              const h = v.startsWith('0x') ? v : `0x${v}`;
              window.location.href = `/verify?hash=${h}`;
            }}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="cta-hash">{t.ctaHashPlaceholder}</label>
            <input
              id="cta-hash"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder={t.ctaHashPlaceholder}
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-4 py-3 font-data text-sm text-white placeholder:text-slate-500 focus:border-[#7DB4FF] focus:outline-none"
            />
            <button type="submit" className="rounded-lg bg-[#7DB4FF] px-5 py-3 text-sm font-medium text-[#060b1d] transition hover:brightness-110">
              {t.ctaHashButton}
            </button>
          </form>
          <a href={APP_URL} className="mt-6 inline-block text-sm font-medium text-[#7DB4FF] transition-colors hover:text-white">
            {t.launchApp} →
          </a>
        </div>
      </section>

      </main>
      <SiteFooter t={t} />

      {/* ----------------------------- lightbox ----------------------------- */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t.screenshots[lightbox].caption}
        >
          <button
            type="button"
            aria-label={t.lightboxClose}
            className="btn-ghost absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <figure className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img src={t.screenshots[lightbox].src} alt={t.screenshots[lightbox].caption} className="mx-auto block max-h-[82vh] w-auto max-w-full rounded-xl border border-line" />
            <figcaption className="mt-3 text-center font-data text-xs uppercase tracking-[0.16em] text-slate-400">
              {t.screenshots[lightbox].caption}
            </figcaption>
          </figure>
        </div>
      )}
      <BackToTop label={t.backToTop} />
    </div>
  );
}
