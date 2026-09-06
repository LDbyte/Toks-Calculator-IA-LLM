import { useEffect, useRef } from "react";

interface Props {
  data: number[];
  color: string;
  target: number;   // linha de referência (tok/s configurado)
  scaleMax: number;
  height?: number;
}

export default function Sparkline({ data, color, target, scaleMax, height = 64 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(scaleMax, 1);
    const y = (v: number) => h - 4 - (Math.min(v, max) / max) * (h - 10);

    // grade
    ctx.strokeStyle = "rgba(126,151,155,0.12)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const gy = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // linha-alvo (tok/s configurado)
    ctx.strokeStyle = "rgba(232,240,239,0.22)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y(target));
    ctx.lineTo(w, y(target));
    ctx.stroke();
    ctx.setLineDash([]);

    if (data.length > 1) {
      const step = w / Math.max(data.length - 1, 1);

      // preenchimento
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, color + "33");
      grad.addColorStop(1, color + "00");
      ctx.beginPath();
      ctx.moveTo(0, y(data[0]));
      data.forEach((v, i) => ctx.lineTo(i * step, y(v)));
      ctx.lineTo((data.length - 1) * step, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // linha
      ctx.beginPath();
      ctx.moveTo(0, y(data[0]));
      data.forEach((v, i) => ctx.lineTo(i * step, y(v)));
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ponto final
      const lx = (data.length - 1) * step;
      const ly = y(data[data.length - 1]);
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(126,151,155,0.5)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("aguardando amostras…", 6, h / 2 + 3);
    }
  }, [data, color, target, scaleMax, height]);

  return <canvas ref={ref} style={{ width: "100%", height }} />;
}
