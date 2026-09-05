import { useEffect, useMemo, useRef, useState } from "react";
import { EXAMPLES, fmtNum, fmtTime, tokenize } from "./lib/engine";
import { useStreamEngine, type Phase } from "./hooks/useStreamEngine";
import ConsolePanel from "./components/ConsolePanel";
import Controls from "./components/Controls";
import { IconLogo, IconPlay, IconPause, IconReset, IconColumns } from "./components/Icons";

const RUNNING: Phase[] = ["ttft", "streaming"];

export default function App() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [text, setTextRaw] = useState(EXAMPLES[0].text);
  const [tpsA, setTpsA] = useState(55);
  const [tpsB, setTpsB] = useState(110);
  const [jitter, setJitter] = useState(18);
  const [ttftMs, setTtftMs] = useState(350);
  const [tokenView, setTokenView] = useState(false);
  const [compare, setCompare] = useState(false);

  const setText = (v: string) => {
    setTextRaw(v);
    setExampleIdx(-1);
  };

  const tokens = useMemo(() => tokenize(text), [text]);

  const cfgA = useMemo(() => ({ tps: tpsA, jitter: jitter / 100, ttftMs }), [tpsA, jitter, ttftMs]);
  const cfgB = useMemo(() => ({ tps: tpsB, jitter: jitter / 100, ttftMs }), [tpsB, jitter, ttftMs]);

  const engA = useStreamEngine(cfgA, tokens.length);
  const engB = useStreamEngine(cfgB, tokens.length);

  const fa = engA.frame.phase;
  const fb = engB.frame.phase;
  const engines = compare ? [engA, engB] : [engA];
  const anyRunning = engines.some((e) => RUNNING.includes(e.frame.phase));
  const anyPaused = engines.some((e) => e.frame.phase === "paused");

  const play = () => {
    if (anyRunning) engines.forEach((e) => e.pause());
    else if (anyPaused) engines.forEach((e) => e.resume());
    else engines.forEach((e) => e.start());
  };
  const resetAll = () => engines.forEach((e) => e.reset());

  const playRef = useRef(play);
  playRef.current = play;
  const resetRef = useRef(resetAll);
  resetRef.current = resetAll;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) return;
      if (e.code === "Space") {
        e.preventDefault();
        playRef.current();
      }
      if (e.key === "r" || e.key === "R") resetRef.current();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const estMs = tokens.length > 0 ? ttftMs + (tokens.length / tpsA) * 1000 : 0;

  // veredito A/B
  const bothDone = fa === "done" && fb === "done" && engA.frame.finishMs && engB.frame.finishMs;
  let verdict: { winner: string; diff: number; speedup: number; hex: string } | null = null;
  if (compare && bothDone) {
    const a = engA.frame.finishMs!;
    const b = engB.frame.finishMs!;
    const winner = a <= b ? "A" : "B";
    const diff = Math.abs(a - b);
    verdict = { winner, diff, speedup: Math.max(a, b) / Math.max(Math.min(a, b), 1), hex: a <= b ? "#ffb454" : "#5fd4c4" };
  }

  const statusLabel = anyRunning
    ? "simulando…"
    : anyPaused
      ? "pausado"
      : fa === "done" || (compare && fb === "done")
        ? "concluído"
        : "pronto";

  return (
    <div className="min-h-screen relative overflow-x-clip">
      {/* fundo em camadas */}
      <div className="bg-stage" aria-hidden>
        <div className="bg-grid" />
        <div className="bg-glow a" />
        <div className="bg-glow b" />
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 lg:px-6 py-5 lg:py-7">
        {/* header */}
        <header className="flex items-center gap-3.5 mb-5 rise">
          <IconLogo size={38} />
          <div>
            <h1 className="text-[24px] font-bold leading-none tracking-tight">
              TOK<span style={{ color: "var(--amber)" }}>/</span>S
            </h1>
            <p className="font-mono2 text-[10.5px] text-[var(--muted)] mt-1 tracking-wide">
              simulador de streaming de inferência · tempo real
            </p>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2">
            <span className="chip !cursor-default">motor rAF @ 60 fps</span>
            <span className="chip !cursor-default">~4,5 chars/token</span>
            <span className="chip on !cursor-default">v1.0</span>
          </div>
        </header>

        {/* transporte */}
        <div className="panel flex flex-wrap items-center gap-3 px-4 py-3 mb-4 rise" style={{ animationDelay: "0.04s" }}>
          <button className="btn btn-primary px-5 py-2.5 text-[14px]" onClick={play} disabled={tokens.length === 0}>
            {anyRunning ? <IconPause size={15} /> : <IconPlay size={15} />}
            {anyRunning ? "Pausar" : anyPaused ? "Continuar" : "Iniciar"}
          </button>
          <button className="btn btn-ghost px-4 py-2.5 text-[13px]" onClick={resetAll}>
            <IconReset size={14} />
            Reiniciar
          </button>

          <span className="flex items-center gap-2 font-mono2 text-[11.5px] text-[var(--muted)] pl-3 border-l border-[var(--line)]">
            <span className={`led ${anyRunning ? "amber pulse" : anyPaused ? "amber" : "aqua"}`} />
            {statusLabel}
          </span>

          <span className="ml-auto font-mono2 text-[11px] text-[var(--faint)] t-num text-right leading-relaxed">
            duração estimada <span className="text-[var(--amber)]">(A)</span> ≈ <span className="text-[var(--ink)]">{fmtTime(estMs)}</span>
            <br />
            {tokens.length} tokens · {text.length} chars
          </span>
        </div>

        {/* corpo */}
        <div className="grid lg:grid-cols-[330px_1fr] gap-4 items-start">
          <Controls
            tpsA={tpsA} setTpsA={setTpsA}
            tpsB={tpsB} setTpsB={setTpsB}
            compare={compare} setCompare={setCompare}
            jitter={jitter} setJitter={setJitter}
            ttftMs={ttftMs} setTtftMs={setTtftMs}
            tokenView={tokenView} setTokenView={setTokenView}
            text={text} setText={setText}
            tokensCount={tokens.length}
            exampleIdx={exampleIdx}
            setExampleIdx={(i) => { setExampleIdx(i); setTextRaw(EXAMPLES[i].text); }}
            onShuffle={() => {
              let i = exampleIdx;
              while (i === exampleIdx) i = Math.floor(Math.random() * EXAMPLES.length);
              setExampleIdx(i);
              setTextRaw(EXAMPLES[i].text);
            }}
          />

          <div className="flex flex-col gap-4 min-w-0">
            {verdict && (
              <div className="panel px-4 py-3 flex items-center gap-3 rise">
                <span
                  className="font-mono2 text-[11px] font-bold px-2 py-0.5 rounded"
                  style={{ background: `${verdict.hex}1f`, color: verdict.hex, border: `1px solid ${verdict.hex}55` }}
                >
                  VEREDITO
                </span>
                <p className="font-mono2 text-[12px] text-[var(--muted)] t-num">
                  Canal <span style={{ color: verdict.hex }} className="font-bold">{verdict.winner}</span> terminou{" "}
                  <span className="text-[var(--ink)]">{fmtTime(verdict.diff)}</span> antes ·{" "}
                  <span className="text-[var(--ink)]">{fmtNum(verdict.speedup, 1)}×</span> mais rápido no total
                </p>
                <IconColumns size={16} className="ml-auto text-[var(--faint)]" />
              </div>
            )}

            {compare ? (
              <div className="grid xl:grid-cols-2 gap-4">
                <ConsolePanel title="CANAL A" accent="amber" cfg={cfgA} eng={engA} tokens={tokens} tokenView={tokenView} style={{ animationDelay: "0.1s" }} />
                <ConsolePanel title="CANAL B" accent="aqua" cfg={cfgB} eng={engB} tokens={tokens} tokenView={tokenView} style={{ animationDelay: "0.16s" }} />
              </div>
            ) : (
              <ConsolePanel title="CANAL A" accent="amber" cfg={cfgA} eng={engA} tokens={tokens} tokenView={tokenView} style={{ animationDelay: "0.1s" }} />
            )}

            <footer className="font-mono2 text-[10px] text-[var(--faint)] leading-relaxed px-1 rise" style={{ animationDelay: "0.3s" }}>
              Simulação aproximada de decodificação autoregressiva — a tokenização e a latência reais variam por modelo,
              hardware e carga do servidor. Dica: ative o modo comparação para ver duas configurações lado a lado
              respondendo ao mesmo prompt.
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
