import "dotenv/config";
import { google } from "googleapis";

const TISTORY_FOLDER_ID = "16VnD4AOgcpPpZK-81FNRAVFVD3gpuruX";
const POLICY_DOC_NAME = "블로그작성정책";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth });
const docs = google.docs({ version: "v1", auth });

function esc(s) {
  return s.replace(/'/g, "\\'");
}

async function findDocByName(name) {
  const q = `name='${esc(name)}' and mimeType='application/vnd.google-apps.document' and trashed=false and '${TISTORY_FOLDER_ID}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 10 });
  return r.data.files?.[0] || null;
}

async function ensureDoc(name) {
  const found = await findDocByName(name);
  if (found) return found;

  const c = await docs.documents.create({ requestBody: { title: name } });
  const id = c.data.documentId;
  await drive.files.update({ fileId: id, addParents: TISTORY_FOLDER_ID, removeParents: "root" });
  return { id, name, webViewLink: `https://docs.google.com/document/d/${id}/edit` };
}

async function getEndIndex(documentId) {
  const d = await docs.documents.get({ documentId });
  const content = d.data.body?.content || [];
  return content[content.length - 1]?.endIndex || 2;
}

async function replaceAll(documentId, text) {
  const end = await getEndIndex(documentId);
  const requests = [];
  if (end > 2) {
    requests.push({
      deleteContentRange: {
        range: { startIndex: 1, endIndex: end - 1 },
      },
    });
  }
  requests.push({ insertText: { location: { index: 1 }, text } });
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
}

async function main() {
  const doc = await ensureDoc(POLICY_DOC_NAME);

  const body = `블로그작성정책 (시니어 건강)\n\n` +
    `적용 범위\n` +
    `- 본 정책은 티스토리 블로그용 본문 작성/재작성에만 적용한다.\n` +
    `- 웹소설 프로젝트 정책과 분리하며, 서로 섞지 않는다.\n\n` +
    `길이 기준\n` +
    `- 발행용 블로그 본문은 2000자 내외를 기본으로 한다.\n` +
    `- 운영 기준: 1900~2100자 범위 권장.\n` +
    `- 목록/메모/체크리스트 문서는 길이 고정 대상에서 제외한다.\n\n` +
    `콘텐츠 기준\n` +
    `- 시니어 독자 관점(이동/안전/휴식/식습관/실행 가능성) 우선.\n` +
    `- 과장 광고, 허위·과대 표현, 과도한 스포/자극 문구 금지.\n` +
    `- 의료 효능 단정 표현 금지. 일반 건강정보 고지 문구 포함.\n\n` +
    `작업 절차\n` +
    `1) 정책 문서 확인\n` +
    `2) 초안 작성\n` +
    `3) 글자수 및 톤 점검\n` +
    `4) Drive 티스토리 폴더에 저장\n\n` +
    `정책 변경 규칙\n` +
    `- 사용자가 기준 변경 요청 시 이 문서를 먼저 업데이트한다.\n` +
    `- 이후 작성분부터 업데이트된 정책을 적용한다.\n`;

  await replaceAll(doc.id, body);

  console.log(JSON.stringify({
    ok: true,
    docName: POLICY_DOC_NAME,
    url: doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`,
    folderUrl: `https://drive.google.com/drive/folders/${TISTORY_FOLDER_ID}`,
  }, null, 2));
}

main().catch((e) => {
  console.error("❌ Error:", e.response?.data || e.message);
  process.exit(1);
});
