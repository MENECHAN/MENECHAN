import { mkdirSync, writeFileSync } from "node:fs";

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const login = process.env.PROFILE_USERNAME || process.env.GITHUB_REPOSITORY_OWNER || "MENECHAN";

const BG = "#0A0A0A";
const PANEL = "#111111";
const IVORY = "#F4F1EA";
const MUTED = "#9A9488";
const DIM = "#5C574E";
const LINE = "#242424";
const ACCENT = "#FF5C35";
const LIVE = "#C8E0B8";
const FONT = "'IBM Plex Mono','SFMono-Regular',Consolas,'Liberation Mono',monospace";
const DISPLAY = "Inter,'Segoe UI',Arial,sans-serif";

const esc = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const query = `
query Profile($login: String!) {
  user(login: $login) {
    createdAt
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

let days = [];
let since = 2023;
if (token) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "menechan-profile",
    },
    body: JSON.stringify({ query, variables: { login } }),
  });
  if (!response.ok) throw new Error(`GitHub GraphQL ${response.status}`);
  const payload = await response.json();
  if (payload.errors) throw new Error(payload.errors.map((error) => error.message).join("; "));
  const user = payload.data.user;
  since = new Date(user.createdAt).getUTCFullYear();
  days = user.contributionsCollection.contributionCalendar.weeks
    .flatMap((week) => week.contributionDays)
    .slice(-365);
}

const total = days.reduce((sum, day) => sum + day.contributionCount, 0);
const activeDays = days.filter((day) => day.contributionCount > 0).length;
const maxDay = Math.max(0, ...days.map((day) => day.contributionCount));
const density = Math.round((activeDays / Math.max(1, days.length)) * 100);

function currentStreak(items) {
  if (!items.length) return 0;
  let index = items.length - 1;
  if (items[index]?.contributionCount === 0) index -= 1;
  let count = 0;
  for (; index >= 0 && items[index].contributionCount > 0; index -= 1) count += 1;
  return count;
}
const streak = currentStreak(days);

function pulse(cx, cy, color) {
  return `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}">
    <animate attributeName="r" values="4;6.5;4" dur="1.8s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${cx}" cy="${cy}" r="4" fill="${color}" opacity=".25">
    <animate attributeName="r" values="4;12;4" dur="1.8s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values=".4;0;0.4" dur="1.8s" repeatCount="indefinite"/>
  </circle>`;
}

function scan(width, height, delay = "0s") {
  return `<rect x="0" y="-8" width="${width}" height="8" fill="${ACCENT}" opacity="0">
    <animate attributeName="y" values="-8;${height}" dur="5.5s" begin="${delay}" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0;0.45;0" dur="5.5s" begin="${delay}" repeatCount="indefinite"/>
  </rect>`;
}

const hero = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420" role="img">
  <defs>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="${LINE}" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="420" rx="20" fill="${BG}"/>
  <rect width="1200" height="420" rx="20" fill="url(#grid)" opacity=".55"/>
  <rect x="1" y="1" width="1198" height="418" rx="19" fill="none" stroke="${LINE}"/>
  ${scan(1200, 420)}

  <g transform="translate(1008 168)">
    <circle r="118" fill="none" stroke="${LINE}"/>
    <circle r="82" fill="none" stroke="${LINE}" stroke-dasharray="5 9">
      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="28s" repeatCount="indefinite"/>
    </circle>
    <circle r="46" fill="none" stroke="${ACCENT}" stroke-width="1.2" opacity=".7">
      <animate attributeName="r" values="42;50;42" dur="3.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".35;.85;.35" dur="3.2s" repeatCount="indefinite"/>
    </circle>
    <path d="M-22 0 L0 -22 L22 0 L0 22 Z" fill="none" stroke="${ACCENT}" stroke-width="2">
      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite"/>
    </path>
    <circle r="4" fill="${ACCENT}"/>
  </g>

  <g font-family="${FONT}" font-size="12">
    <rect x="42" y="34" width="10" height="10" rx="2" fill="${ACCENT}">
      <animate attributeName="opacity" values="1;0.25;1" dur="1.2s" repeatCount="indefinite"/>
    </rect>
    <text x="62" y="44" fill="${MUTED}" letter-spacing="1.6">MENECHAN</text>
    <text x="1110" y="44" text-anchor="end" fill="${LIVE}">online</text>
  </g>
  ${pulse(1130, 39, LIVE)}

  <text x="42" y="168" fill="${IVORY}" font-family="${DISPLAY}" font-size="86" font-weight="800" letter-spacing="-4">MENECHAN</text>
  <rect x="44" y="186" width="12" height="3" fill="${ACCENT}">
    <animate attributeName="width" values="12;604;12" dur="7s" repeatCount="indefinite"/>
  </rect>
  <text x="44" y="224" fill="${MUTED}" font-family="${FONT}" font-size="15" letter-spacing="1.8">midwit vibecoder</text>
  <text x="44" y="278" fill="${IVORY}" font-family="${FONT}" font-size="18">você cuida do negócio. eu cuido do site.</text>
  <rect x="496" y="262" width="9" height="18" fill="${ACCENT}">
    <animate attributeName="opacity" values="1;0;1" dur="1.05s" repeatCount="indefinite"/>
  </rect>

  <g transform="translate(44 348)" font-family="${FONT}" font-size="11" letter-spacing="1.1">
    <rect width="168" height="34" rx="6" fill="${PANEL}" stroke="${LINE}"/><text x="16" y="22" fill="${IVORY}">sites por assinatura</text>
    <g transform="translate(180 0)"><rect width="132" height="34" rx="6" fill="${PANEL}" stroke="${LINE}"/><text x="16" y="22" fill="${IVORY}">lojas</text></g>
    <g transform="translate(324 0)"><rect width="168" height="34" rx="6" fill="${PANEL}" stroke="${LINE}"/><text x="16" y="22" fill="${IVORY}">produtos no ar</text></g>
  </g>
</svg>`;

function projectCard({ num, title, tag, line, stack, delay }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="570" height="248" viewBox="0 0 570 248" role="img">
  <rect width="570" height="248" rx="18" fill="${PANEL}"/>
  <rect x="1" y="1" width="568" height="246" rx="17" fill="none" stroke="${LINE}"/>
  ${scan(570, 248, delay)}
  <path d="M0 58h570" stroke="${LINE}"/>
  <text x="28" y="36" fill="${DIM}" font-family="${FONT}" font-size="11" letter-spacing="2">${esc(num)}</text>
  ${pulse(488, 32, LIVE)}
  <text x="504" y="36" fill="${LIVE}" font-family="${FONT}" font-size="11" letter-spacing="1.4">no ar</text>
  <text x="28" y="108" fill="${IVORY}" font-family="${DISPLAY}" font-size="26" font-weight="700">${esc(title)}</text>
  <text x="28" y="132" fill="${ACCENT}" font-family="${FONT}" font-size="11" letter-spacing="1.5">${esc(tag)}</text>
  <text x="28" y="168" fill="${MUTED}" font-family="${FONT}" font-size="13">${esc(line)}</text>
  <rect x="28" y="204" width="514" height="1" fill="${LINE}"/>
  <text x="28" y="226" fill="${DIM}" font-family="${FONT}" font-size="10" letter-spacing="1.2">${esc(stack)}</text>
</svg>`;
}

const projects = [
  {
    file: "project-menechan.svg",
    num: "01",
    title: "MENECHAN",
    tag: "SITES POR ASSINATURA",
    line: "criação, hospedagem e manutenção pra pequeno negócio.",
    stack: "NEXT.JS  ·  CONVEX  ·  TYPESCRIPT",
    delay: "0s",
  },
  {
    file: "project-monitor.svg",
    num: "02",
    title: "MONITOR DE CONCURSOS",
    tag: "BUSCA + ALERTAS",
    line: "concursos públicos sem ficar caçando edital todo dia.",
    stack: "PYTHON  ·  REACT  ·  VITE",
    delay: "1.2s",
  },
  {
    file: "project-contasmurf.svg",
    num: "03",
    title: "CONTASMURF",
    tag: "LOJA DE CONTAS LOL",
    line: "catálogo, checkout e entrega na hora.",
    stack: "NEXT.JS  ·  FASTIFY  ·  PRISMA",
    delay: "2.4s",
  },
  {
    file: "project-neckel.svg",
    num: "04",
    title: "NECKEL STUDIO",
    tag: "ESTÚDIO CRIATIVO",
    line: "presença digital com cara própria.",
    stack: "NEXT.JS  ·  TAILWIND  ·  DISCLOUD",
    delay: "3.6s",
  },
];

const stackItems = [
  "TypeScript",
  "Next.js",
  "React",
  "Node.js",
  "Python",
  "Convex",
  "Postgres",
  "Docker",
  "Cloudflare",
];
const stackRow = stackItems
  .map((label, index) => {
    const x = 32 + index * 128;
    return `<text x="${x}" y="88" fill="${IVORY}" font-family="${FONT}" font-size="15" opacity="0.25">
      ${esc(label)}
      <animate attributeName="opacity" values="0.25;1;0.25" dur="7.2s" begin="${(index * 0.45).toFixed(2)}s" repeatCount="indefinite"/>
    </text>`;
  })
  .join("");

const stack = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="156" viewBox="0 0 1200 156" role="img">
  <rect width="1200" height="156" rx="18" fill="${PANEL}"/>
  <rect x="1" y="1" width="1198" height="154" rx="17" fill="none" stroke="${LINE}"/>
  <text x="32" y="36" fill="${DIM}" font-family="${FONT}" font-size="11" letter-spacing="2">stack</text>
  ${stackRow}
  <text x="32" y="122" fill="${MUTED}" font-family="${FONT}" font-size="12">Fastify · Prisma · Tailwind · Discloud · Playwright</text>
  <rect x="32" y="138" width="1136" height="2" fill="${LINE}"/>
  <rect x="32" y="138" width="80" height="2" fill="${ACCENT}">
    <animate attributeName="width" values="80;420;1136;80" dur="6.5s" repeatCount="indefinite"/>
  </rect>
</svg>`;

const thresholds = [1, 3, 5, 10].map((threshold) => ({
  threshold,
  count: days.filter((day) => day.contributionCount >= threshold).length,
}));
const distribution = thresholds
  .map((item, index) => {
    const x = 32 + index * 278;
    const maxCount = Math.max(1, ...thresholds.map((entry) => entry.count));
    const width = Math.max(item.count ? 10 : 0, Math.round((228 * item.count) / maxCount));
    const fill = index === 0 ? LIVE : ACCENT;
    return `<text x="${x}" y="198" fill="${MUTED}" font-family="${FONT}" font-size="10">${item.threshold}+ / dia · ${item.count}d</text>
      <rect x="${x}" y="210" width="228" height="7" rx="3.5" fill="${BG}"/>
      <rect x="${x}" y="210" width="0" height="7" rx="3.5" fill="${fill}">
        <animate attributeName="width" from="0" to="${width}" dur="1.4s" begin="${index * 0.18}s" fill="freeze"/>
      </rect>`;
  })
  .join("");

const metric = (x, value, label, color = IVORY) => `
  <text x="${x}" y="104" fill="${color}" font-family="${FONT}" font-size="36" font-weight="700">${esc(value)}</text>
  <text x="${x}" y="128" fill="${MUTED}" font-family="${FONT}" font-size="11" letter-spacing="1.1">${esc(label)}</text>`;

const telemetry = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="252" viewBox="0 0 1200 252" role="img">
  <rect width="1200" height="252" rx="18" fill="${PANEL}"/>
  <rect x="1" y="1" width="1198" height="250" rx="17" fill="none" stroke="${LINE}"/>
  <text x="32" y="36" fill="${DIM}" font-family="${FONT}" font-size="11" letter-spacing="2">github</text>
  ${pulse(1148, 32, LIVE)}
  ${metric(32, total || "—", "contribuições")}
  ${metric(278, activeDays || "—", "dias ativos")}
  ${metric(510, streak || "—", "sequência")}
  ${metric(748, maxDay || "—", "melhor dia", ACCENT)}
  ${metric(978, days.length ? `${density}%` : "—", "densidade")}
  <rect x="32" y="160" width="1136" height="1" fill="${LINE}"/>
  ${distribution}
</svg>`;

const chartLeft = 32;
const chartRight = 1168;
const baseline = 154;
const maxHeight = 78;
const step = (chartRight - chartLeft) / Math.max(1, days.length - 1);
const scaleMax = Math.max(1, ...days.map((day) => day.contributionCount));
const bars = days
  .map((day, index) => {
    const height = day.contributionCount === 0 ? 2 : 6 + (day.contributionCount / scaleMax) * maxHeight;
    const opacity = day.contributionCount === 0 ? 0.16 : 0.42 + 0.58 * (day.contributionCount / scaleMax);
    const x = chartLeft + index * step;
    const fill = day.contributionCount ? ACCENT : DIM;
    return `<rect x="${x.toFixed(2)}" y="${(baseline - height).toFixed(2)}" width="${Math.max(1.3, step * 0.62).toFixed(2)}" height="${height.toFixed(2)}" rx="1.4" fill="${fill}" opacity="${opacity.toFixed(2)}"/>`;
  })
  .join("");

const activity = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="210" viewBox="0 0 1200 210" role="img">
  <rect width="1200" height="210" rx="18" fill="${BG}"/>
  <rect x="1" y="1" width="1198" height="208" rx="17" fill="none" stroke="${LINE}"/>
  <text x="32" y="34" fill="${DIM}" font-family="${FONT}" font-size="11" letter-spacing="2">365 dias</text>
  <path d="M32 154H1168M32 114H1168M32 74H1168" stroke="${LINE}" stroke-dasharray="3 8"/>
  <g>
    ${bars}
    <rect x="32" y="72" width="3" height="82" fill="${IVORY}" opacity=".85">
      <animate attributeName="x" values="32;1168;32" dur="8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".1;.9;.1" dur="8s" repeatCount="indefinite"/>
    </rect>
  </g>
  <text x="32" y="186" fill="${MUTED}" font-family="${FONT}" font-size="10">-365d</text>
  <text x="1168" y="186" text-anchor="end" fill="${MUTED}" font-family="${FONT}" font-size="10">hoje</text>
</svg>`;

mkdirSync("assets", { recursive: true });
writeFileSync("assets/hero.svg", hero);
for (const project of projects) {
  writeFileSync(`assets/${project.file}`, projectCard(project));
}
writeFileSync("assets/stack.svg", stack);
writeFileSync("assets/telemetry.svg", telemetry);
writeFileSync("assets/activity.svg", activity);

console.log(`profile assets ready · ${total} contributions · ${activeDays} active days`);
