/* Núcleo do simulador: tokenização aproximada, presets e textos de exemplo */

export interface StreamConfig {
  tps: number;      // tokens por segundo
  jitter: number;   // 0..1 — variação instantânea da taxa
  ttftMs: number;   // latência até o primeiro token
}

/* ---------------- tokenização aproximada (determinística) ---------------- */

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Divide o texto em pseudo-tokens estilo BPE: pedaços de 2–6 caracteres,
 * com espaços em branco anexados ao início do token seguinte.
 * Determinístico para o mesmo texto (seed por hash).
 */
export function tokenize(text: string): string[] {
  const rnd = mulberry32(hashSeed(text));
  const tokens: string[] = [];
  let carryWs = "";
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      carryWs = part;
      continue;
    }
    let i = 0;
    let first = true;
    while (i < part.length) {
      const len = Math.max(1, Math.round(2 + rnd() * 4));
      const chunk = part.slice(i, i + len);
      tokens.push((first ? carryWs : "") + chunk);
      carryWs = "";
      first = false;
      i += chunk.length;
    }
  }
  return tokens;
}

/* ---------------- formatação pt-BR ---------------- */

export const fmtNum = (n: number, d = 1) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

export function fmtTime(ms: number): string {
  if (ms < 60_000) return `${fmtNum(ms / 1000, 1)} s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

/* ---------------- presets de velocidade (referências aproximadas) ---------------- */

export interface Preset {
  label: string;
  tps: number;
}

export const PRESETS: Preset[] = [
  { label: "7B local · GPU 8GB", tps: 18 },
  { label: "API intermediária", tps: 55 },
  { label: "API rápida", tps: 100 },
  { label: "Decod. especulativa", tps: 145 },
];

/* ---------------- respostas de exemplo ---------------- */

export interface Example {
  label: string;
  text: string;
}

export const EXAMPLES: Example[] = [
  {
    label: "Buraco negro",
    text: "Um buraco negro é uma região do espaço onde a gravidade é tão intensa que nada — nem mesmo a luz — consegue escapar. Eles se formam quando estrelas muito massivas esgotam seu combustível e colapsam sob o próprio peso.\n\nO limite de não retorno é chamado de horizonte de eventos. Dentro dele, a curvatura do espaço-tempo se torna extrema e, para um observador externo, o tempo parece desacelerar até parar na borda.\n\nNo centro, a relatividade geral prevê uma singularidade: um ponto de densidade efetivamente infinita onde as leis da física conhecidas deixam de valer. Reconciliar essa descrição com a mecânica quântica segue sendo um dos maiores desafios em aberto da física teórica.",
  },
  {
    label: "Código Python",
    text: "Claro! Aqui está uma implementação de Fibonacci usando geradores em Python:\n\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\n# Exemplo de uso:\nfor valor in fibonacci(10):\n    print(valor)\n\nEssa abordagem é eficiente porque gera cada termo sob demanda, usando memória constante O(1) em vez de armazenar a sequência inteira. Se você precisar de acesso aleatório aos termos, uma lista com programação dinâmica pode ser mais adequada.",
  },
  {
    label: "História (longa)",
    text: "A história da computação começa muito antes dos computadores eletrônicos. No século XIX, Charles Babbage projetou a Máquina Analítica, um engenho mecânico programável, e Ada Lovelace escreveu o que muitos consideram o primeiro algoritmo da história.\n\nNa década de 1940, máquinas como o ENIAC e o Colossus inauguraram a era eletrônica, apoiadas em milhares de válvulas. A invenção do transistor, em 1947, mudou tudo: menor, mais rápido e mais confiável, ele permitiu a miniaturização que levou aos circuitos integrados e, depois, aos microprocessadores.\n\nA Lei de Moore observou que o número de transistores por chip dobrava a cada dois anos — tendência que guiou a indústria por décadas. Com os computadores pessoais nos anos 1980 e a internet nos anos 1990, a computação deixou os laboratórios e entrou na vida cotidiana.\n\nHoje vivemos a era dos modelos de linguagem: redes neurais com bilhões de parâmetros que produzem texto token a token — exatamente o processo que este simulador reproduz em velocidade controlada.",
  },
  {
    label: "Latência × vazão",
    text: "Em termos simples: latência é o tempo até o primeiro byte chegar; vazão é a quantidade de dados por segundo depois que o fluxo começa.\n\nUma ligação de telefone tem latência baixa, enquanto baixar um arquivo grande depende muito mais da vazão. Em LLMs é a mesma lógica: o TTFT (time to first token) mede a latência, e o tok/s mede a vazão da geração.",
  },
];
