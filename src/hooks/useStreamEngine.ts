import { useCallback, useEffect, useRef, useState } from "react";
import type { StreamConfig } from "../lib/engine";

export type Phase = "idle" | "ttft" | "streaming" | "paused" | "done";

export interface EngineFrame {
  phase: Phase;
  emitted: number;
  total: number;
  elapsedMs: number;  // tempo total (inclui TTFT)
  streamMs: number;   // só geração
  instRate: number;   // tok/s instantâneo (suavizado)
  avgRate: number;    // tok/s médio da geração
  history: number[];  // amostras de taxa p/ sparkline
  finishMs: number | null;
}

export interface Engine {
  frame: EngineFrame;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

const baseFrame = (total: number): EngineFrame => ({
  phase: "idle",
  emitted: 0,
  total,
  elapsedMs: 0,
  streamMs: 0,
  instRate: 0,
  avgRate: 0,
  history: [],
  finishMs: null,
});

export function useStreamEngine(cfg: StreamConfig, total: number): Engine {
  const [frame, setFrame] = useState<EngineFrame>(() => baseFrame(total));

  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const totalRef = useRef(total);
  totalRef.current = total;

  const phase = useRef<Phase>("idle");
  const pausedFrom = useRef<Phase>("streaming");
  const emitted = useRef(0);
  const acc = useRef(0);
  const noise = useRef(0);
  const ema = useRef(0);
  const elapsed = useRef(0);
  const streamAcc = useRef(0);
  const ttftLeft = useRef(0);
  const last = useRef(0);
  const lastSample = useRef(0);
  const history = useRef<number[]>([]);
  const finish = useRef<number | null>(null);
  const raf = useRef(0);

  const publish = useCallback(() => {
    const s = streamAcc.current / 1000;
    setFrame({
      phase: phase.current,
      emitted: emitted.current,
      total: totalRef.current,
      elapsedMs: elapsed.current,
      streamMs: streamAcc.current,
      instRate: ema.current,
      avgRate: s > 0 ? emitted.current / s : 0,
      history: history.current,
      finishMs: finish.current,
    });
  }, []);

  const stopLoop = () => cancelAnimationFrame(raf.current);

  const tick = useCallback(
    (ts: number) => {
      const dtMs = Math.min(ts - last.current, 120);
      last.current = ts;
      const dt = dtMs / 1000;
      const c = cfgRef.current;
      const tot = totalRef.current;

      if (phase.current === "ttft") {
        elapsed.current += dtMs;
        ttftLeft.current -= dtMs;
        if (ttftLeft.current <= 0) {
          phase.current = "streaming";
          streamAcc.current = 0;
        }
      } else if (phase.current === "streaming") {
        elapsed.current += dtMs;
        streamAcc.current += dtMs;

        // ruído com reversão à média → taxa realisticamente instável
        noise.current += (Math.random() - 0.5) * 14 * dt;
        noise.current *= Math.pow(0.22, dt);
        noise.current = Math.max(-1, Math.min(1, noise.current));

        const rate = Math.max(0.4, c.tps * (1 + c.jitter * noise.current));
        ema.current += (rate - ema.current) * Math.min(1, dt * 5);

        acc.current += rate * dt;
        const n = Math.floor(acc.current);
        if (n > 0) {
          acc.current -= n;
          emitted.current = Math.min(tot, emitted.current + n);
        }

        if (ts - lastSample.current > 90) {
          lastSample.current = ts;
          history.current = [...history.current.slice(-159), rate];
        }

        if (emitted.current >= tot) {
          phase.current = "done";
          finish.current = elapsed.current;
          publish();
          return;
        }
      }

      publish();
      raf.current = requestAnimationFrame(tick);
    },
    [publish]
  );

  const start = useCallback(() => {
    if (totalRef.current <= 0) return;
    stopLoop();
    emitted.current = 0;
    acc.current = 0;
    noise.current = 0;
    ema.current = 0;
    elapsed.current = 0;
    streamAcc.current = 0;
    history.current = [];
    finish.current = null;
    const c = cfgRef.current;
    ttftLeft.current = c.ttftMs;
    phase.current = c.ttftMs > 0 ? "ttft" : "streaming";
    last.current = performance.now();
    lastSample.current = last.current;
    publish();
    raf.current = requestAnimationFrame(tick);
  }, [publish, tick]);

  const pause = useCallback(() => {
    if (phase.current === "streaming" || phase.current === "ttft") {
      stopLoop();
      pausedFrom.current = phase.current;
      phase.current = "paused";
      publish();
    }
  }, [publish]);

  const resume = useCallback(() => {
    if (phase.current !== "paused") return;
    phase.current = pausedFrom.current;
    last.current = performance.now();
    publish();
    raf.current = requestAnimationFrame(tick);
  }, [publish, tick]);

  const reset = useCallback(() => {
    stopLoop();
    phase.current = "idle";
    emitted.current = 0;
    acc.current = 0;
    noise.current = 0;
    ema.current = 0;
    elapsed.current = 0;
    streamAcc.current = 0;
    history.current = [];
    finish.current = null;
    publish();
  }, [publish]);

  // texto mudou → reinicia
  useEffect(() => {
    reset();
  }, [total, reset]);

  useEffect(() => () => stopLoop(), []);

  return { frame, start, pause, resume, reset };
}
