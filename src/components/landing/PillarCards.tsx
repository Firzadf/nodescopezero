import { useEffect, useRef, useState } from 'react';
import { measureFeesProof, measureHealthProof } from '../../utils/pillarProof';

import type { PillarCardCopy } from '../../utils/landingLang';

export type { PillarCardCopy };

type ProofState =
  | { kind: 'idle' }
  | { kind: 'measuring' }
  | { kind: 'done'; value: string; at: Date }
  | { kind: 'error' };

function useOneShot(measure: () => Promise<string>) {
  const [state, setState] = useState<ProofState>({ kind: 'idle' });
  const startedRef = useRef(false);
  const aliveRef = useRef(true);
  useEffect(
    () => () => {
      aliveRef.current = false;
    },
    [],
  );
  const run = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setState({ kind: 'measuring' });
    measure().then(
      (value) => {
        if (aliveRef.current) setState({ kind: 'done', value, at: new Date() });
      },
      () => {
        if (aliveRef.current) {
          setState({ kind: 'error' });
          startedRef.current = false;
        }
      },
    );
  };
  return { state, run };
}

function PillarCard({
  copy,
  measure,
  valueTestId,
  autoMeasure = true,
}: {
  copy: PillarCardCopy;
  measure: () => Promise<string>;
  valueTestId: string;
  /**
   * Viewport entry measures once. The Fees card opts out: its measurement
   * lazy-loads the ~948 kB @polkadot/api chunk and opens a WSS connection,
   * too expensive to trigger just because the card scrolled into view, so
   * it only measures on an explicit Measure press.
   */
  autoMeasure?: boolean;
}) {
  const { state, run } = useOneShot(measure);
  const ref = useRef<HTMLDivElement>(null);
  // Viewport entry measures once; where IntersectionObserver is missing
  // (tests, old browsers) the card simply waits for the Measure press.
  useEffect(() => {
    const el = ref.current;
    if (!el || !autoMeasure || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // run is stable-by-ref-guard (startedRef); intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} className="border-b border-line py-8 md:grid md:grid-cols-12 md:gap-8">
      <div className="md:col-span-7">
        <p className="text-sm text-slate-400">{copy.kicker}</p>
        <h3 className="mt-2 text-xl font-medium text-white">{copy.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{copy.body}</p>
        <a href={copy.ctaHref} className="mt-4 inline-block text-sm font-medium text-[#7DB4FF] transition-colors hover:text-white">
          {copy.ctaLabel} →
        </a>
      </div>
      <div className="mt-5 md:col-span-5 md:mt-0">
        {state.kind === 'idle' && (
          <button type="button" onClick={run} className="rounded-lg bg-[#7DB4FF] px-4 py-2 text-sm font-medium text-[#060b1d] transition hover:brightness-110">
            {copy.measureLabel}
          </button>
        )}
        {state.kind === 'measuring' && <p className="text-sm text-slate-400">{copy.measuringLabel}</p>}
        {state.kind === 'done' && (
          <div>
            <p data-testid={valueTestId} className="font-data text-2xl tabular-nums text-white">
              {state.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {copy.measuredLabel} {state.at.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Jakarta' })} WIB
            </p>
          </div>
        )}
        {state.kind === 'error' && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-amber-300">{copy.unavailableLabel}</p>
            <button type="button" onClick={run} className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-200 transition-colors hover:text-white">
              {copy.measureLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PillarCards({
  health,
  fees,
  healthMeasure = measureHealthProof,
  feesMeasure = measureFeesProof,
}: {
  health: PillarCardCopy;
  fees: PillarCardCopy;
  healthMeasure?: () => Promise<string>;
  feesMeasure?: () => Promise<string>;
}) {
  return (
    <div className="border-t border-line">
      <PillarCard copy={health} measure={healthMeasure} valueTestId="health-proof-value" />
      <PillarCard copy={fees} measure={feesMeasure} valueTestId="fees-proof-value" autoMeasure={false} />
    </div>
  );
}
