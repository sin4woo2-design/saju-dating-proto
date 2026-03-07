import fs from "node:fs";

const TO = process.env.DIGEST_TO_EMAIL || "sin4woo2@gmail.com";
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const DRY_RUN = process.argv.includes("--dry-run");

const SAFE_DOMAINS = [
  "techcrunch.com",
  "theverge.com",
  "wired.com",
  "arstechnica.com",
  "venturebeat.com",
  "engadget.com",
  "mit.edu",
  "openai.com",
  "googleblog.com",
  "deepmind.google",
  "anthropic.com",
  "microsoft.com",
  "nvidia.com",
  "huggingface.co",
  "aitimes.com",
  "zdnet.com",
  "bbc.com",
  "reuters.com",
  "bloomberg.com",
  "forbes.com",
];

const QUERIES = [
  "latest AI news",
  "generative AI release today",
  "LLM model update",
  "AI startup funding news",
  "semiconductor AI chips news",
];

function matchesAllowlist(urlString) {
  try {
    const host = new URL(urlString).hostname.replace(/^www\./, "");
    return SAFE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function stripTracking(urlString) {
  try {
    const u = new URL(urlString);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach((k) =>
      u.searchParams.delete(k),
    );
    return u.toString();
  } catch {
    return urlString;
  }
}

async function braveSearch(query) {
  const endpoint = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8&search_lang=en&freshness=pd`;
  const res = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`Brave API error ${res.status}`);
  }

  const data = await res.json();
  return (data?.web?.results || []).map((r) => ({
    title: r.title || "(no title)",
    description: r.description || "",
    url: r.url || "",
  }));
}

function buildDigestText(items) {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    `AI/Tech Daily Digest (${date})`,
    "",
    "[안전 모드] 허용된 도메인 뉴스만 포함",
    "",
  ];

  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.title}`);
    lines.push(`- 요약: ${item.description || "요약 없음"}`);
    lines.push(`- 링크: ${item.url}`);
    lines.push("");
  });

  lines.push("---");
  lines.push("자동 생성: Brave Search + 안전 링크 필터 + Gmail API");
  return lines.join("\n");
}

async function getGoogleAccessToken() {
  const payload = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload,
  });

  if (!res.ok) {
    throw new Error(`Google token error ${res.status}`);
  }

  const json = await res.json();
  return json.access_token;
}

function toBase64Url(text) {
  return Buffer.from(text)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendMail(accessToken, bodyText) {
  const subject = `[AI Tech Digest] ${new Date().toISOString().slice(0, 10)}`;
  const message = [
    `To: ${TO}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    bodyText,
  ].join("\n");

  const raw = toBase64Url(message);

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gmail send error ${res.status}: ${t}`);
  }

  return res.json();
}

function writeLog(text) {
  fs.mkdirSync("automations/ai-tech-digest/logs", { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  fs.writeFileSync(`automations/ai-tech-digest/logs/${ts}.log`, text, "utf8");
}

async function main() {
  if (!BRAVE_API_KEY || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error("Missing required env vars");
  }

  const all = [];
  for (const q of QUERIES) {
    const rows = await braveSearch(q);
    all.push(...rows);
  }

  const dedupMap = new Map();
  for (const row of all) {
    if (!row.url || !matchesAllowlist(row.url)) continue;
    const clean = stripTracking(row.url);
    if (!dedupMap.has(clean)) {
      dedupMap.set(clean, { ...row, url: clean });
    }
  }

  const picked = [...dedupMap.values()].slice(0, 8);
  const body = buildDigestText(picked);

  if (DRY_RUN) {
    writeLog(`[DRY RUN]\n${body}`);
    console.log("Dry run complete");
    return;
  }

  const token = await getGoogleAccessToken();
  const sent = await sendMail(token, body);
  writeLog(`Sent message id: ${sent.id}\n\n${body}`);
  console.log(`Digest sent: ${sent.id}`);
}

main().catch((err) => {
  const msg = `[ERROR] ${new Date().toISOString()} ${err.message}`;
  writeLog(msg);
  console.error(msg);
  process.exit(1);
});
