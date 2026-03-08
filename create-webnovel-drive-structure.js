import "dotenv/config";
import { google } from "googleapis";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !GOOGLE_REFRESH_TOKEN) {
  console.error("❌ Missing Google OAuth env vars");
  process.exit(1);
}

const auth = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth });
const docs = google.docs({ version: "v1", auth });

function esc(s) {
  return s.replace(/'/g, "\\'");
}

async function findFolder(name, parentId) {
  let q = `name='${esc(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name)", pageSize: 10 });
  return r.data.files?.[0]?.id || null;
}

async function ensureFolder(name, parentId) {
  const found = await findFolder(name, parentId);
  if (found) return { id: found, created: false };

  const r = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id,name,webViewLink",
  });

  return { id: r.data.id, created: true, link: r.data.webViewLink };
}

async function ensureDoc(title, parentId) {
  const q = `name='${esc(title)}' and mimeType='application/vnd.google-apps.document' and trashed=false and '${parentId}' in parents`;
  const f = await drive.files.list({ q, fields: "files(id,name)", pageSize: 10 });
  if (f.data.files?.[0]?.id) return { id: f.data.files[0].id, created: false };

  const c = await docs.documents.create({ requestBody: { title } });
  const id = c.data.documentId;

  await drive.files.update({
    fileId: id,
    addParents: parentId,
    removeParents: "root",
    fields: "id,webViewLink",
  });

  return { id, created: true };
}

async function main() {
  const top = "웹소설_프로젝트";
  const folders = [
    "00_작품총괄",
    "01_기획",
    "02_세계관",
    "03_등장인물",
    "04_플롯",
    "05_회차원고",
    "06_레퍼런스이미지",
    "07_표지_썸네일",
    "08_홍보문구_플랫폼별",
    "09_관리시트",
    "99_보관",
  ];

  const coreDocs = [
    ["00_작품총괄", "작품개요"],
    ["00_작품총괄", "문체 가이드"],
    ["02_세계관", "세계관 설정집"],
    ["03_등장인물", "등장인물 시트"],
    ["04_플롯", "장기 플롯"],
    ["04_플롯", "화별 개요"],
    ["09_관리시트", "복선 및 회수표"],
  ];

  const topRes = await ensureFolder(top);
  const topId = topRes.id;

  const folderMap = {};
  for (const name of folders) {
    const r = await ensureFolder(name, topId);
    folderMap[name] = r.id;
  }

  for (const [folder, doc] of coreDocs) {
    await ensureDoc(doc, folderMap[folder]);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        topFolderId: topId,
        topLink: `https://drive.google.com/drive/folders/${topId}`,
        foldersEnsured: folders.length,
        docsEnsured: coreDocs.length,
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
