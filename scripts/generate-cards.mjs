import { writeFileSync, mkdirSync } from "node:fs";

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  throw new Error("GITHUB_TOKEN is required");
}

const query = `
query {
  viewer {
    login
    createdAt
    followers { totalCount }
    following { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
      totalCount
      nodes {
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
    }
    contributionsCollection {
      contributionCalendar { totalContributions }
    }
  }
}
`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "menechan-profile",
  },
  body: JSON.stringify({ query }),
});

if (!res.ok) {
  throw new Error(`GitHub GraphQL ${res.status}`);
}

const payload = await res.json();
if (payload.errors) {
  throw new Error(payload.errors.map((error) => error.message).join("; "));
}

const user = payload.data.viewer;
const totals = new Map();
for (const repo of user.repositories.nodes) {
  for (const edge of repo.languages.edges) {
    const current = totals.get(edge.node.name) || { size: 0, color: edge.node.color };
    current.size += edge.size;
    current.color = edge.node.color || current.color;
    totals.set(edge.node.name, current);
  }
}

const languages = [...totals.entries()]
  .map(([name, value]) => ({ name, ...value }))
  .sort((a, b) => b.size - a.size)
  .slice(0, 4);
const languageSum = languages.reduce((sum, language) => sum + language.size, 0) || 1;
const since = new Date(user.createdAt).getFullYear();
const contribs = user.contributionsCollection.contributionCalendar.totalContributions;

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function cardShell(width, height, title, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <rect width="${width}" height="${height}" rx="12" fill="#0A0A0A"/>
  <text x="24" y="36" fill="#F4F1EA" font-family="Segoe UI, Ubuntu, sans-serif" font-size="14" font-weight="700">${escapeXml(title)}</text>
  ${body}
</svg>
`;
}

const statsRows = [
  ["contribuições", contribs],
  ["repositórios", user.repositories.totalCount],
  ["seguindo", user.following.totalCount],
  ["no git desde", since],
];

const statsBody = statsRows
  .map(([label, value], index) => {
    const y = 70 + index * 28;
    return `
  <text x="24" y="${y}" fill="#A8A49A" font-family="Segoe UI, Ubuntu, sans-serif" font-size="13">${escapeXml(label)}</text>
  <text x="372" y="${y}" text-anchor="end" fill="#F4F1EA" font-family="Segoe UI, Ubuntu, sans-serif" font-size="13" font-weight="700">${escapeXml(value)}</text>`;
  })
  .join("");

const langsBody = languages
  .map((language, index) => {
    const y = 62 + index * 28;
    const percent = Math.max(1, Math.round((language.size / languageSum) * 100));
    const barWidth = Math.max(6, Math.round((language.size / languageSum) * 252));
    const color = language.color || "#C9C4B8";
    return `
  <text x="24" y="${y}" fill="#F4F1EA" font-family="Segoe UI, Ubuntu, sans-serif" font-size="12">${escapeXml(language.name)}</text>
  <text x="276" y="${y}" text-anchor="end" fill="#A8A49A" font-family="Segoe UI, Ubuntu, sans-serif" font-size="12">${percent}%</text>
  <rect x="24" y="${y + 6}" width="252" height="6" rx="3" fill="#161616"/>
  <rect x="24" y="${y + 6}" width="${barWidth}" height="6" rx="3" fill="${color}"/>`;
  })
  .join("");

mkdirSync("profile", { recursive: true });
writeFileSync("profile/stats.svg", cardShell(396, 195, "MENECHAN", statsBody));
writeFileSync(
  "profile/top-langs.svg",
  cardShell(300, 62 + languages.length * 28 + 18, "linguagens", langsBody),
);

console.log(`Wrote profile cards for ${user.login}`);
