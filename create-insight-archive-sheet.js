import "dotenv/config";
import { google } from "googleapis";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth });
const sheets = google.sheets({ version: "v4", auth });

function esc(s) {
  return s.replace(/'/g, "\\'");
}

async function findFolder(name, parentId) {
  let q = `name='${esc(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 10 });
  return r.data.files?.[0] || null;
}

async function ensureFolder(name, parentId) {
  const found = await findFolder(name, parentId);
  if (found) return found;
  const r = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id,name,webViewLink",
  });
  return r.data;
}

async function findSheet(name, parentId) {
  const q = `name='${esc(name)}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and '${parentId}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 10 });
  return r.data.files?.[0] || null;
}

async function createSheetInFolder(name, parentId) {
  const found = await findSheet(name, parentId);
  if (found) return found;

  const c = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: name },
      sheets: [{ properties: { title: "일간요약" } }],
    },
  });

  const spreadsheetId = c.data.spreadsheetId;

  await drive.files.update({
    fileId: spreadsheetId,
    addParents: parentId,
    removeParents: "root",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "일간요약!A1:J1",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        "수집일",
        "채널명",
        "영상제목",
        "영상링크",
        "발행일",
        "주제분류",
        "3줄요약",
        "핵심포인트",
        "활용아이디어",
        "비고"
      ]],
    },
  });

  return {
    id: spreadsheetId,
    name,
    webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

async function main() {
  const folder = await ensureFolder("인사이트 아카이브");
  const sheet = await createSheetInFolder("전자제품 인사이트", folder.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        folder: {
          id: folder.id,
          url: `https://drive.google.com/drive/folders/${folder.id}`,
        },
        sheet: {
          id: sheet.id,
          url: sheet.webViewLink,
        },
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error("❌ Error:", e.response?.data || e.message);
  process.exit(1);
});
