import "dotenv/config";
import fs from "node:fs";
import { google } from "googleapis";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth });
const docs = google.docs({ version: "v1", auth });
const sheets = google.sheets({ version: "v4", auth });

const DOC_TITLE = "[Saju] lunar-python chart validation report v1";
const SHEET_TITLE = "[Saju] chart validation matrix v1";
const REPORT_PATH = "daily-work/saju-chart-validation-report-v1.md";
const CSV_PATH = "daily-work/saju-chart-validation-v1.csv";

function esc(s) { return s.replace(/'/g, "\\'"); }

async function findFolder(name, parentId) {
  let q = `name='${esc(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name)", pageSize: 10 });
  return r.data.files?.[0] || null;
}

async function ensureFolder(name, parentId) {
  const f = await findFolder(name, parentId);
  if (f) return f;
  const r = await drive.files.create({ requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: parentId ? [parentId] : undefined }, fields: "id,name" });
  return r.data;
}

async function findFile(name, mimeType, parentId) {
  const q = `name='${esc(name)}' and mimeType='${mimeType}' and trashed=false and '${parentId}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 10 });
  return r.data.files?.[0] || null;
}

async function ensureDoc(name, parentId) {
  const found = await findFile(name, "application/vnd.google-apps.document", parentId);
  if (found) return found;
  const c = await docs.documents.create({ requestBody: { title: name } });
  const id = c.data.documentId;
  await drive.files.update({ fileId: id, addParents: parentId, removeParents: "root" });
  return { id, name, webViewLink: `https://docs.google.com/document/d/${id}/edit` };
}

async function ensureSheet(name, parentId) {
  const found = await findFile(name, "application/vnd.google-apps.spreadsheet", parentId);
  if (found) return found;
  const c = await sheets.spreadsheets.create({ requestBody: { properties: { title: name } } });
  const id = c.data.spreadsheetId;
  await drive.files.update({ fileId: id, addParents: parentId, removeParents: "root" });
  return { id, name, webViewLink: `https://docs.google.com/spreadsheets/d/${id}/edit` };
}

async function replaceDoc(documentId, text) {
  const d = await docs.documents.get({ documentId });
  const content = d.data.body?.content || [];
  const end = content[content.length - 1]?.endIndex || 2;
  const requests = [];
  if (end > 2) requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: end - 1 } } });
  requests.push({ insertText: { location: { index: 1 }, text } });
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
}

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  return lines.map((line) => {
    const out = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { q = !q; continue; }
      if (ch === ',' && !q) { out.push(cur); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur);
    return out;
  });
}

async function main() {
  const root = await ensureFolder("사주앱");
  const dashboard = await ensureFolder("00_운영대시보드", root.id);

  const report = fs.readFileSync(REPORT_PATH, "utf-8");
  const csv = fs.readFileSync(CSV_PATH, "utf-8");
  const values = parseCsv(csv);

  const doc = await ensureDoc(DOC_TITLE, dashboard.id);
  const sheet = await ensureSheet(SHEET_TITLE, dashboard.id);

  await replaceDoc(doc.id, report);
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheet.id,
    range: "A1",
    valueInputOption: "RAW",
    requestBody: { values },
  });

  console.log(JSON.stringify({
    ok: true,
    folder: `https://drive.google.com/drive/folders/${dashboard.id}`,
    doc: doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`,
    sheet: sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`,
  }, null, 2));
}

main().catch((e) => {
  console.error(e.response?.data || e.message);
  process.exit(1);
});
