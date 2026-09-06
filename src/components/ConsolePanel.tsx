import { useEffect, useRef } from "react";
import type { StreamConfig } from "../lib/engine";
import { fmtNum, fmtTime } from "../lib/engine";
import type { Engine, Phase } from "../hooks/useStreamEngine";
import Sparkline from "./Sparkline";
import { IconZap } from "./Icons";

const TOKEN_BG = [
  "rgba(95,212,196,0.14)",
  "rgba(255,180,84,0.14)",
  "rgba(183,166,255,0.14)",
  "rgba(255,123,142,0.12)",
];

const STATUS: Record<Phase, string> = {
  idle: "em espera",
  ttft: "aguardando 1º token",
  streaming: "gerando",
  paused: "pausado",
  done: "concluído",
};

interface Props {
  title: string;
  accent: "amber" | "aqua";
  cfg: StreamConfig;
  eng: Engine;
  tokens: string[];
  tokenView: boolean;
  style?: React.CSSProperties;
}

export default function ConsolePanel({ title, accent, cfg, eng, tokens, tokenView, style }: Props) {
  const { frame } = eng;
  const bodyRef = useRef<HTMLDivElement>(null);
  const prevPhase = useRef<Phase>(frame.phase);
  const justDone = prevPhase.current !== "done" && frame.phase === "done";
  prevPhase.current = frame.phase;

  const color = accent === "amber" ? "var(--amber)" : "var(--aqua)";
  const hex = accent === "amber" ? "#ffb454" : "#5fd4c4";

  // auto-scroll
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [frame.emitted, frame.phase]);

  const shown = tokens.slice(0, frame.emitted);
  const running = frame.phase === "streaming" || frame.phase === "ttft" || frame.phase === "paused";
  const progress = frame.total > 0 ? (frame.emitted / frame.total) * 100 : 0;
  const rate = frame.avgRate > 0 ? frame.avgRate : frame.instRate;
  const eta =
    frame.phase === "done" || frame.total === 0
      ? null
      : rate > 0
        ? ((frame.total - frame.emitted) / rate) * 1000
        : null;

  const ledClass =
    frame.phase === "idle"
      ? "led"
      : frame.phase === "done"
        ? `led ${accent}`
        : `led ${accent} pulse`;

  return (
    <section className={`panel rise overflow-hidden ${justDone ? "done-flash" : ""}`} style={style}>
      {/* header */}
      <header className="panel-head flex items-center gap-3 px-4 py-2.5">
        <span
          className="font-mono2 text-[11px] font-bold px-2 py-0.5 rounded"
          style={{ background: `${hex}1f`, color: hex, border: `1px solid ${hex}55` }}
        >
          {title}
        </span>
        <span className="font-mono2 text-[11px] text-[var(--muted)] t-num hidden sm:block">
          {cfg.tps} tok/s · jitter ±{Math.round(cfg.jitter * 100)}% · TTFT {cfg.ttftMs} ms
        </span>
        <span className="ml-auto flex items-center gap-2 font-mono2 text-[11px] text-[var(--muted)]">
          <span className={ledClass} />
          <span style={{ color: frame.phase === "streaming" ? hex : undefined }}>{STATUS[frame.phase]}</span>
          <span className="text-[var(--faint)] t-num pl-2 border-l border-[var(--line)] ml-1">
            t+{fmtTime(frame.finishMs ?? frame.elapsedMs)}
          </span>
        </span>
      </header>

      {/* corpo */}
      <div
        ref={bodyRef}
        className="console-body scroll overflow-y-auto px-5 py-4 text-[var(--ink)]"
        style={{ height: 340, scrollbarGutter: "stable" }}
      >
        {frame.phase === "idle" && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <IconZap size={26} className="text-[var(--faint)]" />
            <p className="text-[12px] text-[var(--faint)] font-mono2 leading-relaxed">
              Pressione <span style={{ color: hex }}>Iniciar</span> para simular esta resposta
              <br />a {cfg.tps} tokens por segundo.
            </p>
          </div>
        )}

        {frame.phase === "ttft" && (
          <div className="pt-2 space-y-3">
            <p className="font-mono2 text-[11px] text-[var(--muted)] flex items-center gap-2">
              <span className={`led ${accent} pulse`} />
              processando prompt · TTFT ≈ {cfg.ttftMs} ms
            </p>
            <div className="shimmer w-3/4" />
            <div className="shimmer w-[92%]" />
            <div className="shimmer w-1/2" />
          </div>
        )}

        {(frame.phase === "streaming" || frame.phase === "paused" || frame.phase === "done") && (
          <div className="whitespace-pre-wrap break-words">
            {tokenView
              ? shown.map((t, i) => (
                  <span key={i} className="tok" style={{ background: TOKEN_BG[i % TOKEN_BG.length] }} title={`token #${i + 1}`}>
                    {t}
                  </span>
                ))
              : shown.join("")}
            {(frame.phase === "streaming" || frame.phase === "paused") && (
              <span className="caret" style={{ background: hex }} />
            )}
            {frame.phase === "done" && (
              <span className="font-mono2 text-[11px] ml-2 inline-flex items-center gap-1.5" style={{ color: hex }}>
                ■ fim da geração
              </span>
            )}
          </div>
        )}
      </div>

      {/* progresso */}
      <div className="h-[3px] bg-[#182730]">
        <div
          className="h-full transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%`, background: hex, boxShadow: `0 0 8px ${hex}88` }}
        />
      </div>

      {/* métricas */}
      <div className="grid grid-cols-4 divide-x divide-[var(--line)] border-b border-[var(--line)]">
        <Metric label="tokens" value={frame.total > 0 ? `${frame.emitted}/${frame.total}` : "—"} color={hex} />
        <Metric label="tempo" value={fmtTime(frame.finishMs ?? frame.elapsedMs)} />
        <Metric label="tok/s médio" value={frame.avgRate > 0 ? fmtNum(frame.avgRate, 1) : "—"} color={hex} />
        <Metric label="restante" value={frame.phase === "done" ? "0 s" : eta !== null ? `≈ ${fmtTime(eta)}` : "—"} />
      </div>

      {/* sparkline */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono2 text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">
            taxa instantânea
          </span>
          <span className="font-mono2 text-[10px] text-[var(--faint)] t-num">
            alvo {cfg.tps} tok/s · inst. {fmtNum(frame.instRate, 1)}
          </span>
        </div>
        <Sparkline data={frame.history} color={hex} target={cfg.tps} scaleMax={cfg.tps * 1.5} />
      </div>
    </section>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="px-3 py-2.5 min-w-0">
      <div className="font-mono2 text-[9.5px] uppercase tracking-[0.14em] text-[var(--faint)] truncate">{label}</div>
      <div className="text-[15px] font-bold t-num truncate" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}
