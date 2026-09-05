import type { CSSProperties, ReactNode } from "react";
import { EXAMPLES, PRESETS } from "../lib/engine";
import { IconGauge, IconHash, IconSliders, IconShuffle } from "./Icons";

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  accent?: string;
}

function Slider({ min, max, step = 1, value, onChange, accent = "var(--amber)" }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className="slider"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ "--fill": `${pct}%`, "--sc": accent } as CSSProperties}
    />
  );
}

function Label({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-mono2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
      {icon}
      {children}
    </div>
  );
}

function TpsBlock({
  channel,
  hex,
  tps,
  setTps,
}: {
  channel: string;
  hex: string;
  tps: number;
  setTps: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <Label icon={<IconGauge size={12} className="opacity-70" />}>velocidade · canal {channel}</Label>
        <div className="text-right leading-none">
          <span className="font-bold t-num text-[34px] tracking-tight" style={{ color: hex }}>
            {tps}
          </span>
          <span className="font-mono2 text-[10px] text-[var(--muted)] ml-1">tok/s</span>
        </div>
      </div>
      <Slider min={1} max={160} value={tps} onChange={setTps} accent={hex} />
      <div className="flex flex-wrap gap-1.5 mt-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`chip ${tps === p.tps ? (hex === "#5fd4c4" ? "on-aqua" : "on") : ""}`}
            onClick={() => setTps(p.tps)}
          >
            {p.tps} · {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  tpsA: number; setTpsA: (v: number) => void;
  tpsB: number; setTpsB: (v: number) => void;
  compare: boolean; setCompare: (v: boolean) => void;
  jitter: number; setJitter: (v: number) => void;
  ttftMs: number; setTtftMs: (v: number) => void;
  tokenView: boolean; setTokenView: (v: boolean) => void;
  text: string; setText: (v: string) => void;
  tokensCount: number;
  exampleIdx: number; setExampleIdx: (v: number) => void;
  onShuffle: () => void;
}

export default function Controls(p: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* velocidade */}
      <div className="panel p-4 rise" style={{ animationDelay: "0.05s" }}>
        <TpsBlock channel="A" hex="#ffb454" tps={p.tpsA} setTps={p.setTpsA} />
        {p.compare && (
          <div className="mt-5 pt-4 border-t border-[var(--line)]">
            <TpsBlock channel="B" hex="#5fd4c4" tps={p.tpsB} setTps={p.setTpsB} />
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between">
          <Label icon={<IconSliders size={12} className="opacity-70" />}>modo comparação A/B</Label>
          <button className={`toggle ${p.compare ? "on" : ""}`} onClick={() => p.setCompare(!p.compare)} aria-label="alternar comparação" />
        </div>
      </div>

      {/* realismo */}
      <div className="panel p-4 rise space-y-4" style={{ animationDelay: "0.12s" }}>
        <Label icon={<IconHash size={12} className="opacity-70" />}>realismo da geração</Label>
        <div>
          <div className="flex justify-between font-mono2 text-[11px] text-[var(--muted)]">
            <span>jitter da taxa</span>
            <span className="text-[var(--ink)] t-num">±{p.jitter}%</span>
          </div>
          <Slider min={0} max={60} value={p.jitter} onChange={p.setJitter} />
        </div>
        <div>
          <div className="flex justify-between font-mono2 text-[11px] text-[var(--muted)]">
            <span>latência (TTFT)</span>
            <span className="text-[var(--ink)] t-num">{p.ttftMs} ms</span>
          </div>
          <Slider min={0} max={3000} step={50} value={p.ttftMs} onChange={p.setTtftMs} />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono2 text-[11px] text-[var(--muted)]">
            visualizar tokens <span className="text-[var(--faint)]">(≈ 4,5 chars/token)</span>
          </span>
          <button className={`toggle ${p.tokenView ? "on" : ""}`} onClick={() => p.setTokenView(!p.tokenView)} aria-label="alternar visão de tokens" />
        </div>
      </div>

      {/* resposta */}
      <div className="panel p-4 rise" style={{ animationDelay: "0.19s" }}>
        <div className="flex items-center justify-between mb-3">
          <Label icon={<IconHash size={12} className="opacity-70" />}>resposta simulada</Label>
          <button className="chip" onClick={p.onShuffle} title="sortear outra resposta">
            <span className="inline-flex items-center gap-1.5"><IconShuffle size={11} /> sortear</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {EXAMPLES.map((ex, i) => (
            <button key={ex.label} className={`chip ${i === p.exampleIdx ? "on" : ""}`} onClick={() => p.setExampleIdx(i)}>
              {ex.label}
            </button>
          ))}
        </div>
        <textarea
          className="console-input scroll p-3"
          rows={8}
          value={p.text}
          onChange={(e) => p.setText(e.target.value)}
          spellCheck={false}
          placeholder="Cole aqui a resposta que deseja simular…"
        />
        <div className="flex justify-between mt-2 font-mono2 text-[10.5px] text-[var(--faint)] t-num">
          <span>{p.text.length} caracteres</span>
          <span style={{ color: "var(--muted)" }}>≈ {p.tokensCount} tokens</span>
        </div>
      </div>

      <p className="font-mono2 text-[10px] leading-relaxed text-[var(--faint)] px-1 rise" style={{ animationDelay: "0.26s" }}>
        Simulação aproximada — a tokenização real varia por modelo. Altere o tok/s{" "}
        <span className="text-[var(--muted)]">durante</span> a geração para ver o efeito ao vivo.
        Atalhos: <span className="kbd">espaço</span> iniciar/pausar · <span className="kbd">R</span> reiniciar
      </p>

    </div>
  );
}
