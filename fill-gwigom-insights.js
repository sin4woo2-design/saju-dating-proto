import "dotenv/config";
import { google } from "googleapis";

const CHANNEL_URL = "https://youtube.com/@gwigom";
const SHEET_ID = "10umEPZVayg_nSUyRffBNOlOFCIXJ0cnnbhqyebptsIs";
const SHEET_NAME = "일간요약";
const START_DATE = "2026-01-01";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const sheets = google.sheets({ version: "v4", auth });

function textBetween(src, a, b) {
  const i = src.indexOf(a);
  if (i < 0) return "";
  const j = src.indexOf(b, i + a.length);
  if (j < 0) return "";
  return src.slice(i + a.length, j);
}

function strip(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function classify(title) {
  const t = title.toLowerCase();
  const rules = [
    ["로봇청소기", ["로봇청소기", "robot vacuum", "로청"]],
    ["세탁건조기", ["세탁건조기", "건조기", "세탁기", "워시타워"]],
    ["가습기", ["가습기", "humidifier"]],
    ["공기청정기", ["공기청정기", "air purifier"]],
    ["청소기", ["무선청소기", "청소기", "스틱청소기"]],
    ["냉장고", ["냉장고"]],
    ["에어컨", ["에어컨"]],
    ["TV/모니터", ["tv", "모니터", "oled", "qled"]],
    ["노트북/PC", ["노트북", "랩탑", "pc", "맥북"]],
    ["주방가전", ["에어프라이어", "전자레인지", "오븐", "밥솥", "식기세척기"]],
  ];
  const matched = rules.filter(([, kws]) => kws.some((k) => t.includes(k)));
  if (matched.length === 1) return matched[0][0];
  return "기타";
}

function summary(title, category) {
  return [
    `${category} 관련 영상으로 분류됨.`,
    `핵심 주제: ${title}`,
    `세부 스펙/비교 포인트 확인 후 실사용 관점으로 참고 권장.`,
  ].join(" ");
}

async function fetchChannelId() {
  const html = await fetch(CHANNEL_URL).then((r) => r.text());
  const m = html.match(/UC[0-9A-Za-z_-]{22}/);
  if (!m) throw new Error("channelId 파싱 실패");
  return m[0];
}

async function fetchFeed(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  return fetch(url).then((r) => r.text());
}

function parseEntries(xml) {
  const chunks = xml.split("<entry>").slice(1).map((x) => x.split("</entry>")[0]);
  return chunks.map((c) => {
    const title = strip(textBetween(c, "<title>", "</title>"));
    const link = c.match(/<link[^>]*href="([^"]+)"/)?.[1] || "";
    const published = textBetween(c, "<published>", "</published>");
    return { title, link, published };
  });
}

async function main() {
  const channelId = await fetchChannelId();
  const xml = await fetchFeed(channelId);
  const entries = parseEntries(xml)
    .filter((e) => e.published && e.published >= `${START_DATE}T00:00:00+00:00`)
    .sort((a, b) => a.published.localeCompare(b.published));

  const today = new Date().toISOString().slice(0, 10);
  const rows = entries.map((e) => {
    const category = classify(e.title);
    return [
      today,
      "귀곰",
      e.title,
      e.link,
      e.published.slice(0, 10),
      category,
      summary(e.title, category),
      "제품 핵심 스펙/장단점/가격 변동 체크",
      "블로그 리뷰 주제 후보로 확장 가능",
      "RSS 기반 수집",
    ];
  });

  // clear old data rows
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:J`,
  });

  if (rows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:J${rows.length + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: rows },
    });
  }

  console.log(JSON.stringify({ ok: true, channelId, count: rows.length }, null, 2));
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
