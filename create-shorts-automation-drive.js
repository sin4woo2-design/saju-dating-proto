import "dotenv/config";
import { google } from "googleapis";

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

async function findDoc(title, parentId) {
  const q = `name='${esc(title)}' and mimeType='application/vnd.google-apps.document' and trashed=false and '${parentId}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 10 });
  return r.data.files?.[0] || null;
}

async function ensureDoc(title, parentId) {
  const found = await findDoc(title, parentId);
  if (found) return found;
  const c = await docs.documents.create({ requestBody: { title } });
  const id = c.data.documentId;
  await drive.files.update({ fileId: id, addParents: parentId, removeParents: "root" });
  return { id, name: title, webViewLink: `https://docs.google.com/document/d/${id}/edit` };
}

async function getEndIndex(documentId) {
  const d = await docs.documents.get({ documentId });
  const body = d.data.body?.content || [];
  return body[body.length - 1]?.endIndex || 2;
}

async function replaceDoc(documentId, text) {
  const end = await getEndIndex(documentId);
  const requests = [];
  if (end > 2) {
    requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: end - 1 } } });
  }
  requests.push({ insertText: { location: { index: 1 }, text } });
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
}

async function main() {
  const root = await ensureFolder("쇼츠_자동화");

  const subfolders = [
    "00_운영정책",
    "01_벤치마킹",
    "02_NotebookLM",
    "03_프롬프트팩",
    "04_생성결과_이미지",
    "05_생성결과_영상",
    "06_내레이션_TTS",
    "07_캡컷_편집",
    "08_업로드메타",
    "09_완성본",
  ];

  const folderMap = {};
  for (const name of subfolders) {
    folderMap[name] = await ensureFolder(name, root.id);
  }

  const docsToSeed = [
    ["00_운영정책", "쇼츠 자동화 운영 정책"],
    ["02_NotebookLM", "NotebookLM 마스터 프롬프트"],
    ["03_프롬프트팩", "프롬프트팩_이미지_영상_TTS"],
    ["07_캡컷_편집", "캡컷 편집 체크리스트"],
    ["08_업로드메타", "업로드 메타 템플릿"],
  ];

  const seeded = {};
  for (const [folder, title] of docsToSeed) {
    const d = await ensureDoc(title, folderMap[folder].id);
    seeded[title] = d;
  }

  await replaceDoc(
    seeded["쇼츠 자동화 운영 정책"].id,
    `쇼츠 자동화 운영 정책\n\n목표\n- 완전 자동이 아닌 반자동(80~90%) 제작 파이프라인 구축\n- 원본 복제가 아닌 재구성형 콘텐츠 제작\n\n핵심 원칙\n- 저작권/플랫폼 정책 준수\n- 과장/허위 정보 금지\n- 생성 결과는 업로드 전 수동 검수 필수\n\n표준 워크플로우\n1) 벤치마킹 채널 선정(Playboard 등)\n2) NotebookLM 분석(링크 5~6개 권장)\n3) 이미지 프롬프트 생성(Auto-Wisk)\n4) 영상 프롬프트 생성(Grok Automation)\n5) 내레이션 생성(Google AI Studio TTS)\n6) 캡컷 편집(자막/싱크/속도)\n7) 업로드 메타 작성 및 예약\n\n주의\n- NotebookLM 소스 링크는 7개 이상 과투입 금지\n- 클릭 기반 툴은 사람 실행, 결과물은 AI가 검수\n- 품질 기준 미달 시 즉시 재생성\n`
  );

  await replaceDoc(
    seeded["NotebookLM 마스터 프롬프트"].id,
    `NotebookLM 마스터 프롬프트\n\n당신은 유튜브 쇼츠 제작 분석가다.\n입력된 벤치마킹 영상 링크들의 공통 패턴을 분석해 아래 항목을 한국어로 출력하라.\n\n출력 항목\n1) 쇼츠 훅 패턴 10개\n2) 스토리 전개 템플릿 5개\n3) 이미지 생성 프롬프트 10개(9:16 기준)\n4) 영상 생성 프롬프트 10개\n5) 내레이션 대본 3버전(30초/45초/60초)\n6) 보이스 톤 지침 3개\n7) 자막 스타일 가이드\n8) 제목 10개 + 설명 3개 + 태그 20개\n\n제약\n- 원문 복붙 금지, 재구성 문장으로 작성\n- 과장/허위/선정적 표현 금지\n- 실행 가능한 문장만 간결하게 제시\n`
  );

  await replaceDoc(
    seeded["프롬프트팩_이미지_영상_TTS"].id,
    `프롬프트팩 (복붙용)\n\n[이미지 생성용]\n- 9:16 세로 비율\n- 주인공 외형 일관성 유지\n- 배경/조명/의상/카메라 구도 포함\n\n[영상 생성용]\n- 장면별 길이(초) 명시\n- 카메라 움직임 명시(zoom-in, pan 등)\n- 액션/표정/전환 타이밍 명시\n\n[TTS 내레이션용]\n- 대본(30~45초)\n- 보이스 톤(차분/신뢰/속도)\n- 강조 단어 및 쉬는 타이밍\n\n체크\n- 동일 문장 반복 여부\n- 금칙 표현 여부\n- 후킹 문장 3초 내 배치 여부\n`
  );

  await replaceDoc(
    seeded["캡컷 편집 체크리스트"].id,
    `캡컷 편집 체크리스트\n\n1) 음성 배치\n- 속도 1.2~1.3x 필요 여부 확인\n- 영상 싱크 확인\n\n2) 자막\n- 자동 캡션 생성\n- 오타/띄어쓰기 검수\n- 핵심 단어 강조 스타일 적용\n\n3) 쇼츠 품질\n- 첫 3초 훅 명확한가\n- 중간 이탈 구간 없는가\n- 마지막 CTA/여운 있는가\n\n4) 출력\n- MP4\n- 9:16\n- 고해상도(가능 시 4K)\n`
  );

  await replaceDoc(
    seeded["업로드 메타 템플릿"].id,
    `업로드 메타 템플릿\n\n제목 템플릿\n- [핵심 이득] + [시간/난이도] + [대상]\n\n설명 템플릿\n- 문제 상황 1문장\n- 핵심 해결 2문장\n- 행동 유도 1문장\n\n태그 템플릿\n- 메인 키워드 5개\n- 연관 키워드 10개\n- 롱테일 키워드 5개\n`
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        rootFolder: `https://drive.google.com/drive/folders/${root.id}`,
        seededDocs: Object.fromEntries(
          Object.entries(seeded).map(([k, v]) => [k, v.webViewLink || `https://docs.google.com/document/d/${v.id}/edit`])
        ),
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
